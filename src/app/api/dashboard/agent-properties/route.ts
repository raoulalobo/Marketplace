// API pour récupérer les propriétés de l'agent connecté
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

// Forcer le rendu dynamique pour cette route API qui utilise les headers de session
export const dynamic = 'force-dynamic';

// Schéma de validation pour les paramètres de recherche
const searchParamsSchema = z.object({
  page: z.string().nullable().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().nullable().optional().transform(val => val ? parseInt(val) : 10),
  search: z.string().nullable().optional(),
  type: z.enum(['MAISON', 'TERRAIN', 'BUREAU', 'HANGAR']).nullable().optional(),
  status: z.enum(['active', 'inactive', 'all']).nullable().optional().transform(val => val || 'all'),
  sortBy: z.enum(['createdAt', 'titre', 'prix', 'viewsCount']).nullable().optional().transform(val => val || 'createdAt'),
  sortOrder: z.enum(['asc', 'desc']).nullable().optional().transform(val => val || 'desc')
});

// GET /api/dashboard/agent-properties - Récupérer les propriétés de l'agent connecté
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

    // Vérifier que l'utilisateur est un agent
    if (session.user.role !== UserRole.AGENT) {
      return NextResponse.json(
        { error: 'Accès réservé aux agents' },
        { status: 403 }
      );
    }

    const agentId = session.user.id;
    const { searchParams } = new URL(request.url);
    
    // Valider les paramètres de recherche
    const validatedParams = searchParamsSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      type: searchParams.get('type'),
      status: searchParams.get('status'),
      sortBy: searchParams.get('sortBy'),
      sortOrder: searchParams.get('sortOrder')
    });

    const {
      page,
      limit,
      search,
      type,
      status,
      sortBy,
      sortOrder
    } = validatedParams;

    // Construire les filtres Prisma
    const where: any = {
      agentId: agentId // Filtrer par agent connecté
    };

    // Recherche textuelle
    if (search) {
      where.OR = [
        { titre: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { adresse: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filtres par type
    if (type) {
      where.type = type;
    }

    // Filtres par statut
    if (status !== 'all') {
      where.isActive = status === 'active';
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Configuration du tri
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Récupérer les propriétés avec statistiques
    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        include: {
          medias: {
            where: { type: 'PHOTO' },
            take: 1,
            orderBy: { order: 'asc' }
          },
          _count: {
            select: {
              favorites: true,
              visitRequests: true,
              timeSessions: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.property.count({ where })
    ]);

    // Enrichir avec les statistiques de temps passé et vues réelles
    const enrichedProperties = await Promise.all(
      properties.map(async (property) => {
        // Calculer le temps moyen passé sur cette propriété
        const timeStats = await prisma.propertyTimeSession.aggregate({
          where: {
            propertyId: property.id,
            timeSpent: { not: null }
          },
          _avg: {
            timeSpent: true,
            activeTime: true,
            scrollDepth: true
          },
          _count: {
            id: true
          }
        });

        // Calculer le nombre réel de vues depuis la table PropertyView
        const realViewsCount = await prisma.propertyView.count({
          where: {
            propertyId: property.id
          }
        });

        // Calculer le taux de rebond (sessions < 30 secondes)
        const bounceCount = await prisma.propertyTimeSession.count({
          where: {
            propertyId: property.id,
            timeSpent: { lt: 30, not: null }
          }
        });

        const totalSessions = timeStats._count.id;
        const bounceRate = totalSessions > 0 ? (bounceCount / totalSessions) * 100 : 0;

        return {
          ...property,
          stats: {
            averageTimeSpent: Math.round(timeStats._avg.timeSpent || 0),
            averageActiveTime: Math.round(timeStats._avg.activeTime || 0),
            averageScrollDepth: Math.round((timeStats._avg.scrollDepth || 0) * 100) / 100,
            totalSessions: totalSessions,
            bounceRate: Math.round(bounceRate * 100) / 100,
            viewsCount: realViewsCount, // Utiliser le count réel depuis PropertyView
            favoritesCount: property._count.favorites,
            visitRequestsCount: property._count.visitRequests
          }
        };
      })
    );

    return NextResponse.json({
      properties: enrichedProperties,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des propriétés de l\'agent:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Paramètres de recherche invalides', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}