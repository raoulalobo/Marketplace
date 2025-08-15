// API pour la mise à jour d'un signalement par l'admin
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { UserRole, ReportStatus } from '@prisma/client';

// Forcer le rendu dynamique pour cette route API
export const dynamic = 'force-dynamic';

// PUT /api/admin/reports/[id] - Mettre à jour un signalement
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

    const reportId = params.id;
    const body = await request.json();
    const { status } = body;

    // Validation des données
    if (!status || !Object.values(ReportStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Statut invalide' },
        { status: 400 }
      );
    }

    // Vérifier que le signalement existe
    const existingReport = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        property: {
          select: {
            id: true,
            titre: true,
            isActive: true
          }
        }
      }
    });

    if (!existingReport) {
      return NextResponse.json(
        { error: 'Signalement non trouvé' },
        { status: 404 }
      );
    }

    // Mettre à jour le signalement
    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: { 
        status,
        updatedAt: new Date()
      },
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
    });

    // Si le signalement est résolu positivement et la propriété est toujours active,
    // on pourrait envisager de désactiver la propriété (selon les règles métier)
    if (status === ReportStatus.RESOLVED && existingReport.property.isActive) {
      // Optionnel: désactiver la propriété signalée
      // await prisma.property.update({
      //   where: { id: existingReport.property.id },
      //   data: { isActive: false }
      // });
    }

    return NextResponse.json({
      message: 'Signalement mis à jour avec succès',
      report: updatedReport
    });

  } catch (error) {
    console.error('Erreur API /admin/reports/[id]:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// GET /api/admin/reports/[id] - Récupérer un signalement spécifique
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

    const reportId = params.id;

    // Récupérer le signalement avec tous ses détails
    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nom: true,
            prenom: true,
            telephone: true,
            role: true,
            createdAt: true
          }
        },
        property: {
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
            medias: {
              take: 3,
              orderBy: { order: 'asc' }
            },
            _count: {
              select: {
                reports: true,
                views: true,
                favorites: true
              }
            }
          }
        }
      }
    });

    if (!report) {
      return NextResponse.json(
        { error: 'Signalement non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json(report);

  } catch (error) {
    console.error('Erreur API GET /admin/reports/[id]:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}