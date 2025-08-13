// API route pour les statistiques du dashboard admin
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// Forcer le rendu dynamique pour cette route API qui utilise les headers de session
export const dynamic = 'force-dynamic';

// Interface pour les statistiques admin
interface AdminStats {
  // Vue d'ensemble de la plateforme
  totalUsers: number;
  totalAgents: number;
  totalAcheteurs: number;
  newUsersThisMonth: number;
  
  // Propriétés
  totalProperties: number;
  activeProperties: number;
  pendingProperties: number;
  propertiesAddedThisMonth: number;
  
  // Activité
  totalVisitRequests: number;
  pendingVisitRequests: number;
  totalViews: number;
  
  // Revenus et finances
  totalRevenue: number;
  revenueThisMonth: number;
  avgPropertyPrice: number;
  
  // Analytics temporelles
  usersGrowth: Array<{ date: string; users: number }>;
  propertiesGrowth: Array<{ date: string; properties: number }>;
  
  // Géographie
  usersByCity: Array<{ city: string; count: number }>;
  propertiesByCity: Array<{ city: string; count: number; avgPrice: number }>;
  
  // Types de biens
  propertiesByType: Array<{ type: string; count: number; avgPrice: number }>;
  
  // Top agents
  topAgents: Array<{
    id: string;
    name: string;
    propertiesCount: number;
    totalViews: number;
    revenue: number;
  }>;
  
  // Activité récente
  recentActivities: Array<{
    type: 'USER_REGISTERED' | 'PROPERTY_ADDED' | 'VISIT_REQUESTED';
    description: string;
    timestamp: string;
  }>;
}

