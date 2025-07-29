// API route pour les analytics de temps passé sur les propriétés de l'agent
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// Forcer le rendu dynamique pour cette route API qui utilise les headers de session
export const dynamic = 'force-dynamic';

// Interface pour les analytics de temps
interface TimeAnalytics {
  overview: {
    totalSessions: number;
    averageTimeSpent: number; // en secondes
    averageActiveTime: number; // en secondes
    averageScrollDepth: number; // pourcentage
    bounceRate: number; // pourcentage (sessions < 30s)
    engagementRate: number; // pourcentage (sessions > 2min)
  };
  propertiesPerformance: Array<{
    propertyId: string;
    propertyTitle: string;
    totalSessions: number;
    averageTimeSpent: number;
    averageActiveTime: number;
    averageScrollDepth: number;
    bounceRate: number;
    conversionRate: number; // visitRequests / sessions
  }>;
  timeDistribution: Array<{
    timeRange: string; // "0-30s", "30s-2min", etc.
    count: number;
    percentage: number;
  }>;
  engagementEvents: Array<{
    eventType: string;
    count: number;
    properties: Array<{
      propertyId: string;
      propertyTitle: string;
      count: number;
    }>;
  }>;
  trends: {
    dailyAverages: Array<{
      date: string;
      averageTimeSpent: number;
      sessionsCount: number;
    }>;
  };
}

