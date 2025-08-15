// API pour les analytics avancées du dashboard admin
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// Forcer le rendu dynamique pour cette route API
export const dynamic = 'force-dynamic';

// Interface pour les analytics avancées
interface AdvancedAnalytics {
  // Métriques temporelles détaillées
  userRegistrations: {
    daily: Array<{ date: string; count: number; byRole: { agents: number; acheteurs: number } }>;
    weekly: Array<{ week: string; count: number; byRole: { agents: number; acheteurs: number } }>;
    monthly: Array<{ month: string; count: number; byRole: { agents: number; acheteurs: number } }>;
  };
  
  propertyActivity: {
    daily: Array<{ date: string; added: number; views: number; favorites: number; visits: number }>;
    weekly: Array<{ week: string; added: number; views: number; favorites: number; visits: number }>;
    topProperties: Array<{ 
      id: string; 
      titre: string; 
      views: number; 
      favorites: number; 
      visits: number;
      agent: { nom: string; prenom: string };
    }>;
  };
  
  agentPerformance: {
    topAgents: Array<{
      id: string;
      nom: string;
      prenom: string;
      propertiesCount: number;
      totalViews: number;
      totalFavorites: number;
      avgResponseTime: number;
      conversionRate: number;
    }>;
    agentActivity: Array<{ date: string; newProperties: number; responses: number }>;
  };
  
  geographicDistribution: {
    propertiesByCity: Array<{ city: string; count: number; avgPrice: number; views: number }>;
    usersByRegion: Array<{ region: string; agents: number; acheteurs: number }>;
  };
  
  conversionMetrics: {
    visitToContact: number;
    viewToFavorite: number;
    favoriteToVisit: number;
    reportRate: number;
  };
  
  systemHealth: {
    avgResponseTime: number;
    errorRate: number;
    activeUsers24h: number;
    peakHours: Array<{ hour: number; activity: number }>;
  };
}

