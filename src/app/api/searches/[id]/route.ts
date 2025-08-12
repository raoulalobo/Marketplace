// API route pour les actions spécifiques sur une recherche sauvegardée
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Schéma de validation pour mettre à jour une recherche
const updateSearchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  resultCount: z.number().min(0).optional()
});

// GET /api/searches/[id] - Récupérer une recherche spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Récupérer la recherche avec vérification du propriétaire
    const search = await prisma.searchHistory.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    });

    if (!search) {
      return NextResponse.json(
        { error: 'Recherche non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json({ search });

  } catch (error) {
    console.error('Erreur lors de la récupération de la recherche:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// PUT /api/searches/[id] - Mettre à jour une recherche (nom, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Valider les données
    const body = await request.json();
    const validatedData = updateSearchSchema.parse(body);

    // Vérifier que la recherche appartient à l'utilisateur
    const existingSearch = await prisma.searchHistory.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    });

    if (!existingSearch) {
      return NextResponse.json(
        { error: 'Recherche non trouvée' },
        { status: 404 }
      );
    }

    // Mettre à jour la recherche
    const updatedSearch = await prisma.searchHistory.update({
      where: { id },
      data: validatedData
    });

    return NextResponse.json({
      message: 'Recherche mise à jour avec succès',
      search: updatedSearch
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la recherche:', error);
    
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

// DELETE /api/searches/[id] - Supprimer une recherche
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Vérifier que la recherche appartient à l'utilisateur
    const existingSearch = await prisma.searchHistory.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    });

    if (!existingSearch) {
      return NextResponse.json(
        { error: 'Recherche non trouvée' },
        { status: 404 }
      );
    }

    // Supprimer la recherche
    await prisma.searchHistory.delete({
      where: { id }
    });

    return NextResponse.json({
      message: 'Recherche supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de la recherche:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// POST /api/searches/[id]/use - Marquer une recherche comme utilisée
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Vérifier que la recherche appartient à l'utilisateur
    const existingSearch = await prisma.searchHistory.findFirst({
      where: {
        id,
        userId: session.user.id
      }
    });

    if (!existingSearch) {
      return NextResponse.json(
        { error: 'Recherche non trouvée' },
        { status: 404 }
      );
    }

    // Mettre à jour la date de dernière utilisation
    const updatedSearch = await prisma.searchHistory.update({
      where: { id },
      data: {
        lastUsed: new Date()
      }
    });

    return NextResponse.json({
      message: 'Recherche marquée comme utilisée',
      search: updatedSearch
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la recherche:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}