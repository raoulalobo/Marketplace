// API route pour gérer un signalement spécifique (admin)
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { UserRole, ReportStatus } from '@prisma/client';
import { z } from 'zod';

// Schéma de validation pour mettre à jour un signalement
const updateReportSchema = z.object({
  status: z.enum(['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED']),
  adminNote: z.string().optional() // Note interne de l'admin
});

// GET /api/reports/[id] - Récupérer un signalement spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const reportId = (await params).id;

    // Récupérer le signalement
    const report = await prisma.report.findUnique({
      where: { id: reportId },
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
            description: true,
            adresse: true,
            prix: true,
            type: true,
            isActive: true,
            createdAt: true,
            agent: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true
              }
            },
            medias: {
              select: {
                url: true,
                type: true,
                order: true
              },
              orderBy: { order: 'asc' }
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

    // Permissions : Admin ou le créateur du signalement
    const isAdmin = session.user.role === UserRole.ADMIN;
    const isReporter = report.userId === session.user.id;

    if (!isAdmin && !isReporter) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    // Pour les non-admins, masquer certaines informations sensibles
    const responseData = {
      id: report.id,
      motif: report.motif,
      description: report.description,
      status: report.status,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
      property: {
        id: report.property.id,
        titre: report.property.titre,
        description: report.property.description,
        adresse: report.property.adresse,
        prix: report.property.prix,
        type: report.property.type,
        isActive: report.property.isActive,
        createdAt: report.property.createdAt.toISOString(),
        medias: report.property.medias
      }
    };

    // Ajouter les informations admin si nécessaire
    if (isAdmin) {
      Object.assign(responseData, {
        user: report.user,
        property: {
          ...responseData.property,
          agent: report.property.agent
        }
      });
    }

    return NextResponse.json({ report: responseData });

  } catch (error) {
    console.error('Erreur lors de la récupération du signalement:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// PATCH /api/reports/[id] - Mettre à jour le statut d'un signalement (admin seulement)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Seuls les admins peuvent modifier le statut
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      );
    }

    const reportId = (await params).id;

    // Vérifier que le signalement existe
    const existingReport = await prisma.report.findUnique({
      where: { id: reportId },
      include: {
        property: {
          select: {
            titre: true,
            agent: {
              select: {
                nom: true,
                prenom: true,
                email: true
              }
            }
          }
        },
        user: {
          select: {
            nom: true,
            prenom: true,
            email: true
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

    // Récupérer et valider les données
    const body = await request.json();
    const validatedData = updateReportSchema.parse(body);

    // Mettre à jour le signalement
    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: validatedData.status as ReportStatus,
        updatedAt: new Date()
      },
      include: {
        property: {
          select: {
            id: true,
            titre: true
          }
        },
        user: {
          select: {
            nom: true,
            prenom: true,
            email: true
          }
        }
      }
    });

    // Log de l'action admin
    console.log(`[ADMIN] ${session.user.name} a mis à jour le signalement ${reportId} vers le statut ${validatedData.status}`);

    // Si le signalement est résolu et que la propriété doit être désactivée
    if (validatedData.status === 'RESOLVED' && existingReport.motif !== 'AUTRE') {
      // Optionnel : désactiver automatiquement la propriété pour certains motifs graves
      const seriousMotifs = ['ARNAQUE', 'CONTENU_INAPPROPRIE', 'PHOTOS_TROMPEUSES'];
      if (seriousMotifs.includes(existingReport.motif)) {
        await prisma.property.update({
          where: { id: existingReport.propertyId },
          data: { isActive: false }
        });
        console.log(`[ADMIN] Propriété ${existingReport.propertyId} désactivée suite au signalement résolu`);
      }
    }

    return NextResponse.json({
      message: `Signalement mis à jour vers le statut: ${validatedData.status}`,
      report: {
        id: updatedReport.id,
        motif: updatedReport.motif,
        status: updatedReport.status,
        propertyTitle: updatedReport.property.titre,
        reporterName: `${updatedReport.user.prenom} ${updatedReport.user.nom}`,
        updatedAt: updatedReport.updatedAt.toISOString()
      }
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du signalement:', error);
    
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

// DELETE /api/reports/[id] - Supprimer un signalement (admin seulement, rare)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    // Seuls les admins peuvent supprimer
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      );
    }

    const reportId = (await params).id;

    // Vérifier que le signalement existe
    const existingReport = await prisma.report.findUnique({
      where: { id: reportId },
      select: { id: true, motif: true, propertyId: true }
    });

    if (!existingReport) {
      return NextResponse.json(
        { error: 'Signalement non trouvé' },
        { status: 404 }
      );
    }

    // Supprimer le signalement
    await prisma.report.delete({
      where: { id: reportId }
    });

    // Log de l'action admin
    console.log(`[ADMIN] ${session.user.name} a supprimé définitivement le signalement ${reportId}`);

    return NextResponse.json({
      message: 'Signalement supprimé définitivement'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression du signalement:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}