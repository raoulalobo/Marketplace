// API pour la gestion des propriétés par l'admin
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// Forcer le rendu dynamique pour cette route API
export const dynamic = 'force-dynamic';

// Interface pour une propriété avec ses statistiques
interface PropertyWithStats {
  id: string;
  titre: string;
  type: string;
  prix: number;
  adresse: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  agent: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
  };
  stats: {
    viewsCount: number;
    favoritesCount: number;
    visitRequestsCount: number;
    reportsCount: number;
    avgTimeSpent: number;
  };
}

// GET /api/admin/properties - Récupérer les propriétés avec statistiques
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

    // Vérifier que l'utilisateur est un admin
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      );
    }

    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const filter = searchParams.get('filter'); // 'all', 'active', 'inactive'
    const search = searchParams.get('search');

    // Construire les conditions de filtre
    const where: any = {};
    
    if (filter === 'active') {
      where.isActive = true;
    } else if (filter === 'inactive') {
      where.isActive = false;
    }
    
    if (search) {
      where.OR = [
        { titre: { contains: search, mode: 'insensitive' } },
        { adresse: { contains: search, mode: 'insensitive' } },
        { agent: { 
          OR: [
            { nom: { contains: search, mode: 'insensitive' } },
            { prenom: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        }}
      ];
    }

    // Calculer l'offset pour la pagination
    const offset = (page - 1) * limit;

    // Récupérer les propriétés avec leurs relations
    const [properties, totalCount] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          agent: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true
            }
          },
          _count: {
            select: {
              views: true,
              favorites: true,
              visitRequests: true,
              reports: true
            }
          }
        },
        orderBy: {
          [sortBy]: sortOrder
        },
        skip: offset,
        take: limit
      }),
      
      prisma.property.count({ where })
    ]);

    // Récupérer les temps moyens passés pour chaque propriété
    const propertyIds = properties.map(p => p.id);
    const timeStats = await prisma.propertyTimeSession.groupBy({
      by: ['propertyId'],
      where: {
        propertyId: { in: propertyIds },
        timeSpent: { not: null }
      },
      _avg: {
        timeSpent: true
      }
    });

    // Créer un map des temps moyens
    const timeStatsMap = new Map(
      timeStats.map(stat => [stat.propertyId, stat._avg.timeSpent || 0])
    );

    // Formater les données
    const propertiesWithStats: PropertyWithStats[] = properties.map(property => ({
      id: property.id,
      titre: property.titre,
      type: property.type,
      prix: property.prix,
      adresse: property.adresse,
      isActive: property.isActive,
      createdAt: property.createdAt.toISOString(),
      updatedAt: property.updatedAt.toISOString(),
      agent: property.agent,
      stats: {
        viewsCount: property._count.views,
        favoritesCount: property._count.favorites,
        visitRequestsCount: property._count.visitRequests,
        reportsCount: property._count.reports,
        avgTimeSpent: Math.round(timeStatsMap.get(property.id) || 0)
      }
    }));

    // Calculer les métriques de pagination
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      properties: propertiesWithStats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage,
        hasPrevPage
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des propriétés:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}