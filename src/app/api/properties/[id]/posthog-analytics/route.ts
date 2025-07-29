// API route pour récupérer les analytics PostHog d'une propriété spécifique
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Types pour les données PostHog
interface PostHogEvent {
  event: string;
  timestamp: string;
  properties: {
    property_id?: string;
    session_id?: string;
    total_time?: number;
    active_time?: number;
    scroll_depth?: number;
    user_id?: string;
    user_role?: string;
    [key: string]: any;
  };
  person?: {
    properties: {
      email?: string;
      role?: string;
      [key: string]: any;
    };
  };
}

interface PostHogApiResponse {
  results: PostHogEvent[];
  next?: string;
}

// Interface pour la réponse compatible avec l'existant
interface PropertyAnalytics {
  totalViews: number;
  totalSessions: number;
  averageTime: number;
  bounceRate: number;
  conversionRate: number;
  dailyTrends: Array<{
    date: string;
    sessions: number;
    averageTime: number;
  }>;
  topPages: Array<{
    page: string;
    views: number;
  }>;
  userTypes: {
    authenticated: number;
    anonymous: number;
  };
}

// Schéma de validation pour les paramètres de query
const querySchema = z.object({
  days: z.string().optional().default('30'),
  timezone: z.string().optional().default('UTC'),
});

