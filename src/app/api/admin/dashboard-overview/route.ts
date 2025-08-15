// API pour les données agrégées du dashboard admin
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// Forcer le rendu dynamique pour cette route API
export const dynamic = 'force-dynamic';

// GET /api/admin/dashboard-overview - Récupérer les données agrégées
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
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Récupération des données en parallèle
    const [
      // Utilisateurs
      totalUsers,
      totalAgents,
      totalAcheteurs,
      recentUsers,
      
      // Signalements
      totalReports,
      pendingReports,
      resolvedReports,
      recentReports,
      
      // Propriétés
      totalProperties,
      activeProperties,
      totalViews,
      
      // Top propriétés pour analytics
      topProperties
    ] = await Promise.all([
      // Compteurs utilisateurs
      prisma.user.count(),
      prisma.user.count({ where: { role: UserRole.AGENT } }),
      prisma.user.count({ where: { role: UserRole.ACHETEUR } }),
      
      // Utilisateurs récents
      prisma.user.findMany({
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          role: true,
          createdAt: true
        },
        where: {
          createdAt: { gte: sevenDaysAgo }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      
      // Compteurs signalements
      prisma.report.count(),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.report.count({ where: { status: 'RESOLVED' } }),
      
      // Signalements récents
      prisma.report.findMany({
        select: {
          id: true,
          motif: true,
          status: true,
          createdAt: true,
          property: {
            select: {
              titre: true
            }
          },
          user: {
            select: {
              nom: true,
              prenom: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }),
      
      // Propriétés
      prisma.property.count(),
      prisma.property.count({ where: { isActive: true } }),
      prisma.propertyView.count(),
      
      // Top propriétés
      prisma.property.findMany({
        select: {
          id: true,
          titre: true,
          agent: {
            select: {
              nom: true,
              prenom: true
            }
          },
          _count: {
            select: {
              views: true
            }
          }
        },
        orderBy: {
          views: {
            _count: 'desc'
          }
        },
        take: 5
      })
    ]);

    // Calculs de métriques
    const totalActiveUsers24h = await prisma.user.count({
      where: {
        lastLoginAt: {
          gte: new Date(now.getTime() - 24 * 60 * 60 * 1000)
        }
      }
    });

    // Calcul approximatif du taux de conversion
    const totalVisitRequests = await prisma.visitRequest.count();
    const conversionRate = totalViews > 0 ? Math.round((totalVisitRequests / totalViews) * 10000) / 100 : 0;

    // Formatage des données
    const dashboardData = {
      users: {
        total: totalUsers,
        agents: totalAgents,
        acheteurs: totalAcheteurs,
        recent: recentUsers.map(user => ({
          id: user.id,
          name: `${user.prenom} ${user.nom}`,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt.toISOString()
        }))
      },
      reports: {
        total: totalReports,
        pending: pendingReports,
        resolved: resolvedReports,
        recent: recentReports.map(report => ({
          id: report.id,
          motif: report.motif,
          status: report.status,
          createdAt: report.createdAt.toISOString(),
          property: {
            titre: report.property.titre
          },
          user: {
            nom: report.user.nom,
            prenom: report.user.prenom
          }
        }))
      },
      properties: {
        total: totalProperties,
        active: activeProperties,
        views: totalViews
      },
      analytics: {
        conversionRate,
        avgResponseTime: 245, // Valeur simulée - à intégrer avec monitoring réel
        activeUsers24h: totalActiveUsers24h,
        topProperties: topProperties.map(property => ({
          id: property.id,
          titre: property.titre,
          views: property._count.views,
          agent: {
            nom: property.agent.nom,
            prenom: property.agent.prenom
          }
        }))
      }
    };

    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error('Erreur API /admin/dashboard-overview:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}