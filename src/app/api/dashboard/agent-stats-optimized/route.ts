// API route optimisée pour les statistiques du dashboard agent
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { applyRateLimit } from '@/lib/rate-limit';

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

// GET /api/dashboard/agent-stats - Récupérer les statistiques agent (version optimisée)
export async function GET(request: NextRequest) {
  try {
    // Appliquer le rate limiting
    const rateLimitResult = await applyRateLimit(request, 'dashboard');
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response;
    }

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

    // Stratégie d'optimisation : utiliser des agrégations et réduire le nombre de requêtes
    
    // 1. Récupérer les propriétés de l'agent avec toutes les relations nécessaires
    const agentProperties = await prisma.property.findMany({
      where: { agentId },
      include: {
        _count: {
          select: {
            favorites: true,
            visitRequests: true,
            views: true
          }
        },
        medias: {
          take: 1,
          orderBy: { order: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // 2. Calculer les statistiques de base à partir des données déjà récupérées
    const totalProperties = agentProperties.length;
    const activeProperties = agentProperties.filter(p => p.isActive).length;
    const inactiveProperties = totalProperties - activeProperties;
    
    const propertiesSoldThisMonth = agentProperties.filter(
      p => !p.isActive && p.updatedAt >= startOfMonth
    ).length;
    
    const propertiesAddedThisWeek = agentProperties.filter(
      p => p.createdAt >= startOfWeek
    ).length;

    // 3. Agréger les données de vues et demandes de visite
    const totalViews = agentProperties.reduce((sum, prop) => sum + prop._count.views, 0);
    const totalVisitRequests = agentProperties.reduce((sum, prop) => sum + prop._count.visitRequests, 0);
    
    // Calculer les statuts des demandes de visite avec une seule requête
    const visitRequestStatuses = await prisma.visitRequest.groupBy({
      by: ['status'],
      where: {
        property: { agentId }
      },
      _count: {
        id: true
      }
    });

    const statusCounts = visitRequestStatuses.reduce((acc, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    const pendingVisitRequests = statusCounts['PENDING'] || 0;
    const confirmedVisitRequests = statusCounts['ACCEPTED'] || 0;

    // 4. Calculer le taux de conversion
    const conversionRate = totalViews > 0 ? (totalVisitRequests / totalViews) * 100 : 0;

    // 5. Calculer les prix moyens
    const avgPrice = agentProperties.length > 0 
      ? agentProperties.reduce((sum, prop) => sum + prop.prix, 0) / agentProperties.length
      : 0;

    // 6. Obtenir le prix moyen du marché avec une agrégation optimisée
    const marketStats = await prisma.property.aggregate({
      where: { isActive: true },
      _avg: { prix: true },
      _count: { id: true }
    });
    const marketAvgPrice = marketStats._avg.prix || 0;

    // 7. Calculer les répartitions avec des réductions en mémoire
    const propertiesByCity = agentProperties.reduce((acc, prop) => {
      const city = prop.adresse.split(',').pop()?.trim() || 'Inconnu';
      const existing = acc.find(item => item.city === city);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ city, count: 1 });
      }
      return acc;
    }, [] as Array<{ city: string; count: number }>)
    .sort((a, b) => b.count - a.count); // Trier par popularité

    const propertiesByType = agentProperties.reduce((acc, prop) => {
      const existing = acc.find(item => item.type === prop.type);
      if (existing) {
        existing.count++;
        existing.totalPrice += prop.prix;
      } else {
        acc.push({ 
          type: prop.type, 
          count: 1, 
          totalPrice: prop.prix
        });
      }
      return acc;
    }, [] as Array<{ type: string; count: number; totalPrice: number }>)
    .map(item => ({
      type: item.type,
      count: item.count,
      avgPrice: item.totalPrice / item.count
    }))
    .sort((a, b) => b.count - a.count); // Trier par popularité

    // 8. Top propriétés (déjà calculées via le tri des propriétés)
    const topProperties = agentProperties
      .sort((a, b) => b._count.views - a._count.views)
      .slice(0, 5)
      .map(prop => ({
        id: prop.id,
        titre: prop.titre,
        views: prop._count.views,
        visitRequests: prop._count.visitRequests
      }));

    // 9. Récupérer l'évolution des vues des 30 derniers jours avec une requête optimisée
    const dailyViewStats = await prisma.propertyView.groupBy({
      by: ['propertyId', 'createdAt'],
      where: {
        property: { agentId },
        createdAt: { gte: thirtyDaysAgo }
      },
      _count: {
        id: true
      }
    });

    // Agréger les vues par jour en mémoire
    const dailyViewsMap = new Map<string, number>();
    
    // Initialiser tous les jours des 30 derniers jours à 0
    for (let i = 0; i < 30; i++) {
      const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dailyViewsMap.set(dateStr, 0);
    }
    
    // Compter les vues par jour
    dailyViewStats.forEach(stat => {
      const dateStr = stat.createdAt.toISOString().split('T')[0];
      const currentCount = dailyViewsMap.get(dateStr) || 0;
      dailyViewsMap.set(dateStr, currentCount + stat._count.id);
    });

    const viewsLast30Days = Array.from(dailyViewsMap.entries())
      .map(([date, views]) => ({ date, views }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // 10. Calculer les revenus (simulation basée sur les ventes)
    const totalRevenue = propertiesSoldThisMonth * 500000; // Commission simulée

    const stats: AgentStats = {
      // Gestion des propriétés
      totalProperties,
      activeProperties,
      inactiveProperties,
      propertiesSoldThisMonth,
      propertiesAddedThisWeek,

      // Performance commerciale
      totalViews,
      totalVisitRequests,
      pendingVisitRequests,
      confirmedVisitRequests,
      totalMessages: Math.floor(totalVisitRequests * 1.5), // Simulé
      unreadMessages: Math.floor(pendingVisitRequests * 0.7), // Simulé

      // Revenus et conversion
      totalRevenue,
      conversionRate,

      // Analytiques
      viewsLast30Days,
      propertiesByCity,
      propertiesByType,
      topProperties,
      avgPrice,
      marketAvgPrice
    };

    // Ajouter les headers de cache pour les données qui changent peu fréquemment
    const response = NextResponse.json(stats);
    
    // Cache pour les données de dashboard (5 minutes)
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=60');
    
    // Ajouter les headers de rate limiting
    if (rateLimitResult.headers) {
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }

    return response;

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques agent:', error);
    
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}