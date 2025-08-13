// API route pour les statistiques du dashboard agent
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// Forcer le rendu dynamique pour cette route API qui utilise les headers de session
export const dynamic = 'force-dynamic';

// Interface pour les statistiques agent
interface AgentStats {
  // Gestion des propriétés
  totalProperties: number;
  activeProperties: number;
  inactiveProperties: number;
  propertiesSoldThisMonth: number;
  propertiesAddedThisWeek: number;

  // Performance commerciale
  totalViews: number;
  totalVisitRequests: number;
  pendingVisitRequests: number;
  confirmedVisitRequests: number;
  totalMessages: number;
  unreadMessages: number;

  // Revenus et conversion
  totalRevenue: number;
  conversionRate: number; // vues → demandes de visite

  // Analytiques temporelles (30 derniers jours)
  viewsLast30Days: Array<{ date: string; views: number }>;
  
  // Propriétés par localisation
  propertiesByCity: Array<{ city: string; count: number }>;
  
  // Types de biens les plus demandés
  propertiesByType: Array<{ type: string; count: number; avgPrice: number }>;
  
  // Propriétés les plus vues
  topProperties: Array<{
    id: string;
    titre: string;
    views: number;
    visitRequests: number;
  }>;
  
  // Prix moyen vs marché
  avgPrice: number;
  marketAvgPrice: number;
}

// GET /api/dashboard/agent-stats - Récupérer les statistiques agent
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur est un agent
    if (session.user.role !== UserRole.AGENT) {
      return NextResponse.json(
        { error: 'Accès réservé aux agents' },
        { status: 403 }
      );
    }

    const agentId = session.user.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Récupérer les statistiques en parallèle
    const [
      totalProperties,
      activeProperties,
      propertiesSoldThisMonth,
      propertiesAddedThisWeek,
      totalVisitRequests,
      pendingVisitRequests,
      acceptedVisitRequests,
      agentProperties,
      marketProperties
    ] = await Promise.all([
      // Total des propriétés de l'agent
      prisma.property.count({
        where: { agentId }
      }),
      
      // Propriétés actives
      prisma.property.count({
        where: { agentId, isActive: true }
      }),
      
      // Propriétés vendues ce mois (simulé avec updatedAt)
      prisma.property.count({
        where: {
          agentId,
          updatedAt: { gte: startOfMonth },
          isActive: false // Considérer les inactives comme vendues/louées
        }
      }),
      
      // Propriétés ajoutées cette semaine
      prisma.property.count({
        where: {
          agentId,
          createdAt: { gte: startOfWeek }
        }
      }),
      
      // Total des demandes de visite
      prisma.visitRequest.count({
        where: {
          property: { agentId }
        }
      }),
      
      // Demandes de visite en attente
      prisma.visitRequest.count({
        where: {
          property: { agentId },
          status: 'PENDING'
        }
      }),
      
      // Demandes de visite acceptées
      prisma.visitRequest.count({
        where: {
          property: { agentId },
          status: 'ACCEPTED'
        }
      }),
      
      // Propriétés de l'agent avec détails
      prisma.property.findMany({
        where: { agentId },
        include: {
          _count: {
            select: {
              favorites: true,
              visitRequests: true
            }
          }
        }
      }),
      
      // Propriétés du marché pour comparaison
      prisma.property.findMany({
        where: { isActive: true },
        select: { prix: true }
      })
    ]);

    // Calculer les vues totales réelles depuis PropertyView
    const totalViews = await prisma.propertyView.count({
      where: {
        property: { agentId }
      }
    });
    
    // Calculer le taux de conversion
    const conversionRate = totalViews > 0 ? (totalVisitRequests / totalViews) * 100 : 0;
    
    // Calculer les prix moyens
    const avgPrice = agentProperties.length > 0 
      ? agentProperties.reduce((sum, prop) => sum + prop.prix, 0) / agentProperties.length
      : 0;
    
    const marketAvgPrice = marketProperties.length > 0
      ? marketProperties.reduce((sum, prop) => sum + prop.prix, 0) / marketProperties.length
      : 0;

    // Répartition par ville
    const propertiesByCity = agentProperties.reduce((acc, prop) => {
      const city = prop.adresse.split(',').pop()?.trim() || 'Inconnu';
      const existing = acc.find(item => item.city === city);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ city, count: 1 });
      }
      return acc;
    }, [] as Array<{ city: string; count: number }>);

    // Répartition par type
    const propertiesByType = agentProperties.reduce((acc, prop) => {
      const existing = acc.find(item => item.type === prop.type);
      if (existing) {
        existing.count++;
        existing.totalPrice += prop.prix;
      } else {
        acc.push({ 
          type: prop.type, 
          count: 1, 
          totalPrice: prop.prix,
          avgPrice: prop.prix 
        });
      }
      return acc;
    }, [] as Array<{ type: string; count: number; totalPrice: number; avgPrice: number }>)
    .map(item => ({
      type: item.type,
      count: item.count,
      avgPrice: item.totalPrice / item.count
    }));

    // Top propriétés avec vraies données de vues
    const propertyViewCounts = await prisma.propertyView.groupBy({
      by: ['propertyId'],
      where: {
        property: { agentId }
      },
      _count: {
        id: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5
    });

    const topProperties = await Promise.all(
      propertyViewCounts.map(async (viewCount) => {
        const property = agentProperties.find(p => p.id === viewCount.propertyId);
        return {
          id: viewCount.propertyId,
          titre: property?.titre || 'Propriété supprimée',
          views: viewCount._count.id,
          visitRequests: property?._count.visitRequests || 0
        };
      })
    );

    // Récupérer l'évolution réelle des vues (30 derniers jours)
    const thirtyDaysAgoStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Récupérer toutes les vues des 30 derniers jours
    const recentViews = await prisma.propertyView.findMany({
      where: {
        property: { agentId },
        createdAt: { gte: thirtyDaysAgoStart }
      },
      select: {
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Créer un Map pour compter les vues par jour
    const dailyViewsMap = new Map<string, number>();
    
    // Initialiser tous les jours des 30 derniers jours à 0
    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dailyViewsMap.set(dateStr, 0);
    }
    
    // Compter les vues réelles par jour
    recentViews.forEach(view => {
      const dateStr = view.createdAt.toISOString().split('T')[0];
      const currentCount = dailyViewsMap.get(dateStr) || 0;
      dailyViewsMap.set(dateStr, currentCount + 1);
    });

    // Convertir en tableau ordonné
    const viewsLast30Days = Array.from(dailyViewsMap.entries()).map(([date, views]) => ({
      date,
      views
    })).sort((a, b) => a.date.localeCompare(b.date));

    const stats: AgentStats = {
      // Gestion des propriétés
      totalProperties,
      activeProperties,
      inactiveProperties: totalProperties - activeProperties,
      propertiesSoldThisMonth,
      propertiesAddedThisWeek,

      // Performance commerciale
      totalViews,
      totalVisitRequests,
      pendingVisitRequests,
      confirmedVisitRequests: acceptedVisitRequests, // Mapping pour compatibilité
      totalMessages: Math.floor(totalVisitRequests * 1.5), // Simulé
      unreadMessages: Math.floor(pendingVisitRequests * 0.7), // Simulé

      // Revenus et conversion
      totalRevenue: propertiesSoldThisMonth * 500000, // Commission simulée
      conversionRate,

      // Analytiques
      viewsLast30Days,
      propertiesByCity,
      propertiesByType,
      topProperties,
      avgPrice,
      marketAvgPrice
    };

    return NextResponse.json(stats);

  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}