// Fonction pour récupérer les événements PostHog
async function fetchPostHogEvents(
  propertyId: string,
  startDate: Date,
  endDate: Date
): Promise<PostHogEvent[]> {
  const POSTHOG_PERSONAL_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;
  const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID;
  
  if (!POSTHOG_PERSONAL_API_KEY || !POSTHOG_PROJECT_ID) {
    throw new Error('Configuration PostHog manquante');
  }

  const queryParams = new URLSearchParams({
    // Filtrer par propriété et période
    where: JSON.stringify([
      ['properties', 'property_id', 'exact', propertyId]
    ]),
    after: startDate.toISOString(),
    before: endDate.toISOString(),
    orderBy: '-timestamp',
    limit: '1000', // Limite raisonnable
  });

  const response = await fetch(
    `https://us.i.posthog.com/api/projects/${POSTHOG_PROJECT_ID}/events/?${queryParams}`,
    {
      headers: {
        'Authorization': `Bearer ${POSTHOG_PERSONAL_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    console.error('Erreur PostHog API:', response.status, response.statusText);
    throw new Error(`Erreur PostHog API: ${response.status}`);
  }

  const data: PostHogApiResponse = await response.json();
  return data.results || [];
}

// Fonction pour calculer les analytics à partir des événements PostHog
function calculatePropertyAnalytics(events: PostHogEvent[]): PropertyAnalytics {
  // Séparer les événements par type
  const viewEvents = events.filter(e => e.event === '$pageview' || e.event === 'property_viewed');
  const sessionStartEvents = events.filter(e => e.event === 'property_session_start');
  const sessionEndEvents = events.filter(e => e.event === 'property_session_end');
  const heartbeatEvents = events.filter(e => e.event === 'property_session_heartbeat');

  // Calculer les vues totales
  const totalViews = viewEvents.length;

  // Calculer les sessions (basé sur les starts ou les sessions uniques)
  const uniqueSessions = new Set(
    [...sessionStartEvents, ...sessionEndEvents, ...heartbeatEvents]
      .map(e => e.properties.session_id)
      .filter(Boolean)
  );
  const totalSessions = uniqueSessions.size;

  // Calculer le temps moyen à partir des sessions terminées
  const completedSessions = sessionEndEvents.filter(e => 
    e.properties.total_time && e.properties.total_time > 0
  );
  
  const totalTime = completedSessions.reduce((sum, session) => 
    sum + (session.properties.total_time || 0), 0
  );
  
  const averageTime = completedSessions.length > 0 ? 
    Math.round(totalTime / completedSessions.length) : 0;

  // Calculer le taux de rebond (sessions < 30 secondes)
  const shortSessions = completedSessions.filter(e => 
    (e.properties.total_time || 0) < 30
  ).length;
  const bounceRate = completedSessions.length > 0 ? 
    Math.round((shortSessions / completedSessions.length) * 100) : 0;

  // Calculer le taux de conversion (interactions significatives)
  const conversionEvents = events.filter(e => 
    e.event.includes('visit_request') || 
    e.event.includes('favorite') ||
    e.event.includes('contact')
  );
  const conversionRate = totalSessions > 0 ? 
    Math.round((conversionEvents.length / totalSessions) * 100) : 0;

  // Calculer les tendances quotidiennes
  const dailyMap = new Map<string, { sessions: Set<string>, timeSum: number, timeCount: number }>();
  
  [...sessionStartEvents, ...sessionEndEvents].forEach(event => {
    const date = new Date(event.timestamp).toISOString().split('T')[0];
    const sessionId = event.properties.session_id;
    
    if (!dailyMap.has(date)) {
      dailyMap.set(date, { sessions: new Set(), timeSum: 0, timeCount: 0 });
    }
    
    const dayData = dailyMap.get(date)!;
    if (sessionId) {
      dayData.sessions.add(sessionId);
    }
    
    // Ajouter le temps si c'est un événement de fin
    if (event.event === 'property_session_end' && event.properties.total_time) {
      dayData.timeSum += event.properties.total_time;
      dayData.timeCount++;
    }
  });

  const dailyTrends = Array.from(dailyMap.entries())
    .map(([date, data]) => ({
      date,
      sessions: data.sessions.size,
      averageTime: data.timeCount > 0 ? Math.round(data.timeSum / data.timeCount) : 0
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Calculer les types d'utilisateurs
  const authenticatedEvents = events.filter(e => 
    e.properties.user_id && e.properties.user_role !== 'ANONYMOUS'
  );
  const anonymousEvents = events.filter(e => 
    !e.properties.user_id || e.properties.user_role === 'ANONYMOUS'
  );

  return {
    totalViews,
    totalSessions,
    averageTime,
    bounceRate,
    conversionRate,
    dailyTrends,
    topPages: [
      { page: 'Détail propriété', views: totalViews }
    ],
    userTypes: {
      authenticated: authenticatedEvents.length,
      anonymous: anonymousEvents.length
    }
  };
}

// GET /api/properties/[id]/posthog-analytics - Récupérer les analytics PostHog
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: propertyId } = params;
    
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentication requise' },
        { status: 401 }
      );
    }

    // Valider les paramètres de query
    const { searchParams } = new URL(request.url);
    const { days } = querySchema.parse({
      days: searchParams.get('days') || '30',
    });

    // Calculer la période
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    console.log(`📊 Récupération analytics PostHog pour propriété ${propertyId} (${days} jours)`);

    // Récupérer les événements PostHog
    const events = await fetchPostHogEvents(propertyId, startDate, endDate);
    
    console.log(`📈 ${events.length} événements PostHog récupérés`);

    // Calculer les analytics
    const analytics = calculatePropertyAnalytics(events);

    console.log(`✅ Analytics calculés:`, {
      totalViews: analytics.totalViews,
      totalSessions: analytics.totalSessions,
      averageTime: analytics.averageTime,
      bounceRate: analytics.bounceRate
    });

    return NextResponse.json({
      success: true,
      data: analytics,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days: parseInt(days)
      },
      source: 'posthog'
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des analytics PostHog:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Paramètres invalides', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      if (error.message.includes('Configuration PostHog manquante')) {
        return NextResponse.json(
          { error: 'Configuration PostHog incomplète' },
          { status: 500 }
        );
      }
      
      if (error.message.includes('PostHog API')) {
        return NextResponse.json(
          { error: 'Erreur lors de la récupération des données PostHog' },
          { status: 502 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}