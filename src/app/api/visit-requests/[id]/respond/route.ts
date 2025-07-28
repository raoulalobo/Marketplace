// API route pour que l'agent réponde aux demandes de visite (accepter/rejeter/terminer)
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { UserRole, VisitStatus } from '@prisma/client';
import { z } from 'zod';

// Schéma de validation pour la réponse de l'agent
const respondVisitRequestSchema = z.object({
  status: z.enum(['ACCEPTED', 'REJECTED', 'COMPLETED']), // Statuts que l'agent peut définir
  responseMessage: z.string().optional(), // Message de réponse optionnel
  scheduledDate: z.string().datetime().optional() // Date programmée si accepté
});

// POST /api/visit-requests/[id]/respond - Agent répond à une demande de visite
export async function POST(
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

    // Seuls les agents peuvent répondre aux demandes
    if (session.user.role !== UserRole.AGENT) {
      return NextResponse.json(
        { error: 'Seuls les agents peuvent répondre aux demandes de visite' },
        { status: 403 }
      );
    }

    const visitRequestId = params.id;

    // Vérifier que la demande existe et que l'agent est propriétaire de la propriété
    const existingRequest = await prisma.visitRequest.findUnique({
      where: { id: visitRequestId },
      include: {
        property: {
          select: {
            agentId: true,
            titre: true
          }
        },
        acheteur: {
          select: {
            nom: true,
            prenom: true,
            email: true
          }
        }
      }
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Demande de visite non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier que l'agent est propriétaire de la propriété
    if (existingRequest.property.agentId !== session.user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez répondre qu\'aux demandes pour vos propriétés' },
        { status: 403 }
      );
    }

    // On ne peut répondre qu'à une demande en attente
    if (existingRequest.status !== VisitStatus.PENDING) {
      return NextResponse.json(
        { error: 'Vous ne pouvez répondre qu\'à une demande en attente' },
        { status: 400 }
      );
    }

    // Récupérer et valider les données
    const body = await request.json();
    const validatedData = respondVisitRequestSchema.parse(body);

    // Préparer les données de mise à jour
    const updateData: any = {
      status: validatedData.status,
      responseMessage: validatedData.responseMessage,
    };

    // Si accepté et une date est fournie, l'enregistrer
    if (validatedData.status === 'ACCEPTED' && validatedData.scheduledDate) {
      updateData.scheduledDate = new Date(validatedData.scheduledDate);
    }

    // Mettre à jour la demande
    const updatedRequest = await prisma.visitRequest.update({
      where: { id: visitRequestId },
      data: updateData,
      include: {
        property: {
          select: {
            id: true,
            titre: true,
            adresse: true,
            fraisVisite: true
          }
        },
        acheteur: {
          select: {
            nom: true,
            prenom: true,
            email: true
          }
        }
      }
    });

    // Messages de réponse selon le statut
    const statusMessages = {
      ACCEPTED: 'Demande de visite acceptée',
      REJECTED: 'Demande de visite refusée',
      COMPLETED: 'Visite marquée comme terminée'
    };

    return NextResponse.json({
      message: statusMessages[validatedData.status],
      visitRequest: {
        id: updatedRequest.id,
        status: updatedRequest.status,
        responseMessage: updatedRequest.responseMessage,
        scheduledDate: updatedRequest.scheduledDate?.toISOString(),
        property: {
          titre: updatedRequest.property.titre,
          adresse: updatedRequest.property.adresse,
          fraisVisite: updatedRequest.property.fraisVisite
        },
        requester: {
          nom: updatedRequest.acheteur.nom,
          prenom: updatedRequest.acheteur.prenom,
          email: updatedRequest.acheteur.email
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la réponse à la demande de visite:', error);
    
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