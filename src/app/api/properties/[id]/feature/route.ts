// API route pour gérer la mise en avant des propriétés
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

// Schéma de validation pour la mise en avant
const featurePropertySchema = z.object({
  isFeatured: z.boolean(),
  featuredDays: z.number().min(1).max(30).optional(), // Nombre de jours de mise en avant (1-30)
});

// POST /api/properties/[id]/feature - Mettre en avant ou retirer une propriété
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

    // Vérifier les permissions (seulement admins et agents propriétaires)
    const propertyId = (await params).id;
    
    // Récupérer la propriété
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { agent: true }
    });
    
    if (!property) {
      return NextResponse.json(
        { error: 'Propriété non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier les permissions
    const isAdmin = session.user.role === UserRole.ADMIN;
    const isOwner = session.user.role === UserRole.AGENT && session.user.id === property.agentId;
    
    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }

    // Récupérer et valider les données
    const body = await request.json();
    const validatedData = featurePropertySchema.parse(body);

    let updateData: any = {
      isFeatured: validatedData.isFeatured,
    };

    // Si on met en avant, calculer la date de fin
    if (validatedData.isFeatured && validatedData.featuredDays) {
      const now = new Date();
      const featuredUntil = new Date(now.getTime() + validatedData.featuredDays * 24 * 60 * 60 * 1000);
      updateData.featuredUntil = featuredUntil;
    } else if (!validatedData.isFeatured) {
      // Si on retire la mise en avant, effacer la date
      updateData.featuredUntil = null;
    }

    // Mettre à jour la propriété
    const updatedProperty = await prisma.property.update({
      where: { id: propertyId },
      data: updateData,
      include: {
        agent: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            telephone: true
          }
        },
        medias: true
      }
    });

    return NextResponse.json({
      message: validatedData.isFeatured ? 'Propriété mise en avant avec succès' : 'Mise en avant retirée avec succès',
      property: updatedProperty
    });

  } catch (error) {
    console.error('Erreur lors de la mise en avant:', error);
    
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

// GET /api/properties/[id]/feature - Récupérer le statut de mise en avant
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const propertyId = (await params).id;
    
    // Récupérer le statut de la propriété
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        isFeatured: true,
        featuredUntil: true,
        viewsCount: true
      }
    });
    
    if (!property) {
      return NextResponse.json(
        { error: 'Propriété non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier si la mise en avant a expiré
    const now = new Date();
    let isFeatured = property.isFeatured;
    
    if (property.isFeatured && property.featuredUntil && property.featuredUntil < now) {
      // Mettre à jour automatiquement si expiré
      await prisma.property.update({
        where: { id: propertyId },
        data: {
          isFeatured: false,
          featuredUntil: null
        }
      });
      isFeatured = false;
    }

    return NextResponse.json({
      id: property.id,
      isFeatured,
      featuredUntil: property.featuredUntil,
      viewsCount: property.viewsCount,
      daysRemaining: property.featuredUntil && isFeatured 
        ? Math.ceil((property.featuredUntil.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
        : 0
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du statut:', error);
    
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}