// GET /api/dashboard/admin-stats - Récupérer les statistiques admin
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

    // Vérifier que l'utilisateur est un admin
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      );
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Récupérer les statistiques en parallèle
    const [
      totalUsers,
      totalAgents,
      totalAcheteurs,
      newUsersThisMonth,
      totalProperties,
      activeProperties,
      propertiesAddedThisMonth,
      totalVisitRequests,
      pendingVisitRequests,
      allProperties,
      allUsers,
      agentsWithProperties
    ] = await Promise.all([
      // Utilisateurs
      prisma.user.count(),
      
      prisma.user.count({
        where: { role: UserRole.AGENT }
      }),
      
      prisma.user.count({
        where: { role: UserRole.ACHETEUR }
      }),
      
      prisma.user.count({
        where: { 
          createdAt: { gte: startOfMonth }
        }
      }),
      
      // Propriétés
      prisma.property.count(),
      
      prisma.property.count({
        where: { isActive: true }
      }),
      
      prisma.property.count({
        where: { 
          createdAt: { gte: startOfMonth }
        }
      }),
      
      // Demandes de visite
      prisma.visitRequest.count(),
      
      prisma.visitRequest.count({
        where: { status: 'PENDING' }
      }),
      
      // Données pour analytics
      prisma.property.findMany({
        select: {
          prix: true,
          type: true,
          adresse: true,
          createdAt: true,
          _count: {
            select: {
              favorites: true,
              visitRequests: true
            }
          }
        }
      }),
      
      prisma.user.findMany({
        select: {
          createdAt: true,
          role: true
        }
      }),
      
      // Agents avec leurs propriétés
      prisma.user.findMany({
        where: { role: UserRole.AGENT },
        include: {
          properties: {
            include: {
              _count: {
                select: {
                  favorites: true,
                  visitRequests: true
                }
              }
            }
          }
        }
      })
    ]);

    // Calculer les métriques dérivées
    const pendingProperties = 0; // À implémenter selon votre logique
    const totalViews = allProperties.reduce((sum, prop) => sum + prop._count.favorites * 10, 0);
    const avgPropertyPrice = allProperties.length > 0 
      ? allProperties.reduce((sum, prop) => sum + prop.prix, 0) / allProperties.length
      : 0;

    // Revenus simulés
    const totalRevenue = totalProperties * 500000; // Commission moyenne
    const revenueThisMonth = propertiesAddedThisMonth * 500000;

    // Croissance des utilisateurs (30 derniers jours)
    const usersGrowth = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
      const usersUpToDate = allUsers.filter(user => 
        new Date(user.createdAt) <= date
      ).length;
      
      return {
        date: date.toISOString().split('T')[0],
        users: usersUpToDate
      };
    });

    // Croissance des propriétés (30 derniers jours)
    const propertiesGrowth = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
      const propertiesUpToDate = allProperties.filter(prop => 
        new Date(prop.createdAt) <= date
      ).length;
      
      return {
        date: date.toISOString().split('T')[0],
        properties: propertiesUpToDate
      };
    });

    // Répartition des utilisateurs par ville (simulé à partir des agents)
    const usersByCity = [
      { city: 'Yaoundé', count: Math.floor(totalUsers * 0.4) },
      { city: 'Douala', count: Math.floor(totalUsers * 0.35) },
      { city: 'Bafoussam', count: Math.floor(totalUsers * 0.1) },
      { city: 'Garoua', count: Math.floor(totalUsers * 0.08) },
      { city: 'Autres', count: Math.floor(totalUsers * 0.07) }
    ];

    // Propriétés par ville
    const propertiesByCity = allProperties.reduce((acc, prop) => {
      const city = prop.adresse.split(',').pop()?.trim() || 'Inconnu';
      const existing = acc.find(item => item.city === city);
      if (existing) {
        existing.count++;
        existing.totalPrice += prop.prix;
      } else {
        acc.push({ 
          city, 
          count: 1, 
          totalPrice: prop.prix,
          avgPrice: prop.prix 
        });
      }
      return acc;
    }, [] as Array<{ city: string; count: number; totalPrice: number; avgPrice: number }>)
    .map(item => ({
      city: item.city,
      count: item.count,
      avgPrice: item.totalPrice / item.count
    }));

    // Propriétés par type
    const propertiesByType = allProperties.reduce((acc, prop) => {
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

    // Top agents
    const topAgents = agentsWithProperties
      .map(agent => {
        const totalViews = agent.properties.reduce(
          (sum, prop) => sum + prop._count.favorites * 10, 0
        );
        const revenue = agent.properties.length * 500000; // Simulé
        
        return {
          id: agent.id,
          name: `${agent.prenom} ${agent.nom}`,
          propertiesCount: agent.properties.length,
          totalViews,
          revenue
        };
      })
      .sort((a, b) => b.propertiesCount - a.propertiesCount)
      .slice(0, 5);

    // Activités récentes (simulées)
    const recentActivities = [
      {
        type: 'USER_REGISTERED' as const,
        description: 'Nouvel acheteur inscrit',
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        type: 'PROPERTY_ADDED' as const,
        description: 'Nouvelle propriété ajoutée à Yaoundé',
        timestamp: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString()
      },
      {
        type: 'VISIT_REQUESTED' as const,
        description: 'Demande de visite pour une maison à Douala',
        timestamp: new Date(now.getTime() - 8 * 60 * 60 * 1000).toISOString()
      }
    ];

    const stats: AdminStats = {
      // Vue d'ensemble
      totalUsers,
      totalAgents,
      totalAcheteurs,
      newUsersThisMonth,
      
      // Propriétés
      totalProperties,
      activeProperties,
      pendingProperties,
      propertiesAddedThisMonth,
      
      // Activité
      totalVisitRequests,
      pendingVisitRequests,
      totalViews,
      
      // Finances
      totalRevenue,
      revenueThisMonth,
      avgPropertyPrice,
      
      // Analytics
      usersGrowth,
      propertiesGrowth,
      usersByCity,
      propertiesByCity,
      propertiesByType,
      topAgents,
      recentActivities
    };

    return NextResponse.json(stats);

  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}