// GET /api/dashboard/agent-time-analytics - Récupérer les analytics de temps
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

    // Calculer la date de début
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Récupérer toutes les sessions de temps pour les propriétés de l'agent
    const allTimeSessions = await prisma.propertyTimeSession.findMany({
      where: {
        property: {
          agentId: agentId
        },
        enteredAt: {
          gte: startDate
        },
        timeSpent: {
          not: null // Seulement les sessions terminées
        }
      },
      include: {
        property: {
          select: {
            id: true,
            titre: true,
            createdAt: true, // Ajouter la date de création pour filtrer
            _count: {
              select: {
                visitRequests: true
              }
            }
          }
        }
      },
      orderBy: {
        enteredAt: 'desc'
      }
    });

    // IMPORTANT: Filtrer les sessions pour qu'elles soient postérieures à la création de la propriété
    const timeSessions = allTimeSessions.filter(session => {
      const sessionDate = new Date(session.enteredAt);
      const propertyCreationDate = new Date(session.property.createdAt);
      return sessionDate >= propertyCreationDate;
    });

    // Calculer les métriques globales
    const totalSessions = timeSessions.length;
    const averageTimeSpent = totalSessions > 0 ? 
      timeSessions.reduce((sum, session) => sum + (session.timeSpent || 0), 0) / totalSessions : 0;
    const averageActiveTime = totalSessions > 0 ? 
      timeSessions.reduce((sum, session) => sum + (session.activeTime || session.timeSpent || 0), 0) / totalSessions : 0;
    const averageScrollDepth = totalSessions > 0 ? 
      timeSessions.reduce((sum, session) => sum + (session.scrollDepth || 0), 0) / totalSessions : 0;

    // Calculer le taux de rebond (sessions < 30 secondes)
    const bounceSessions = timeSessions.filter(session => (session.timeSpent || 0) < 30).length;
    const bounceRate = totalSessions > 0 ? (bounceSessions / totalSessions) * 100 : 0;

    // Calculer le taux d'engagement (sessions > 2 minutes)
    const engagedSessions = timeSessions.filter(session => (session.timeSpent || 0) > 120).length;
    const engagementRate = totalSessions > 0 ? (engagedSessions / totalSessions) * 100 : 0;

    // Grouper par propriété pour les performances individuelles
    const propertiesMap = new Map<string, {
      title: string;
      sessions: typeof timeSessions;
      visitRequestsCount: number;
    }>();

    timeSessions.forEach(session => {
      const propId = session.property.id;
      if (!propertiesMap.has(propId)) {
        propertiesMap.set(propId, {
          title: session.property.titre,
          sessions: [],
          visitRequestsCount: session.property._count.visitRequests
        });
      }
      propertiesMap.get(propId)!.sessions.push(session);
    });

    // Calculer les performances par propriété
    const propertiesPerformance = Array.from(propertiesMap.entries()).map(([propertyId, data]) => {
      const sessions = data.sessions;
      const sessionCount = sessions.length;
      const avgTime = sessionCount > 0 ? 
        sessions.reduce((sum, s) => sum + (s.timeSpent || 0), 0) / sessionCount : 0;
      const avgActiveTime = sessionCount > 0 ? 
        sessions.reduce((sum, s) => sum + (s.activeTime || s.timeSpent || 0), 0) / sessionCount : 0;
      const avgScrollDepth = sessionCount > 0 ? 
        sessions.reduce((sum, s) => sum + (s.scrollDepth || 0), 0) / sessionCount : 0;
      const bounces = sessions.filter(s => (s.timeSpent || 0) < 30).length;
      const propertyBounceRate = sessionCount > 0 ? (bounces / sessionCount) * 100 : 0;
      const conversionRate = sessionCount > 0 ? (data.visitRequestsCount / sessionCount) * 100 : 0;

      return {
        propertyId,
        propertyTitle: data.title,
        totalSessions: sessionCount,
        averageTimeSpent: Math.round(avgTime),
        averageActiveTime: Math.round(avgActiveTime),
        averageScrollDepth: Math.round(avgScrollDepth * 100) / 100,
        bounceRate: Math.round(propertyBounceRate * 100) / 100,
        conversionRate: Math.round(conversionRate * 100) / 100
      };
    }).sort((a, b) => b.totalSessions - a.totalSessions);

    // Distribution du temps passé
    const timeRanges = [
      { label: '0-30s', min: 0, max: 30 },
      { label: '30s-2min', min: 30, max: 120 },
      { label: '2-5min', min: 120, max: 300 },
      { label: '5-10min', min: 300, max: 600 },
      { label: '10min+', min: 600, max: Infinity }
    ];

    const timeDistribution = timeRanges.map(range => {
      const count = timeSessions.filter(session => {
        const time = session.timeSpent || 0;
        return time >= range.min && time < range.max;
      }).length;
      
      return {
        timeRange: range.label,
        count,
        percentage: totalSessions > 0 ? Math.round((count / totalSessions) * 100 * 100) / 100 : 0
      };
    });

    // Analyser les événements d'engagement
    const eventCounts = new Map<string, Map<string, { title: string; count: number }>>();
    
    timeSessions.forEach(session => {
      if (session.events && Array.isArray(session.events)) {
        (session.events as any[]).forEach((event: any) => {
          if (!eventCounts.has(event.type)) {
            eventCounts.set(event.type, new Map());
          }
          
          const propertyMap = eventCounts.get(event.type)!;
          const propId = session.property.id;
          
          if (!propertyMap.has(propId)) {
            propertyMap.set(propId, {
              title: session.property.titre,
              count: 0
            });
          }
          
          propertyMap.get(propId)!.count++;
        });
      }
    });

    const engagementEvents = Array.from(eventCounts.entries()).map(([eventType, propertyMap]) => {
      const totalCount = Array.from(propertyMap.values()).reduce((sum, prop) => sum + prop.count, 0);
      const properties = Array.from(propertyMap.entries()).map(([propertyId, data]) => ({
        propertyId,
        propertyTitle: data.title,
        count: data.count
      })).sort((a, b) => b.count - a.count);

      return {
        eventType,
        count: totalCount,
        properties
      };
    }).sort((a, b) => b.count - a.count);

    // Tendances quotidiennes
    const dailyMap = new Map<string, { timeSum: number; count: number }>();
    
    timeSessions.forEach(session => {
      const dateStr = session.enteredAt.toISOString().split('T')[0];
      if (!dailyMap.has(dateStr)) {
        dailyMap.set(dateStr, { timeSum: 0, count: 0 });
      }
      const dayData = dailyMap.get(dateStr)!;
      dayData.timeSum += session.timeSpent || 0;
      dayData.count++;
    });

    const dailyAverages = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      averageTimeSpent: data.count > 0 ? Math.round(data.timeSum / data.count) : 0,
      sessionsCount: data.count
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Construire la réponse
    const analytics: TimeAnalytics = {
      overview: {
        totalSessions,
        averageTimeSpent: Math.round(averageTimeSpent),
        averageActiveTime: Math.round(averageActiveTime),
        averageScrollDepth: Math.round(averageScrollDepth * 100) / 100,
        bounceRate: Math.round(bounceRate * 100) / 100,
        engagementRate: Math.round(engagementRate * 100) / 100
      },
      propertiesPerformance: propertiesPerformance.slice(0, 10), // Top 10
      timeDistribution,
      engagementEvents: engagementEvents.slice(0, 10), // Top 10 events
      trends: {
        dailyAverages
      }
    };

    return NextResponse.json(analytics);

  } catch (error) {
    console.error('Erreur lors de la récupération des analytics de temps:', error);
    
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}