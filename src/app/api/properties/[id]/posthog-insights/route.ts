// API route pour récupérer les insights immobiliers avancés depuis PostHog
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Types pour les événements PostHog enrichis
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
    engagement_type?: string;
    intent_level?: string;
    milestone?: string;
    device_type?: string;
    time_before_engagement?: number;
    [key: string]: any;
  };
}

interface PostHogApiResponse {
  results: PostHogEvent[];
  next?: string;
}

// Interface pour les insights enrichis
interface PropertyInsights {
  // Métriques de base (from existing API)
  totalViews: number;
  totalSessions: number;
  averageTime: number;
  bounceRate: number;
  conversionRate: number;
  
  // Métriques avancées
  scrollAnalytics: {
    averageDepth: number;
    completionRate: number;
    milestones: {
      '25%': number;
      '50%': number;
      '75%': number;
      '90%': number;
    };
  };
  
  engagementMetrics: {
    totalEngagements: number;
    averageTimeToEngagement: number;
    deviceBreakdown: {
      mobile: number;
      tablet: number;
      desktop: number;
    };
  };
  
  intentSignals: {
    total: number;
    high: number;
    medium: number;
    low: number;
    averageTimeToIntent: number;
  };
  
  funnelAnalysis: {
    viewToScroll: number; // %
    scrollToEngagement: number; // %
    engagementToContact: number; // %
    overallConversion: number; // %
  };
  
  timeAnalysis: {
    hourlyBreakdown: Array<{
      hour: number;
      sessions: number;
      averageTime: number;
    }>;
    weeklyTrends: Array<{
      day: string;
      sessions: number;
      engagement: number;
    }>;
  };
}

// Schéma de validation
const querySchema = z.object({
  days: z.string().optional().default('30'),
  includeEvents: z.string().optional().default('true'),
});

