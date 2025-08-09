// API route pour gérer une demande de visite spécifique (modifier/annuler)
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { UserRole, VisitStatus } from '@prisma/client';
import { z } from 'zod';

// Schéma de validation pour la mise à jour d'une demande de visite
const updateVisitRequestSchema = z.object({
  message: z.string().optional(),
  datePreferee: z.string().datetime().optional(),
  status: z.enum(['CANCELLED']).optional() // Seul l'acheteur peut annuler
});

// GET /api/visit-requests/[id] - Récupérer une demande de visite
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const visitRequestId = (await params).id;

    // Récupérer la demande de visite
    const visitRequest = await prisma.visitRequest.findUnique({
      where: { id: visitRequestId },
      include: {
        property: {
          select: {
            id: true,
            titre: true,
            adresse: true,
            prix: true,
            fraisVisite: true,
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
      }
    });

    if (!visitRequest) {
      return NextResponse.json(
        { error: 'Demande de visite non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier les permissions : seul l'acheteur ou l'agent peut voir la demande
    const isOwner = visitRequest.acheteurId === session.user.id;
    const isAgent = visitRequest.property.agent.id === session.user.id;
    const isAdmin = session.user.role === UserRole.ADMIN;

    if (!isOwner && !isAgent && !isAdmin) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      visitRequest: {
        id: visitRequest.id,
        property: {
          id: visitRequest.property.id,
          titre: visitRequest.property.titre,
          adresse: visitRequest.property.adresse,
          prix: visitRequest.property.prix,
          fraisVisite: visitRequest.property.fraisVisite,
          agent: visitRequest.property.agent
        },
        acheteur: visitRequest.acheteur,
        message: visitRequest.message,
        preferredDate: visitRequest.datePreferee?.toISOString(),
        status: visitRequest.status,
        createdAt: visitRequest.createdAt.toISOString(),
        updatedAt: visitRequest.updatedAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération de la demande de visite:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// PATCH /api/visit-requests/[id] - Modifier une demande de visite (acheteur seulement)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const visitRequestId = (await params).id;

    // Vérifier que la demande existe et appartient à l'utilisateur
    const existingRequest = await prisma.visitRequest.findUnique({
      where: { id: visitRequestId },
      include: {
        property: {
          select: {
            titre: true,
            agent: {
              select: {
                nom: true,
                prenom: true
              }
            }
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

    // Seul l'acheteur peut modifier sa demande
    if (existingRequest.acheteurId !== session.user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez modifier que vos propres demandes' },
        { status: 403 }
      );
    }

    // On ne peut modifier qu'une demande en attente
    if (existingRequest.status !== VisitStatus.PENDING) {
      return NextResponse.json(
        { error: 'Vous ne pouvez modifier qu\'une demande en attente' },
        { status: 400 }
      );
    }

    // Récupérer et valider les données
    const body = await request.json();
    const validatedData = updateVisitRequestSchema.parse(body);

    // Préparer les données de mise à jour
    const updateData: any = {};
    
    if (validatedData.message !== undefined) {
      updateData.message = validatedData.message;
    }
    
    if (validatedData.datePreferee !== undefined) {
      updateData.datePreferee = new Date(validatedData.datePreferee);
    }
    
    if (validatedData.status !== undefined) {
      updateData.status = validatedData.status;
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
        }
      }
    });

    const actionMessage = validatedData.status === 'CANCELLED' 
      ? 'Demande de visite annulée'
      : 'Demande de visite mise à jour';

    return NextResponse.json({
      message: actionMessage,
      visitRequest: {
        id: updatedRequest.id,
        propertyTitle: updatedRequest.property.titre,
        message: updatedRequest.message,
        preferredDate: updatedRequest.datePreferee?.toISOString(),
        status: updatedRequest.status,
        updatedAt: updatedRequest.updatedAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Erreur lors de la modification de la demande de visite:', error);
    
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

// DELETE /api/visit-requests/[id] - Supprimer définitivement une demande (rare)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const visitRequestId = (await params).id;

    // Vérifier que la demande existe
    const existingRequest = await prisma.visitRequest.findUnique({
      where: { id: visitRequestId },
      select: { 
        acheteurId: true, 
        status: true,
        property: {
          select: { agentId: true }
        }
      }
    });

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Demande de visite non trouvée' },
        { status: 404 }
      );
    }

    // Permissions : acheteur, agent ou admin
    const isOwner = existingRequest.acheteurId === session.user.id;
    const isAgent = existingRequest.property.agentId === session.user.id;
    const isAdmin = session.user.role === UserRole.ADMIN;

    if (!isOwner && !isAgent && !isAdmin) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    // Supprimer la demande
    await prisma.visitRequest.delete({
      where: { id: visitRequestId }
    });

    return NextResponse.json({
      message: 'Demande de visite supprimée définitivement'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de la demande de visite:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}