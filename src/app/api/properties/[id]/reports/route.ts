// API route pour créer un signalement pour une propriété spécifique
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

// Schéma de validation pour un signalement
const reportSchema = z.object({
  motif: z.string().min(1, 'Le motif est requis').max(100, 'Le motif ne peut pas dépasser 100 caractères'),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères').max(1000, 'La description ne peut pas dépasser 1000 caractères')
});

// Motifs de signalement prédéfinis
const REPORT_MOTIFS = {
  CONTENU_INAPPROPRIE: 'Contenu inapproprié',
  INFORMATIONS_ERRONEES: 'Informations erronées',
  PRIX_SUSPECT: 'Prix suspect ou trompeur',
  PHOTOS_TROMPEUSES: 'Photos trompeuses',
  SPAM: 'Spam ou publicité',
  ARNAQUE: 'Tentative d\'arnaque',
  AUTRE: 'Autre problème'
} as const;

// POST /api/properties/[id]/reports - Créer un signalement
export async function POST(
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

    const propertyId = (await params).id;

    // Vérifier que la propriété existe
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { 
        id: true, 
        titre: true,
        agentId: true
      }
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Propriété non trouvée' },
        { status: 404 }
      );
    }

    // Un agent ne peut pas signaler sa propre propriété
    if (property.agentId === session.user.id) {
      return NextResponse.json(
        { error: 'Vous ne pouvez pas signaler votre propre propriété' },
        { status: 400 }
      );
    }

    // Vérifier s'il y a déjà un signalement récent de cet utilisateur pour cette propriété
    const recentReport = await prisma.report.findFirst({
      where: {
        userId: session.user.id,
        propertyId: propertyId,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Dernières 24h
        }
      }
    });

    if (recentReport) {
      return NextResponse.json(
        { error: 'Vous avez déjà signalé cette propriété récemment. Veuillez attendre 24h avant de faire un nouveau signalement.' },
        { status: 429 }
      );
    }

    // Récupérer et valider les données
    const body = await request.json();
    const validatedData = reportSchema.parse(body);

    // Vérifier que le motif est valide
    const validMotifs = Object.keys(REPORT_MOTIFS);
    if (!validMotifs.includes(validatedData.motif)) {
      return NextResponse.json(
        { error: 'Motif de signalement invalide' },
        { status: 400 }
      );
    }

    // Créer le signalement
    const report = await prisma.report.create({
      data: {
        userId: session.user.id,
        propertyId: propertyId,
        motif: validatedData.motif,
        description: validatedData.description,
        status: 'PENDING'
      },
      include: {
        property: {
          select: {
            id: true,
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
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        }
      }
    });

    // Log pour les admins (optionnel)
    console.log(`[SIGNALEMENT] Nouveau signalement pour la propriété "${property.titre}" par ${session.user.name} - Motif: ${validatedData.motif}`);

    return NextResponse.json(
      {
        message: 'Signalement créé avec succès. Notre équipe examinera votre demande dans les plus brefs délais.',
        report: {
          id: report.id,
          motif: report.motif,
          motifLabel: REPORT_MOTIFS[report.motif as keyof typeof REPORT_MOTIFS],
          description: report.description,
          propertyTitle: report.property.titre,
          status: report.status,
          createdAt: report.createdAt.toISOString()
        }
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Erreur lors de la création du signalement:', error);
    
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

// GET /api/properties/[id]/reports - Récupérer les signalements d'une propriété (admin seulement)
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

    // Seuls les admins peuvent voir les signalements
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      );
    }

    const propertyId = (await params).id;

    // Récupérer tous les signalements pour cette propriété
    const reports = await prisma.report.findMany({
      where: { propertyId },
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        },
        property: {
          select: {
            id: true,
            titre: true,
            agent: {
              select: {
                nom: true,
                prenom: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formattedReports = reports.map(report => ({
      id: report.id,
      motif: report.motif,
      motifLabel: REPORT_MOTIFS[report.motif as keyof typeof REPORT_MOTIFS],
      description: report.description,
      status: report.status,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
      user: report.user,
      property: report.property
    }));

    return NextResponse.json({
      reports: formattedReports,
      total: reports.length
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des signalements:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}