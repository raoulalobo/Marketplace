// API route pour les analytiques de vues des propriétés de l'agent
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// Forcer le rendu dynamique pour cette route API qui utilise les headers de session
export const dynamic = 'force-dynamic';

// Interface pour les données de vues par jour
interface DayViewData {
  date: string; // Format YYYY-MM-DD
  views: number;
}

// Interface pour les vues par propriété
interface PropertyViewData {
  propertyId: string;
  propertyTitle: string;
  totalViews: number;
  dailyViews: DayViewData[];
}

// GET /api/dashboard/agent-analytics/views - Récupérer les analytiques de vues
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
    
    // Récupérer les paramètres de requête
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '30'); // Par défaut 30 jours
    const propertyId = url.searchParams.get('propertyId'); // Optionnel : pour une propriété spécifique

    // Calculer la date de début
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Construire la requête WHERE
    const whereClause: any = {
      property: {
        agentId: agentId
      },
      createdAt: {
        gte: startDate
      }
    };

    if (propertyId) {
      whereClause.propertyId = propertyId;
    }

    // Récupérer toutes les vues avec les propriétés associées
    const viewsData = await prisma.propertyView.findMany({
      where: whereClause,
      include: {
        property: {
          select: {
            id: true,
            titre: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Générer la structure des jours pour les N derniers jours
    const dailyViewsMap = new Map<string, number>();
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dailyViewsMap.set(dateStr, 0);
    }

    // Compter les vues par jour
    viewsData.forEach(view => {
      const dateStr = view.createdAt.toISOString().split('T')[0];
      const currentCount = dailyViewsMap.get(dateStr) || 0;
      dailyViewsMap.set(dateStr, currentCount + 1);
    });

    // Convertir en tableau pour la réponse
    const dailyViews: DayViewData[] = Array.from(dailyViewsMap.entries()).map(([date, views]) => ({
      date,
      views
    }));

    // Calculer les statistiques générales
    const totalViews = viewsData.length;
    const averageViewsPerDay = totalViews / days;
    
    // Calculer la tendance (comparaison première moitié vs deuxième moitié de la période)
    const midPoint = Math.floor(days / 2);
    const firstHalfViews = dailyViews.slice(0, midPoint).reduce((sum, day) => sum + day.views, 0);
    const secondHalfViews = dailyViews.slice(midPoint).reduce((sum, day) => sum + day.views, 0);
    const trend = firstHalfViews > 0 ? ((secondHalfViews - firstHalfViews) / firstHalfViews) * 100 : 0;

    // Grouper par propriété si demandé
    let propertiesViews: PropertyViewData[] = [];
    if (!propertyId) {
      const propertiesMap = new Map<string, { title: string; views: any[] }>();
      
      viewsData.forEach(view => {
        const propId = view.property.id;
        if (!propertiesMap.has(propId)) {
          propertiesMap.set(propId, {
            title: view.property.titre,
            views: []
          });
        }
        propertiesMap.get(propId)!.views.push(view);
      });

      propertiesViews = Array.from(propertiesMap.entries()).map(([propertyId, data]) => {
        // Calculer les vues quotidiennes pour cette propriété
        const propertyDailyViews = new Map<string, number>();
        
        // Initialiser tous les jours à 0
        for (let i = 0; i < days; i++) {
          const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
          const dateStr = date.toISOString().split('T')[0];
          propertyDailyViews.set(dateStr, 0);
        }
        
        // Compter les vues par jour pour cette propriété
        data.views.forEach(view => {
          const dateStr = view.createdAt.toISOString().split('T')[0];
          const currentCount = propertyDailyViews.get(dateStr) || 0;
          propertyDailyViews.set(dateStr, currentCount + 1);
        });

        return {
          propertyId,
          propertyTitle: data.title,
          totalViews: data.views.length,
          dailyViews: Array.from(propertyDailyViews.entries()).map(([date, views]) => ({
            date,
            views
          }))
        };
      }).sort((a, b) => b.totalViews - a.totalViews); // Trier par nombre de vues décroissant
    }

    // Calculer les heures de pic (optionnel, pour insights avancés)
    const hourlyStats = new Array(24).fill(0);
    viewsData.forEach(view => {
      const hour = view.createdAt.getHours();
      hourlyStats[hour]++;
    });
    
    const peakHour = hourlyStats.indexOf(Math.max(...hourlyStats));

    // Préparer la réponse
    const response = {
      period: {
        days,
        startDate: startDate.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0]
      },
      overview: {
        totalViews,
        averageViewsPerDay: Math.round(averageViewsPerDay * 100) / 100,
        trend: Math.round(trend * 100) / 100, // Pourcentage de changement
        peakHour: peakHour
      },
      dailyViews,
      propertiesViews: propertiesViews.slice(0, 10), // Limiter aux 10 propriétés les plus vues
      insights: {
        bestPerformingDay: dailyViews.reduce((max, day) => day.views > max.views ? day : max, dailyViews[0]),
        totalUniqueProperties: propertiesViews.length,
        averageViewsPerProperty: propertiesViews.length > 0 
          ? Math.round((totalViews / propertiesViews.length) * 100) / 100 
          : 0
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erreur lors de la récupération des analytiques de vues:', error);
    
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}