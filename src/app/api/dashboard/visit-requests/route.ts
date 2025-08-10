// API route pour les demandes de visite - accessible aux agents ET acheteurs
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// Forcer le rendu dynamique pour cette route API
export const dynamic = 'force-dynamic';

// Interface pour une demande de visite avec tous les détails nécessaires
interface VisitRequestWithDetails {
  id: string;
  message: string | null;
  datePreferee: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'REJECTED';
  responseMessage: string | null;
  scheduledDate: string | null;
  createdAt: string;
  updatedAt: string;
  // Détails de la propriété
  property: {
    id: string;
    titre: string;
    type: string;
    prix: number;
    superficie: number;
    adresse: string;
    fraisVisite: number;
    medias: Array<{
      url: string;
      type: string;
      order: number;
    }>;
    agent: {
      id: string;
      nom: string;
      prenom: string;
      email: string;
    };
  };
  // Détails de l'acheteur (pour les agents)
  acheteur: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
  };
}

// GET /api/dashboard/visit-requests - Récupérer les demandes de visite
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

    const userId = session.user.id;
    const userRole = session.user.role;

    // Déterminer le filtre selon le rôle
    let whereClause = {};
    
    if (userRole === UserRole.ACHETEUR) {
      // Les acheteurs voient leurs demandes envoyées
      whereClause = { acheteurId: userId };
    } else if (userRole === UserRole.AGENT) {
      // Les agents voient les demandes sur leurs propriétés
      whereClause = {
        property: {
          agentId: userId
        }
      };
    } else {
      return NextResponse.json(
        { error: 'Rôle non autorisé pour cette ressource' },
        { status: 403 }
      );
    }

    // Récupérer les demandes de visite avec toutes les relations nécessaires
    const visitRequests = await prisma.visitRequest.findMany({
      where: whereClause,
      include: {
        property: {
          include: {
            medias: {
              where: { type: 'PHOTO' },
              orderBy: { order: 'asc' },
              take: 1 // Prendre seulement la première photo
            },
            agent: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true
              }
            }
          }
        },
        acheteur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Formater les données pour l'interface
    const formattedRequests: VisitRequestWithDetails[] = visitRequests.map(request => ({
      id: request.id,
      message: request.message,
      datePreferee: request.datePreferee?.toISOString() || null,
      status: request.status as 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'REJECTED',
      responseMessage: request.responseMessage,
      scheduledDate: request.scheduledDate?.toISOString() || null,
      createdAt: request.createdAt.toISOString(),
      updatedAt: request.updatedAt.toISOString(),
      property: {
        id: request.property.id,
        titre: request.property.titre,
        type: request.property.type,
        prix: request.property.prix,
        superficie: request.property.superficie,
        adresse: request.property.adresse,
        fraisVisite: request.property.fraisVisite,
        medias: request.property.medias.map(media => ({
          url: media.url,
          type: media.type,
          order: media.order
        })),
        agent: request.property.agent
      },
      acheteur: request.acheteur
    }));

    // Calculer quelques statistiques utiles
    const stats = {
      total: formattedRequests.length,
      pending: formattedRequests.filter(r => r.status === 'PENDING').length,
      accepted: formattedRequests.filter(r => r.status === 'ACCEPTED').length,
      completed: formattedRequests.filter(r => r.status === 'COMPLETED').length,
      rejected: formattedRequests.filter(r => r.status === 'REJECTED').length,
    };

    return NextResponse.json({
      visitRequests: formattedRequests,
      stats,
      userRole: userRole
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des demandes de visite:', error);
    
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// PUT /api/dashboard/visit-requests - Mettre à jour une demande (pour les agents)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== UserRole.AGENT) {
      return NextResponse.json(
        { error: 'Accès réservé aux agents' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { visitRequestId, status, responseMessage, scheduledDate } = body;

    if (!visitRequestId || !status) {
      return NextResponse.json(
        { error: 'ID de demande et statut requis' },
        { status: 400 }
      );
    }

    // Vérifier que la demande appartient bien à une propriété de l'agent
    const visitRequest = await prisma.visitRequest.findFirst({
      where: {
        id: visitRequestId,
        property: {
          agentId: session.user.id
        }
      }
    });

    if (!visitRequest) {
      return NextResponse.json(
        { error: 'Demande de visite non trouvée' },
        { status: 404 }
      );
    }

    // Mettre à jour la demande
    const updatedRequest = await prisma.visitRequest.update({
      where: { id: visitRequestId },
      data: {
        status: status,
        responseMessage: responseMessage || null,
        scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
        updatedAt: new Date()
      },
      include: {
        property: {
          select: {
            titre: true
          }
        },
        acheteur: {
          select: {
            nom: true,
            prenom: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      visitRequest: updatedRequest,
      message: `Demande de visite ${status.toLowerCase()}`
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la demande de visite:', error);
    
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}