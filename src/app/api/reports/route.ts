// API route pour la gestion globale des signalements (admin)
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { UserRole, ReportStatus } from '@prisma/client';
import { z } from 'zod';

// Forcer le rendu dynamique pour cette route API qui utilise les headers de session
export const dynamic = 'force-dynamic';

// Schéma pour filtrer les signalements
const reportsFilterSchema = z.object({
  status: z.enum(['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED']).optional(),
  motif: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20)
});

// GET /api/reports - Récupérer tous les signalements (admin seulement)
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

    // Seuls les admins peuvent voir tous les signalements
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      );
    }

    // Récupérer les paramètres de requête
    const { searchParams } = new URL(request.url);
    const filters = reportsFilterSchema.parse({
      status: searchParams.get('status'),
      motif: searchParams.get('motif'),
      page: searchParams.get('page'),
      limit: searchParams.get('limit')
    });

    // Construire les conditions de filtrage
    const where: any = {};
    
    if (filters.status) {
      where.status = filters.status;
    }
    
    if (filters.motif) {
      where.motif = filters.motif;
    }

    // Calculs pour la pagination
    const skip = (filters.page - 1) * filters.limit;

    // Récupérer les signalements avec pagination
    const [reports, totalCount] = await Promise.all([
      prisma.report.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
              role: true
            }
          },
          property: {
            select: {
              id: true,
              titre: true,
              adresse: true,
              prix: true,
              isActive: true,
              agent: {
                select: {
                  id: true,
                  nom: true,
                  prenom: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: [
          { status: 'asc' }, // PENDING en premier
          { createdAt: 'desc' }
        ],
        skip,
        take: filters.limit
      }),
      prisma.report.count({ where })
    ]);

    // Statistiques des signalements
    const stats = await prisma.report.groupBy({
      by: ['status'],
      _count: {
        status: true
      }
    });

    const statusStats = stats.reduce((acc, stat) => {
      acc[stat.status] = stat._count.status;
      return acc;
    }, {} as Record<string, number>);

    const formattedReports = reports.map(report => ({
      id: report.id,
      motif: report.motif,
      description: report.description,
      status: report.status,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
      user: {
        id: report.user.id,
        nom: report.user.nom,
        prenom: report.user.prenom,
        email: report.user.email,
        role: report.user.role
      },
      property: {
        id: report.property.id,
        titre: report.property.titre,
        adresse: report.property.adresse,
        prix: report.property.prix,
        isActive: report.property.isActive,
        agent: report.property.agent
      }
    }));

    return NextResponse.json({
      reports: formattedReports,
      pagination: {
        currentPage: filters.page,
        totalPages: Math.ceil(totalCount / filters.limit),
        totalCount,
        hasNextPage: skip + filters.limit < totalCount,
        hasPreviousPage: filters.page > 1
      },
      stats: {
        total: totalCount,
        pending: statusStats.PENDING || 0,
        reviewed: statusStats.REVIEWED || 0,
        resolved: statusStats.RESOLVED || 0,
        dismissed: statusStats.DISMISSED || 0
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des signalements:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Paramètres invalides', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}