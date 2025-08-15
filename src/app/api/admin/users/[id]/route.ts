// API pour la mise à jour d'un utilisateur par l'admin
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// Forcer le rendu dynamique pour cette route API
export const dynamic = 'force-dynamic';

// PUT /api/admin/users/[id] - Mettre à jour un utilisateur
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Vérifier que l'utilisateur est un admin
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      );
    }

    const userId = params.id;
    const body = await request.json();
    const { role, isActive } = body;

    // Validation des données
    if (role && !Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        { error: 'Rôle invalide' },
        { status: 400 }
      );
    }

    if (typeof isActive !== 'undefined' && typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Statut actif invalide' },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Empêcher l'admin de se désactiver lui-même
    if (userId === session.user.id && isActive === false) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas vous désactiver vous-même' },
        { status: 400 }
      );
    }

    // Empêcher l'admin de changer son propre rôle
    if (userId === session.user.id && role && role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas changer votre propre rôle' },
        { status: 400 }
      );
    }

    // Préparer les données de mise à jour
    const updateData: any = {};
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        isActive: true,
        updatedAt: true
      }
    });

    return NextResponse.json({
      message: 'Utilisateur mis à jour avec succès',
      user: updatedUser
    });

  } catch (error) {
    console.error('Erreur API /admin/users/[id]:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// GET /api/admin/users/[id] - Récupérer un utilisateur spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Vérifier que l'utilisateur est un admin
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      );
    }

    const userId = params.id;

    // Récupérer l'utilisateur avec ses statistiques détaillées
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        properties: {
          select: {
            id: true,
            titre: true,
            prix: true,
            isActive: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        favorites: {
          select: {
            property: {
              select: {
                id: true,
                titre: true,
                prix: true
              }
            },
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        reports: {
          select: {
            id: true,
            motif: true,
            status: true,
            createdAt: true,
            property: {
              select: {
                id: true,
                titre: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        _count: {
          select: {
            properties: true,
            favorites: true,
            reports: true,
            visitRequests: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);

  } catch (error) {
    console.error('Erreur API GET /admin/users/[id]:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}