// GET /api/admin/analytics - Récupérer les analytics avancées
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
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Récupération des données en parallèle
    const [
      // Utilisateurs
      allUsers,
      recentUsers,
      
      // Propriétés
      allProperties,
      recentProperties,
      propertyViews,
      propertyFavorites,
      visitRequests,
      
      // Agents avec performances
      agentsWithStats,
      
      // Signalements
      allReports
    ] = await Promise.all([
      // Utilisateurs avec dates
      prisma.user.findMany({
        select: {
          id: true,
          role: true,
          createdAt: true,
          lastLoginAt: true
        },
        where: {
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      
      // Utilisateurs récents (24h)
      prisma.user.count({
        where: {
          lastLoginAt: { gte: twentyFourHoursAgo }
        }
      }),
      
      // Propriétés avec détails
      prisma.property.findMany({
        select: {
          id: true,
          titre: true,
          prix: true,
          adresse: true,
          createdAt: true,
          agent: {
            select: { nom: true, prenom: true }
          },
          _count: {
            select: {
              views: true,
              favorites: true,
              visitRequests: true
            }
          }
        },
        where: {
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      
      // Propriétés récentes
      prisma.property.findMany({
        select: {
          id: true,
          createdAt: true
        },
        where: {
          createdAt: { gte: sevenDaysAgo }
        }
      }),
      
      // Vues de propriétés
      prisma.propertyView.findMany({
        select: {
          createdAt: true,
          propertyId: true
        },
        where: {
          createdAt: { gte: sevenDaysAgo }
        }
      }),
      
      // Favoris
      prisma.favorite.findMany({
        select: {
          createdAt: true,
          propertyId: true
        },
        where: {
          createdAt: { gte: sevenDaysAgo }
        }
      }),
      
      // Demandes de visite
      prisma.visitRequest.findMany({
        select: {
          createdAt: true,
          propertyId: true,
          status: true
        },
        where: {
          createdAt: { gte: sevenDaysAgo }
        }
      }),
      
      // Agents avec statistiques détaillées
      prisma.user.findMany({
        where: { role: UserRole.AGENT },
        select: {
          id: true,
          nom: true,
          prenom: true,
          properties: {
            select: {
              id: true,
              createdAt: true,
              _count: {
                select: {
                  views: true,
                  favorites: true,
                  visitRequests: true
                }
              }
            }
          },
          visitRequests: {
            select: {
              createdAt: true,
              status: true
            },
            where: {
              createdAt: { gte: sevenDaysAgo }
            }
          }
        }
      }),
      
      // Signalements
      prisma.report.findMany({
        select: {
          createdAt: true,
          status: true
        },
        where: {
          createdAt: { gte: thirtyDaysAgo }
        }
      })
    ]);

    // ===== TRAITEMENT DES DONNÉES =====

    // 1. Enregistrements d'utilisateurs
    const userRegistrations = {
      daily: generateDailyStats(allUsers, 7, (users, date) => {
        const dayUsers = users.filter(u => 
          new Date(u.createdAt).toDateString() === date.toDateString()
        );
        return {
          date: date.toISOString().split('T')[0],
          count: dayUsers.length,
          byRole: {
            agents: dayUsers.filter(u => u.role === UserRole.AGENT).length,
            acheteurs: dayUsers.filter(u => u.role === UserRole.ACHETEUR).length
          }
        };
      }),
      weekly: generateWeeklyStats(allUsers, 4, (users, weekStart) => {
        const weekUsers = users.filter(u => {
          const userDate = new Date(u.createdAt);
          const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
          return userDate >= weekStart && userDate < weekEnd;
        });
        return {
          week: weekStart.toISOString().split('T')[0],
          count: weekUsers.length,
          byRole: {
            agents: weekUsers.filter(u => u.role === UserRole.AGENT).length,
            acheteurs: weekUsers.filter(u => u.role === UserRole.ACHETEUR).length
          }
        };
      }),
      monthly: generateMonthlyStats(allUsers, 3, (users, monthStart) => {
        const monthUsers = users.filter(u => {
          const userDate = new Date(u.createdAt);
          return userDate.getMonth() === monthStart.getMonth() && 
                 userDate.getFullYear() === monthStart.getFullYear();
        });
        return {
          month: monthStart.toISOString().split('T')[0].substring(0, 7),
          count: monthUsers.length,
          byRole: {
            agents: monthUsers.filter(u => u.role === UserRole.AGENT).length,
            acheteurs: monthUsers.filter(u => u.role === UserRole.ACHETEUR).length
          }
        };
      })
    };

    // 2. Activité des propriétés
    const propertyActivity = {
      daily: generateDailyStats([], 7, (_, date) => {
        const dayViews = propertyViews.filter(v => 
          new Date(v.createdAt).toDateString() === date.toDateString()
        ).length;
        const dayFavorites = propertyFavorites.filter(f => 
          new Date(f.createdAt).toDateString() === date.toDateString()
        ).length;
        const dayVisits = visitRequests.filter(vr => 
          new Date(vr.createdAt).toDateString() === date.toDateString()
        ).length;
        const dayAdded = recentProperties.filter(p => 
          new Date(p.createdAt).toDateString() === date.toDateString()
        ).length;
        
        return {
          date: date.toISOString().split('T')[0],
          added: dayAdded,
          views: dayViews,
          favorites: dayFavorites,
          visits: dayVisits
        };
      }),
      weekly: [], // Simplifié pour la démo
      topProperties: allProperties
        .sort((a, b) => b._count.views - a._count.views)
        .slice(0, 10)
        .map(p => ({
          id: p.id,
          titre: p.titre,
          views: p._count.views,
          favorites: p._count.favorites,
          visits: p._count.visitRequests,
          agent: p.agent
        }))
    };

    // 3. Performance des agents
    const agentPerformance = {
      topAgents: agentsWithStats.map(agent => {
        const totalViews = agent.properties.reduce((sum, p) => sum + p._count.views, 0);
        const totalFavorites = agent.properties.reduce((sum, p) => sum + p._count.favorites, 0);
        const totalVisitRequests = agent.properties.reduce((sum, p) => sum + p._count.visitRequests, 0);
        
        // Calcul du taux de conversion approximatif
        const conversionRate = totalViews > 0 ? (totalVisitRequests / totalViews) * 100 : 0;
        
        return {
          id: agent.id,
          nom: agent.nom,
          prenom: agent.prenom,
          propertiesCount: agent.properties.length,
          totalViews,
          totalFavorites,
          avgResponseTime: 0, // Nécessiterait des données de temps de réponse
          conversionRate: Math.round(conversionRate * 100) / 100
        };
      }).sort((a, b) => b.totalViews - a.totalViews).slice(0, 10),
      agentActivity: [] // Simplifié pour la démo
    };

    // 4. Distribution géographique
    const geographicDistribution = {
      propertiesByCity: calculateCityDistribution(allProperties),
      usersByRegion: [] // Nécessiterait des données d'adresse utilisateur
    };

    // 5. Métriques de conversion
    const totalViews = propertyViews.length;
    const totalFavorites = propertyFavorites.length;
    const totalVisits = visitRequests.length;
    const totalReports = allReports.length;
    const totalProperties = allProperties.length;

    const conversionMetrics = {
      visitToContact: totalViews > 0 ? Math.round((totalVisits / totalViews) * 10000) / 100 : 0,
      viewToFavorite: totalViews > 0 ? Math.round((totalFavorites / totalViews) * 10000) / 100 : 0,
      favoriteToVisit: totalFavorites > 0 ? Math.round((totalVisits / totalFavorites) * 10000) / 100 : 0,
      reportRate: totalProperties > 0 ? Math.round((totalReports / totalProperties) * 10000) / 100 : 0
    };

    // 6. Santé du système (données simulées car nécessitent monitoring)
    const systemHealth = {
      avgResponseTime: 245, // ms - à intégrer avec un système de monitoring
      errorRate: 0.02, // 2% - à intégrer avec logs d'erreur
      activeUsers24h: recentUsers,
      peakHours: generatePeakHours(propertyViews)
    };

    const analytics: AdvancedAnalytics = {
      userRegistrations,
      propertyActivity,
      agentPerformance,
      geographicDistribution,
      conversionMetrics,
      systemHealth
    };

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Erreur API /admin/analytics:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// ===== FONCTIONS UTILITAIRES =====

function generateDailyStats<T>(data: any[], days: number, processor: (data: any[], date: Date) => T): T[] {
  const result: T[] = [];
  const now = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    result.push(processor(data, date));
  }
  
  return result;
}

function generateWeeklyStats<T>(data: any[], weeks: number, processor: (data: any[], weekStart: Date) => T): T[] {
  const result: T[] = [];
  const now = new Date();
  
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    result.push(processor(data, weekStart));
  }
  
  return result;
}

function generateMonthlyStats<T>(data: any[], months: number, processor: (data: any[], monthStart: Date) => T): T[] {
  const result: T[] = [];
  const now = new Date();
  
  for (let i = months - 1; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(processor(data, monthStart));
  }
  
  return result;
}

function calculateCityDistribution(properties: any[]) {
  const cityMap = new Map<string, { count: number; totalPrice: number; views: number }>();
  
  properties.forEach(property => {
    // Extraire la ville de l'adresse (dernière partie après la virgule)
    const city = property.adresse.split(',').pop()?.trim() || 'Inconnu';
    const existing = cityMap.get(city) || { count: 0, totalPrice: 0, views: 0 };
    
    cityMap.set(city, {
      count: existing.count + 1,
      totalPrice: existing.totalPrice + property.prix,
      views: existing.views + property._count.views
    });
  });
  
  return Array.from(cityMap.entries()).map(([city, data]) => ({
    city,
    count: data.count,
    avgPrice: Math.round(data.totalPrice / data.count),
    views: data.views
  })).sort((a, b) => b.count - a.count);
}

function generatePeakHours(views: any[]) {
  const hourCounts = new Array(24).fill(0);
  
  views.forEach(view => {
    const hour = new Date(view.createdAt).getHours();
    hourCounts[hour]++;
  });
  
  return hourCounts.map((count, hour) => ({ hour, activity: count }));
}