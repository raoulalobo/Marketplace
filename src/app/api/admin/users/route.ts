// API pour la gestion des utilisateurs par l'admin
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// Forcer le rendu dynamique pour cette route API
export const dynamic = 'force-dynamic';

// Interface pour les utilisateurs avec statistiques
interface UserWithStats {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone: string | null;
  role: UserRole;
  isActive: boolean;
  emailVerified: Date | null;
  createdAt: Date;
  lastLoginAt: Date | null;
  stats: {
    propertiesCount: number;
    favoritesCount: number;
    reportsCount: number;
    visitRequestsCount: number;
  };
}

// GET /api/admin/users - Récupérer la liste des utilisateurs
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
    const roleFilter = searchParams.get('role') as UserRole | null;
    const statusFilter = searchParams.get('status'); // 'active', 'inactive', 'all'
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Construction des filtres
    const where: any = {};
    
    if (roleFilter && Object.values(UserRole).includes(roleFilter)) {
      where.role = roleFilter;
    }
    
    if (statusFilter === 'active') {
      where.isActive = true;
    } else if (statusFilter === 'inactive') {
      where.isActive = false;
    }
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { nom: { contains: search, mode: 'insensitive' } },
        { prenom: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Calcul de la pagination
    const skip = (page - 1) * limit;

    // Récupération des utilisateurs avec leurs statistiques
    const [users, totalCount] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              properties: true,
              favorites: true,
              reports: true,
              visitRequests: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ]);

    // Transformation des données pour inclure les stats
    const usersWithStats: UserWithStats[] = users.map(user => ({
      id: user.id,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      telephone: user.telephone,
      role: user.role,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      stats: {
        propertiesCount: user._count.properties,
        favoritesCount: user._count.favorites,
        reportsCount: user._count.reports,
        visitRequestsCount: user._count.visitRequests
      }
    }));

    // Calcul des métadonnées de pagination
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      users: usersWithStats,
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
    console.error('Erreur API /admin/users:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}