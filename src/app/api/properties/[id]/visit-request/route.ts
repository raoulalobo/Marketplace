// API route pour créer une demande de visite pour une propriété spécifique
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

// Schéma de validation pour une demande de visite
const visitRequestSchema = z.object({
  message: z.string().optional(), // Message optionnel de l'acheteur
  datePreferee: z.string().datetime().optional() // Date préférée au format ISO
});

// POST /api/properties/[id]/visit-request - Créer une demande de visite
export async function POST(
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

    // Seuls les acheteurs peuvent faire des demandes de visite
    if (session.user.role !== UserRole.ACHETEUR) {
      return NextResponse.json(
        { error: 'Seuls les acheteurs peuvent demander des visites' },
        { status: 403 }
      );
    }

    const propertyId = (await params).id;

    // Vérifier que la propriété existe et est active
    const property = await prisma.property.findUnique({
      where: { 
        id: propertyId,
        isActive: true
      },
      select: { 
        id: true, 
        titre: true,
        agentId: true,
        fraisVisite: true
      }
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Propriété non trouvée ou inactive' },
        { status: 404 }
      );
    }

    // Un acheteur ne peut pas demander une visite pour sa propre propriété
    if (property.agentId === session.user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas demander une visite pour votre propre propriété' },
        { status: 400 }
      );
    }

    // Vérifier s'il y a déjà une demande en attente ou acceptée
    const existingRequest = await prisma.visitRequest.findFirst({
      where: {
        acheteurId: session.user.id,
        propertyId: propertyId,
        status: {
          in: ['PENDING', 'ACCEPTED']
        }
      }
    });

    if (existingRequest) {
      const statusMessage = existingRequest.status === 'PENDING' 
        ? 'en attente' 
        : 'déjà acceptée';
      
      return NextResponse.json(
        { error: `Vous avez déjà une demande de visite ${statusMessage} pour cette propriété` },
        { status: 409 }
      );
    }

    // Récupérer et valider les données
    const body = await request.json();
    const validatedData = visitRequestSchema.parse(body);

    // Créer la demande de visite
    const visitRequest = await prisma.visitRequest.create({
      data: {
        acheteurId: session.user.id,
        propertyId: propertyId,
        message: validatedData.message,
        datePreferee: validatedData.datePreferee ? new Date(validatedData.datePreferee) : null,
        status: 'PENDING'
      },
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
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(
      {
        message: 'Demande de visite créée avec succès',
        visitRequest: {
          id: visitRequest.id,
          propertyTitle: visitRequest.property.titre,
          propertyAddress: visitRequest.property.adresse,
          visitCost: visitRequest.property.fraisVisite,
          message: visitRequest.message,
          preferredDate: visitRequest.datePreferee?.toISOString(),
          status: visitRequest.status,
          createdAt: visitRequest.createdAt.toISOString()
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Erreur lors de la création de la demande de visite:', error);
    
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