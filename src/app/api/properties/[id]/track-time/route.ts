// API route pour tracker le temps passé sur une propriété
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Schémas de validation
const startSessionSchema = z.object({
  sessionId: z.string().min(1),
  userAgent: z.string().optional(),
});

const updateSessionSchema = z.object({
  sessionId: z.string().min(1),
  activeTime: z.number().min(0).optional(),
  scrollDepth: z.number().min(0).max(100).optional(),
  events: z.array(z.object({
    type: z.string(),
    timestamp: z.number(),
    data: z.any().optional()
  })).optional()
});

const endSessionSchema = z.object({
  sessionId: z.string().min(1),
  timeSpent: z.number().min(0),
  activeTime: z.number().min(0).optional(),
  scrollDepth: z.number().min(0).max(100).optional(),
  events: z.array(z.object({
    type: z.string(),
    timestamp: z.number(),
    data: z.any().optional()
  })).optional()
});

/*** Fonction utilitaire pour extraire l'IP réelle du visiteur ***/
function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const connectingIp = request.headers.get('cf-connecting-ip');
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  if (connectingIp) {
    return connectingIp;
  }
  
  return request.ip || '127.0.0.1';
}

// POST /api/properties/[id]/track-time - Démarrer une session de tracking
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: propertyId } = params;
    
    // Vérifier que la propriété existe
    const property = await prisma.property.findUnique({
      where: { id: propertyId, isActive: true },
      select: { id: true }
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Propriété non trouvée' },
        { status: 404 }
      );
    }

    // Valider les données d'entrée
    const body = await request.json();
    const validatedData = startSessionSchema.parse(body);

    // Obtenir les informations de session
    const session = await getServerSession(authOptions);
    const viewerIp = getClientIp(request);
    const userAgent = validatedData.userAgent || request.headers.get('user-agent');

    // Créer ou mettre à jour la session de tracking
    const timeSession = await prisma.propertyTimeSession.upsert({
      where: {
        sessionId: validatedData.sessionId
      },
      update: {
        lastActiveAt: new Date(),
        viewerIp,
        userAgent
      },
      create: {
        sessionId: validatedData.sessionId,
        propertyId,
        viewerIp,
        userAgent,
        userId: session?.user?.id
      }
    });

    return NextResponse.json({ 
      success: true,
      sessionId: timeSession.sessionId,
      started: true
    });

  } catch (error) {
    console.error('Erreur lors du démarrage du tracking:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// PUT /api/properties/[id]/track-time - Heartbeat/mise à jour de session
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: propertyId } = params;
    
    // Valider les données d'entrée
    const body = await request.json();
    const validatedData = updateSessionSchema.parse(body);

    // Mettre à jour la session existante
    const timeSession = await prisma.propertyTimeSession.update({
      where: {
        sessionId: validatedData.sessionId
      },
      data: {
        lastActiveAt: new Date(),
        activeTime: validatedData.activeTime,
        scrollDepth: validatedData.scrollDepth,
        events: validatedData.events ? {
          // Merger les nouveaux événements avec les existants
          merge: validatedData.events
        } : undefined
      }
    });

    return NextResponse.json({ 
      success: true,
      sessionId: timeSession.sessionId,
      updated: true
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du tracking:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    // Si la session n'existe pas, retourner une erreur spécifique
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: 'Session de tracking non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// DELETE /api/properties/[id]/track-time - Terminer une session
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: propertyId } = params;
    
    // Récupérer les paramètres de la query string pour DELETE
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');
    const timeSpent = parseInt(url.searchParams.get('timeSpent') || '0');
    const activeTime = parseInt(url.searchParams.get('activeTime') || '0');
    const scrollDepth = parseFloat(url.searchParams.get('scrollDepth') || '0');

    console.log('🏁 Tentative de terminaison de session:', {
      sessionId,
      propertyId,
      timeSpent,
      activeTime,
      scrollDepth,
      userAgent: request.headers.get('user-agent')?.substring(0, 50) + '...'
    });

    if (!sessionId) {
      console.error('❌ Session ID manquant');
      return NextResponse.json(
        { error: 'sessionId requis' },
        { status: 400 }
      );
    }

    // D'abord, vérifier si la session existe
    const existingSession = await prisma.propertyTimeSession.findUnique({
      where: { sessionId }
    });

    if (!existingSession) {
      console.error('❌ Session non trouvée:', sessionId);
      return NextResponse.json(
        { error: 'Session de tracking non trouvée' },
        { status: 404 }
      );
    }

    // Si la session est déjà terminée, ne pas la modifier
    if (existingSession.timeSpent !== null) {
      console.log('⚠️ Session déjà terminée:', sessionId, 'avec timeSpent:', existingSession.timeSpent);
      return NextResponse.json({ 
        success: true,
        sessionId: existingSession.sessionId,
        ended: true,
        totalTime: existingSession.timeSpent,
        alreadyEnded: true
      });
    }

    // Calculer un temps minimum basé sur l'activité si timeSpent est 0
    let finalTimeSpent = timeSpent;
    let finalActiveTime = activeTime;

    if (timeSpent === 0 && existingSession.lastActiveAt && existingSession.enteredAt) {
      // Calculer le temps basé sur la différence entre entrée et dernière activité
      const inferredTime = Math.round((new Date(existingSession.lastActiveAt).getTime() - new Date(existingSession.enteredAt).getTime()) / 1000);
      finalTimeSpent = Math.max(inferredTime, existingSession.activeTime || 0);
      finalActiveTime = existingSession.activeTime || finalTimeSpent;
      
      console.log('🔧 Temps inféré pour session:', sessionId, 'temps calculé:', finalTimeSpent, 'activeTime existant:', existingSession.activeTime);
    }

    // Terminer la session
    const timeSession = await prisma.propertyTimeSession.update({
      where: {
        sessionId: sessionId
      },
      data: {
        leftAt: new Date(),
        timeSpent: finalTimeSpent,
        activeTime: finalActiveTime || finalTimeSpent,
        scrollDepth: scrollDepth || existingSession.scrollDepth
      }
    });

    console.log('✅ Session terminée avec succès:', {
      sessionId: timeSession.sessionId,
      timeSpent: timeSession.timeSpent,
      activeTime: timeSession.activeTime,
      scrollDepth: timeSession.scrollDepth
    });

    return NextResponse.json({ 
      success: true,
      sessionId: timeSession.sessionId,
      ended: true,
      totalTime: timeSession.timeSpent
    });

  } catch (error) {
    console.error('❌ Erreur lors de la fin du tracking:', error);
    
    if (error instanceof Error && error.message.includes('Record to update not found')) {
      return NextResponse.json(
        { error: 'Session de tracking non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}