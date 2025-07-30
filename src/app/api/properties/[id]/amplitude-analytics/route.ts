// API route pour récupérer les analytics Amplitude d'une propriété spécifique
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Types pour les données Amplitude
interface AmplitudeEvent {
  event_type: string;
  event_time: string;
  user_id?: string;
  event_properties?: {
    property_id?: string;
    session_duration?: number;
    scroll_percentage?: number;
    engagement_type?: string;
    intent_level?: string;
    user_role?: string;
    [key: string]: any;
  };
  user_properties?: {
    role?: string;
    email?: string;
    [key: string]: any;
  };
}

interface AmplitudeResponse {
  data: AmplitudeEvent[];
  series?: any[];
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

// Fonction pour récupérer les événements depuis Amplitude
async function fetchAmplitudeEvents(
  propertyId: string,
  startDate: Date,
  endDate: Date
): Promise<AmplitudeEvent[]> {
  const AMPLITUDE_SECRET_KEY = process.env.AMPLITUDE_SECRET_KEY;
  
  if (!AMPLITUDE_SECRET_KEY) {
    throw new Error('Configuration Amplitude manquante');
  }

  // Construire la requête Amplitude Dashboard REST API
  const query = {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0],
    where: [
      {
        prop: 'event_properties',
        op: 'contains',
        values: [`property_id:${propertyId}`]
      }
    ],
    metrics: [
      {
        op: 'totals',
        prop: 'event_properties.property_id'
      }
    ]
  };

  try {
    // Utiliser l'API Dashboard REST de Amplitude
    const response = await fetch('https://amplitude.com/api/2/events/list', {
      method: 'POST',
      headers: {
        'Authorization': `Api-Key ${AMPLITUDE_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query)
    });

    if (!response.ok) {
      console.error('❌ Erreur Amplitude API:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('📋 Détails erreur:', errorText);
      throw new Error(`Erreur Amplitude API: ${response.status} - ${errorText}`);
    }

    const data: AmplitudeResponse = await response.json();
    return data.data || [];
    
  } catch (error) {
    console.error('💥 Erreur lors de la récupération Amplitude:', error);
    // Fallback: retourner des données vides plutôt que de faire échouer
    return [];
  }
}

// Fonction pour calculer les analytics à partir des événements Amplitude
function calculatePropertyAnalytics(events: AmplitudeEvent[]): PropertyAnalytics {
  // Filtrer les événements par type
  const viewEvents = events.filter(e => 
    e.event_type === 'Property Viewed' || e.event_type === 'Page Viewed'
  );
  
  const sessionStartEvents = events.filter(e => 
    e.event_type === 'Property Session Started'
  );
  
  const sessionEndEvents = events.filter(e => 
    e.event_type === 'Property Session Ended'
  );
  
  const conversionEvents = events.filter(e => 
    e.event_type === 'Visit Request Submitted' || 
    e.event_type === 'Property Favorited'
  );

  // Calculer les métriques de base
  const totalViews = viewEvents.length;
  const totalSessions = Math.max(sessionStartEvents.length, sessionEndEvents.length, 1);

  // Calculer le temps moyen à partir des sessions terminées
  const completedSessions = sessionEndEvents.filter(e => 
    e.event_properties?.session_duration && e.event_properties.session_duration > 0
  );
  
  const totalTime = completedSessions.reduce((sum, session) => 
    sum + (session.event_properties?.session_duration || 0), 0
  );
  
  const averageTime = completedSessions.length > 0 ? 
    Math.round(totalTime / completedSessions.length) : 0;

  // Calculer le taux de rebond (sessions < 30 secondes)
  const shortSessions = completedSessions.filter(e => 
    (e.event_properties?.session_duration || 0) < 30
  ).length;
  
  const bounceRate = completedSessions.length > 0 ? 
    Math.round((shortSessions / completedSessions.length) * 100) : 0;

  // Calculer le taux de conversion
  const conversionRate = totalSessions > 0 ? 
    Math.round((conversionEvents.length / totalSessions) * 100) : 0;

  // Calculer les tendances quotidiennes
  const dailyMap = new Map<string, { sessions: Set<string>, timeSum: number, timeCount: number }>();
  
  [...sessionStartEvents, ...sessionEndEvents].forEach(event => {
    const date = new Date(event.event_time).toISOString().split('T')[0];
    const sessionId = event.user_id || `anonymous_${Math.random()}`;
    
    if (!dailyMap.has(date)) {
      dailyMap.set(date, { sessions: new Set(), timeSum: 0, timeCount: 0 });
    }
    
    const dayData = dailyMap.get(date)!;
    dayData.sessions.add(sessionId);
    
    // Ajouter le temps si c'est un événement de fin de session
    if (event.event_type === 'Property Session Ended' && event.event_properties?.session_duration) {
      dayData.timeSum += event.event_properties.session_duration;
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
    e.user_id && e.event_properties?.user_role !== 'ANONYMOUS'
  );
  const anonymousEvents = events.filter(e => 
    !e.user_id || e.event_properties?.user_role === 'ANONYMOUS'
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

// GET /api/properties/[id]/amplitude-analytics - Récupérer les analytics Amplitude
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

    console.log(`📊 Récupération analytics Amplitude pour propriété ${propertyId} (${days} jours)`);
    console.log(`🔑 Utilisation de la clé API Amplitude: ${process.env.AMPLITUDE_SECRET_KEY?.substring(0, 20)}...`);

    // Récupérer les événements Amplitude
    const events = await fetchAmplitudeEvents(propertyId, startDate, endDate);
    
    console.log(`📈 ${events.length} événements Amplitude récupérés`);

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
      source: 'amplitude',
      eventsCount: events.length
    });

  } catch (error) {
    console.error('❌ Erreur lors de la récupération des analytics Amplitude:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Paramètres invalides', details: error.errors },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      console.error('📋 Détails de l\'erreur:', {
        message: error.message,
        stack: error.stack,
        environment: {
          AMPLITUDE_SECRET_KEY: process.env.AMPLITUDE_SECRET_KEY ? 'Définie' : 'Manquante',
        }
      });

      if (error.message.includes('Configuration Amplitude manquante')) {
        return NextResponse.json(
          { error: 'Configuration Amplitude incomplète', details: error.message },
          { status: 500 }
        );
      }
      
      if (error.message.includes('Amplitude API')) {
        return NextResponse.json(
          { error: 'Erreur lors de la récupération des données Amplitude', details: error.message },
          { status: 502 }
        );
      }
      
      // Retourner les détails de l'erreur pour le debugging
      return NextResponse.json(
        { error: 'Erreur interne du serveur', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur interne du serveur', details: 'Erreur inconnue' },
      { status: 500 }
    );
  }
}