// Fonction pour récupérer tous les événements PostHog enrichis
async function fetchPostHogEnrichedEvents(
  propertyId: string,
  startDate: Date,
  endDate: Date
): Promise<PostHogEvent[]> {
  const POSTHOG_PERSONAL_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY;
  const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID;
  
  if (!POSTHOG_PERSONAL_API_KEY || !POSTHOG_PROJECT_ID) {
    throw new Error('Configuration PostHog manquante');
  }

  // Récupérer tous les événements property_* pour cette propriété
  const eventTypes = [
    'property_session_start',
    'property_session_end',
    'property_session_heartbeat',
    'property_scroll_milestone',
    'property_scroll_complete',
    'property_engagement',
    'property_purchase_intent',
    'property_visit_request_clicked',
    'property_favorite_clicked',
    'property_share_clicked',
    'property_image_changed',
    '$pageview'
  ];

  const allEvents: PostHogEvent[] = [];

  // Faire plusieurs requêtes pour récupérer différents types d'événements
  for (const eventType of eventTypes) {
    try {
      const queryParams = new URLSearchParams({
        where: JSON.stringify([
          ['properties', 'property_id', 'exact', propertyId],
          ['event', 'exact', eventType]
        ]),
        after: startDate.toISOString(),
        before: endDate.toISOString(),
        orderBy: '-timestamp',
        limit: '500',
      });

      const response = await fetch(
        `https://app.posthog.com/api/projects/${POSTHOG_PROJECT_ID}/events/?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${POSTHOG_PERSONAL_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data: PostHogApiResponse = await response.json();
        allEvents.push(...(data.results || []));
      }
    } catch (error) {
      console.warn(`Erreur récupération événements ${eventType}:`, error);
    }
  }

  return allEvents;
}

// Fonction pour analyser les insights immobiliers
function analyzePropertyInsights(events: PostHogEvent[]): PropertyInsights {
  // Séparer les événements par type
  const sessionStarts = events.filter(e => e.event === 'property_session_start');
  const sessionEnds = events.filter(e => e.event === 'property_session_end');
  const pageViews = events.filter(e => e.event === '$pageview');
  const scrollMilestones = events.filter(e => e.event === 'property_scroll_milestone');
  const scrollCompletes = events.filter(e => e.event === 'property_scroll_complete');
  const engagements = events.filter(e => e.event === 'property_engagement');
  const intentSignals = events.filter(e => e.event === 'property_purchase_intent');
  const contactEvents = events.filter(e => 
    e.event === 'property_visit_request_clicked' || 
    e.event === 'property_favorite_clicked'
  );

  // Métriques de base
  const totalViews = pageViews.length;
  const totalSessions = sessionStarts.length;
  const completedSessions = sessionEnds.filter(e => e.properties.total_time && e.properties.total_time > 0);
  const averageTime = completedSessions.length > 0 ? 
    completedSessions.reduce((sum, s) => sum + (s.properties.total_time || 0), 0) / completedSessions.length : 0;
  
  const shortSessions = completedSessions.filter(e => (e.properties.total_time || 0) < 30);
  const bounceRate = completedSessions.length > 0 ? (shortSessions.length / completedSessions.length) * 100 : 0;
  const conversionRate = totalSessions > 0 ? (contactEvents.length / totalSessions) * 100 : 0;

  // Analyse du scroll
  const scrollMilestoneCount = {
    '25%': scrollMilestones.filter(e => e.properties.milestone === '25%').length,
    '50%': scrollMilestones.filter(e => e.properties.milestone === '50%').length,
    '75%': scrollMilestones.filter(e => e.properties.milestone === '75%').length,
    '90%': scrollCompletes.length,
  };

  const scrollAnalytics = {
    averageDepth: scrollMilestones.length > 0 ? 
      scrollMilestones.reduce((sum, e) => {
        const depth = parseFloat(e.properties.milestone?.replace('%', '') || '0');
        return sum + depth;
      }, 0) / scrollMilestones.length : 0,
    completionRate: totalSessions > 0 ? (scrollCompletes.length / totalSessions) * 100 : 0,
    milestones: scrollMilestoneCount
  };

  // Analyse des engagements
  const deviceCounts = {
    mobile: engagements.filter(e => e.properties.device_type === 'mobile').length,
    tablet: engagements.filter(e => e.properties.device_type === 'tablet').length,
    desktop: engagements.filter(e => e.properties.device_type === 'desktop').length,
  };

  const engagementMetrics = {
    totalEngagements: engagements.length,
    averageTimeToEngagement: engagements.length > 0 ?
      engagements.reduce((sum, e) => sum + (e.properties.time_before_engagement || 0), 0) / engagements.length : 0,
    deviceBreakdown: deviceCounts
  };

  // Analyse des intentions
  const intentSignalsByLevel = {
    high: intentSignals.filter(e => e.properties.intent_level === 'high').length,
    medium: intentSignals.filter(e => e.properties.intent_level === 'medium').length,
    low: intentSignals.filter(e => e.properties.intent_level === 'low').length,
  };

  const intentSignalsAnalysis = {
    total: intentSignals.length,
    ...intentSignalsByLevel,
    averageTimeToIntent: intentSignals.length > 0 ?
      intentSignals.reduce((sum, e) => sum + (e.properties.session_duration_at_intent || 0), 0) / intentSignals.length : 0
  };

  // Analyse en entonnoir
  const uniqueSessions = new Set(sessionStarts.map(e => e.properties.session_id));
  const sessionsWithScroll = new Set(scrollMilestones.map(e => e.properties.session_id));
  const sessionsWithEngagement = new Set(engagements.map(e => e.properties.session_id));
  const sessionsWithContact = new Set(contactEvents.map(e => e.properties.session_id));

  const funnelAnalysis = {
    viewToScroll: uniqueSessions.size > 0 ? (sessionsWithScroll.size / uniqueSessions.size) * 100 : 0,
    scrollToEngagement: sessionsWithScroll.size > 0 ? (sessionsWithEngagement.size / sessionsWithScroll.size) * 100 : 0,
    engagementToContact: sessionsWithEngagement.size > 0 ? (sessionsWithContact.size / sessionsWithEngagement.size) * 100 : 0,
    overallConversion: conversionRate
  };

  // Analyse temporelle
  const hourlyMap = new Map<number, { sessions: number, totalTime: number, count: number }>();
  const weeklyMap = new Map<string, { sessions: number, engagements: number }>();

  sessionStarts.forEach(event => {
    const date = new Date(event.timestamp);
    const hour = date.getHours();
    const day = date.toLocaleDateString('fr-FR', { weekday: 'long' });

    // Hourly
    if (!hourlyMap.has(hour)) {
      hourlyMap.set(hour, { sessions: 0, totalTime: 0, count: 0 });
    }
    const hourData = hourlyMap.get(hour)!;
    hourData.sessions++;

    // Weekly
    if (!weeklyMap.has(day)) {
      weeklyMap.set(day, { sessions: 0, engagements: 0 });
    }
    const dayData = weeklyMap.get(day)!;
    dayData.sessions++;
  });

  engagements.forEach(event => {
    const date = new Date(event.timestamp);
    const day = date.toLocaleDateString('fr-FR', { weekday: 'long' });
    
    if (weeklyMap.has(day)) {
      weeklyMap.get(day)!.engagements++;
    }
  });

  const timeAnalysis = {
    hourlyBreakdown: Array.from(hourlyMap.entries()).map(([hour, data]) => ({
      hour,
      sessions: data.sessions,
      averageTime: data.count > 0 ? data.totalTime / data.count : 0
    })).sort((a, b) => a.hour - b.hour),
    
    weeklyTrends: Array.from(weeklyMap.entries()).map(([day, data]) => ({
      day,
      sessions: data.sessions,
      engagement: data.engagements
    }))
  };

  return {
    totalViews,
    totalSessions,
    averageTime,
    bounceRate,
    conversionRate,
    scrollAnalytics,
    engagementMetrics,
    intentSignals: intentSignalsAnalysis,
    funnelAnalysis,
    timeAnalysis
  };
}

// GET /api/properties/[id]/posthog-insights - Récupérer les insights avancés
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

    // Valider les paramètres
    const { searchParams } = new URL(request.url);
    const { days, includeEvents } = querySchema.parse({
      days: searchParams.get('days') || '30',
      includeEvents: searchParams.get('includeEvents') || 'true',
    });

    // Calculer la période
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    console.log(`📊 Récupération insights PostHog pour propriété ${propertyId} (${days} jours)`);

    // Récupérer tous les événements enrichis
    const events = await fetchPostHogEnrichedEvents(propertyId, startDate, endDate);
    
    console.log(`📈 ${events.length} événements PostHog enrichis récupérés`);

    // Analyser les insights
    const insights = analyzePropertyInsights(events);

    console.log(`✅ Insights calculés:`, {
      totalSessions: insights.totalSessions,
      scrollCompletion: insights.scrollAnalytics.completionRate,
      intentSignals: insights.intentSignals.total
    });

    const response = {
      success: true,
      data: insights,
      events: includeEvents === 'true' ? events : undefined,
      period: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        days: parseInt(days)
      },
      source: 'posthog_insights'
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des insights PostHog:', error);
    
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
    }

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}