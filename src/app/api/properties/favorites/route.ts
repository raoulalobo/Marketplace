// API route pour la gestion des favoris
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Schéma de validation pour ajouter/supprimer un favori
const favoriteSchema = z.object({
  propertyId: z.string().min(1, 'ID de propriété requis')
});

// GET /api/properties/favorites - Récupérer les favoris de l'utilisateur
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

    // Récupérer les favoris avec les informations des propriétés
    const favorites = await prisma.favorite.findMany({
      where: { userId: session.user.id },
      include: {
        property: {
          include: {
            agent: {
              select: {
                id: true,
                nom: true,
                prenom: true
              }
            },
            _count: {
              select: {
                favorites: true,
                visitRequests: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ favorites });

  } catch (error) {
    console.error('Erreur lors de la récupération des favoris:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// POST /api/properties/favorites - Ajouter une propriété aux favoris
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Seuls les acheteurs peuvent ajouter des favoris
    if (session.user.role !== 'ACHETEUR' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Seuls les acheteurs peuvent ajouter des favoris' },
        { status: 403 }
      );
    }

    // Récupérer et valider les données
    const body = await request.json();
    const { propertyId } = favoriteSchema.parse(body);

    // Vérifier que la propriété existe
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true }
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Propriété non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier si le favori existe déjà
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_propertyId: {
          userId: session.user.id,
          propertyId
        }
      }
    });

    if (existingFavorite) {
      return NextResponse.json(
        { error: 'Cette propriété est déjà dans vos favoris' },
        { status: 409 }
      );
    }

    // Créer le favori
    const favorite = await prisma.favorite.create({
      data: {
        userId: session.user.id,
        propertyId
      },
      include: {
        property: {
          select: {
            id: true,
            titre: true,
            prix: true,
            adresse: true
          }
        }
      }
    });

    return NextResponse.json(
      {
        message: 'Propriété ajoutée aux favoris',
        favorite
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Erreur lors de l\'ajout aux favoris:', error);
    
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

// DELETE /api/properties/favorites - Supprimer une propriété des favoris
export async function DELETE(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Récupérer l'ID de la propriété depuis les paramètres URL
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'ID de propriété requis' },
        { status: 400 }
      );
    }

    // Vérifier que le favori existe
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_propertyId: {
          userId: session.user.id,
          propertyId
        }
      }
    });

    if (!existingFavorite) {
      return NextResponse.json(
        { error: 'Cette propriété n\'est pas dans vos favoris' },
        { status: 404 }
      );
    }

    // Supprimer le favori
    await prisma.favorite.delete({
      where: {
        userId_propertyId: {
          userId: session.user.id,
          propertyId
        }
      }
    });

    return NextResponse.json({
      message: 'Propriété supprimée des favoris'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression du favori:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}