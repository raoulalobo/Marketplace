// API route pour les analytics spécifiques à une propriété
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// Forcer le rendu dynamique pour cette route API
export const dynamic = 'force-dynamic';

// Interface pour les analytics spécifiques à une propriété
interface PropertyAnalytics {
  overview: {
    totalSessions: number;
    completedSessions: number;
    averageTimeSpent: number;
    averageScrollDepth: number;
    bounceRate: number;
    viewsCount: number;
  };
  timeDistribution: Array<{
    timeRange: string;
    count: number;
    percentage: number;
  }>;
  engagementEvents: Array<{
    eventType: string;
    count: number;
  }>;
  trends: {
    dailyAverages: Array<{
      date: string;
      averageTimeSpent: number;
      sessionsCount: number;
    }>;
  };
}

// GET /api/properties/[id]/analytics - Analytics spécifiques à une propriété
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const propertyId = params.id;
    
    // Vérifier que la propriété existe et appartient à l'agent connecté
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        titre: true,
        createdAt: true,
        agentId: true,
        viewsCount: true
      }
    });
    
    if (!property) {
      return NextResponse.json(
        { error: 'Propriété non trouvée' },
        { status: 404 }
      );
    }
    
    // Vérifier les permissions (agent propriétaire ou admin)
    if (session.user.role === UserRole.AGENT && session.user.id !== property.agentId) {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      );
    }
    
    // Récupérer les paramètres de requête
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    
    // Calculer la date de début (mais pas avant la création de la propriété)
    const now = new Date();
    const requestedStartDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const propertyCreatedAt = new Date(property.createdAt);
    const startDate = requestedStartDate > propertyCreatedAt ? requestedStartDate : propertyCreatedAt;
    
    // Récupérer TOUTES les sessions pour cette propriété (terminées ET en cours)
    const allSessions = await prisma.propertyTimeSession.findMany({
      where: {
        propertyId: propertyId,
        enteredAt: {
          gte: startDate
        }
      },
      select: {
        id: true,
        sessionId: true,
        enteredAt: true,
        lastActiveAt: true,
        leftAt: true,
        timeSpent: true,
        activeTime: true,
        scrollDepth: true,
        events: true
      },
      orderBy: {
        enteredAt: 'desc'
      }
    });
    
    // Séparer les sessions terminées et incomplètes
    const completedSessions = allSessions.filter(s => s.timeSpent !== null);
    const incompleteSessions = allSessions.filter(s => s.timeSpent === null);
    
    // Calculer les métriques de base
    const totalSessions = allSessions.length;
    const completedSessionsCount = completedSessions.length;
    
    // Calculer le temps moyen (avec estimation pour sessions incomplètes)
    let totalTimeSum = 0;
    let validSessionsCount = 0;
    
    // Ajouter le temps des sessions terminées
    completedSessions.forEach(session => {
      totalTimeSum += session.timeSpent || 0;
      validSessionsCount++;
    });
    
    // Estimer le temps pour les sessions incomplètes
    incompleteSessions.forEach(session => {
      if (session.lastActiveAt) {
        const estimatedTime = Math.round(
          (new Date(session.lastActiveAt).getTime() - new Date(session.enteredAt).getTime()) / 1000
        );
        
        // Accepter les estimations raisonnables (5s à 1h)
        if (estimatedTime >= 5 && estimatedTime <= 3600) {
          totalTimeSum += estimatedTime;
          validSessionsCount++;
        }
      }
    });
    
    const averageTimeSpent = validSessionsCount > 0 ? Math.round(totalTimeSum / validSessionsCount) : 0;
    
    // Calculer le scroll moyen
    const scrollSum = allSessions.reduce((sum, s) => sum + (s.scrollDepth || 0), 0);
    const averageScrollDepth = totalSessions > 0 ? scrollSum / totalSessions : 0;
    
    // Calculer le taux de rebond (sessions < 30s, en incluant les estimations)
    let bounceCount = 0;
    
    completedSessions.forEach(session => {
      if ((session.timeSpent || 0) < 30) {
        bounceCount++;
      }
    });
    
    incompleteSessions.forEach(session => {
      if (session.lastActiveAt) {
        const estimatedTime = Math.round(
          (new Date(session.lastActiveAt).getTime() - new Date(session.enteredAt).getTime()) / 1000
        );
        if (estimatedTime >= 5 && estimatedTime < 30) {
          bounceCount++;
        }
      }
    });
    
    const bounceRate = validSessionsCount > 0 ? (bounceCount / validSessionsCount) * 100 : 0;
    
    // Distribution du temps (seulement sessions avec temps valide)
    const timeRanges = [
      { label: '0-30s', min: 0, max: 30 },
      { label: '30s-2min', min: 30, max: 120 },
      { label: '2-5min', min: 120, max: 300 },
      { label: '5-10min', min: 300, max: 600 },
      { label: '10min+', min: 600, max: Infinity }
    ];
    
    const timeDistribution = timeRanges.map(range => {
      let count = 0;
      
      // Compter les sessions terminées
      completedSessions.forEach(session => {
        const time = session.timeSpent || 0;
        if (time >= range.min && time < range.max) {
          count++;
        }
      });
      
      // Compter les sessions incomplètes estimées
      incompleteSessions.forEach(session => {
        if (session.lastActiveAt) {
          const estimatedTime = Math.round(
            (new Date(session.lastActiveAt).getTime() - new Date(session.enteredAt).getTime()) / 1000
          );
          if (estimatedTime >= 5 && estimatedTime >= range.min && estimatedTime < range.max) {
            count++;
          }
        }
      });
      
      return {
        timeRange: range.label,
        count,
        percentage: validSessionsCount > 0 ? Math.round((count / validSessionsCount) * 100 * 100) / 100 : 0
      };
    });
    
    // Événements d'engagement
    const eventCounts = new Map<string, number>();
    
    allSessions.forEach(session => {
      if (session.events && Array.isArray(session.events)) {
        (session.events as any[]).forEach((event: any) => {
          eventCounts.set(event.type, (eventCounts.get(event.type) || 0) + 1);
        });
      }
    });
    
    const engagementEvents = Array.from(eventCounts.entries()).map(([eventType, count]) => ({
      eventType,
      count
    })).sort((a, b) => b.count - a.count);
    
    // Tendances quotidiennes (seulement pour cette propriété, après sa création)
    const dailyMap = new Map<string, { timeSum: number; count: number }>();
    
    allSessions.forEach(session => {
      const sessionDate = new Date(session.enteredAt);
      
      // Vérifier que la session est postérieure à la création de la propriété
      if (sessionDate >= propertyCreatedAt) {
        const dateStr = sessionDate.toISOString().split('T')[0];
        
        if (!dailyMap.has(dateStr)) {
          dailyMap.set(dateStr, { timeSum: 0, count: 0 });
        }
        
        const dayData = dailyMap.get(dateStr)!;
        
        // Ajouter le temps (terminé ou estimé)
        let sessionTime = 0;
        if (session.timeSpent !== null) {
          sessionTime = session.timeSpent;
        } else if (session.lastActiveAt) {
          const estimatedTime = Math.round(
            (new Date(session.lastActiveAt).getTime() - sessionDate.getTime()) / 1000
          );
          if (estimatedTime >= 5 && estimatedTime <= 3600) {
            sessionTime = estimatedTime;
          }
        }
        
        if (sessionTime > 0) {
          dayData.timeSum += sessionTime;
          dayData.count++;
        }
      }
    });
    
    const dailyAverages = Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      averageTimeSpent: data.count > 0 ? Math.round(data.timeSum / data.count) : 0,
      sessionsCount: data.count
    })).sort((a, b) => a.date.localeCompare(b.date));
    
    // Récupérer le nombre de vues réelles (postérieures à la création)
    const actualViewsCount = await prisma.propertyView.count({
      where: {
        propertyId: propertyId,
        createdAt: {
          gte: propertyCreatedAt
        }
      }
    });
    
    // Construire la réponse
    const analytics: PropertyAnalytics = {
      overview: {
        totalSessions,
        completedSessions: completedSessionsCount,
        averageTimeSpent,
        averageScrollDepth: Math.round(averageScrollDepth * 100) / 100,
        bounceRate: Math.round(bounceRate * 100) / 100,
        viewsCount: actualViewsCount
      },
      timeDistribution,
      engagementEvents,
      trends: {
        dailyAverages
      }
    };
    
    return NextResponse.json(analytics);
    
  } catch (error) {
    console.error('Erreur lors de la récupération des analytics de propriété:', error);
    
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}