// API route pour la gestion de l'historique des recherches utilisateur
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Schéma de validation pour créer une recherche sauvegardée
const createSearchSchema = z.object({
  searchQuery: z.string().optional(),
  filters: z.record(z.any()), // Objet JSON flexible pour les filtres
  resultCount: z.number().min(0).optional().default(0),
  name: z.string().min(1).max(100).optional()
});

// Schéma de validation pour mettre à jour une recherche
const updateSearchSchema = z.object({
  name: z.string().min(1).max(100),
});

// GET /api/searches - Récupérer l'historique des recherches de l'utilisateur
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

    // Paramètres de pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Récupérer les recherches de l'utilisateur
    const [searches, totalCount] = await Promise.all([
      prisma.searchHistory.findMany({
        where: { userId: session.user.id },
        orderBy: { lastUsed: 'desc' },
        skip,
        take: limit
      }),
      prisma.searchHistory.count({
        where: { userId: session.user.id }
      })
    ]);

    return NextResponse.json({
      searches,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des recherches:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// POST /api/searches - Sauvegarder une nouvelle recherche
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

    // Valider les données
    const body = await request.json();
    const validatedData = createSearchSchema.parse(body);

    // Vérifier si une recherche identique existe déjà (même filtres)
    const existingSearch = await prisma.searchHistory.findFirst({
      where: {
        userId: session.user.id,
        filters: { equals: validatedData.filters }
      }
    });

    if (existingSearch) {
      // Mettre à jour la date de dernière utilisation
      const updatedSearch = await prisma.searchHistory.update({
        where: { id: existingSearch.id },
        data: {
          lastUsed: new Date(),
          resultCount: validatedData.resultCount
        }
      });

      return NextResponse.json({
        message: 'Recherche mise à jour',
        search: updatedSearch
      });
    }

    // Créer une nouvelle recherche
    const search = await prisma.searchHistory.create({
      data: {
        userId: session.user.id,
        searchQuery: validatedData.searchQuery,
        filters: validatedData.filters,
        resultCount: validatedData.resultCount,
        name: validatedData.name
      }
    });

    return NextResponse.json(
      {
        message: 'Recherche sauvegardée avec succès',
        search
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Erreur lors de la sauvegarde de la recherche:', error);
    
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