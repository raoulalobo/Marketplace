// API pour la gestion des signalements par l'admin
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { UserRole, ReportStatus } from '@prisma/client';

// Forcer le rendu dynamique pour cette route API
export const dynamic = 'force-dynamic';

// Interface pour un signalement avec ses détails
interface ReportWithDetails {
  id: string;
  motif: string;
  description: string | null;
  status: ReportStatus;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    email: string;
    nom: string;
    prenom: string;
  };
  property: {
    id: string;
    titre: string;
    prix: number;
    adresse: string;
    isActive: boolean;
    agent: {
      id: string;
      nom: string;
      prenom: string;
      email: string;
    };
  };
}

// GET /api/admin/reports - Récupérer la liste des signalements
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
    const statusFilter = searchParams.get('status') as ReportStatus | 'all' | null;
    const motifFilter = searchParams.get('motif') || '';
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Construction des filtres
    const where: any = {};
    
    if (statusFilter && statusFilter !== 'all' && Object.values(ReportStatus).includes(statusFilter as ReportStatus)) {
      where.status = statusFilter;
    }
    
    if (motifFilter) {
      where.motif = { contains: motifFilter, mode: 'insensitive' };
    }
    
    if (search) {
      where.OR = [
        { motif: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { property: { titre: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    // Calcul de la pagination
    const skip = (page - 1) * limit;

    // Récupération des signalements avec leurs détails
    const [reports, totalCount] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              nom: true,
              prenom: true
            }
          },
          property: {
            select: {
              id: true,
              titre: true,
              prix: true,
              adresse: true,
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
        }
      }),
      prisma.report.count({ where })
    ]);

    // Calcul des métadonnées de pagination
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      reports: reports as ReportWithDetails[],
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
    console.error('Erreur API /admin/reports:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}