// API route pour une propriété spécifique
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

// Schéma de validation pour mettre à jour une propriété
const updatePropertySchema = z.object({
  titre: z.string().min(10).optional(),
  description: z.string().min(50).optional(),
  type: z.enum(['MAISON', 'TERRAIN', 'BUREAU', 'HANGAR']).optional(),
  prix: z.number().min(1000000).optional(),
  superficie: z.number().min(10).optional(),
  adresse: z.string().min(10).optional(),
  ville: z.string().min(1).optional(),
  fraisVisite: z.number().min(0).optional(),
  troc: z.boolean().optional(), // Accepte le troc/échange
  payer_apres: z.boolean().optional(), // Accepte le paiement différé
  isActive: z.boolean().optional(),
  photos: z.array(z.string()).min(1).max(5).optional(),
  videos: z.array(z.string()).max(5).optional()
});

/*** Fonction utilitaire pour extraire l'IP réelle du visiteur ***/
function getClientIp(request: NextRequest): string {
  // Vérifier les headers de proxy communs
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const connectingIp = request.headers.get('cf-connecting-ip'); // Cloudflare
  
  if (forwardedFor) {
    // x-forwarded-for peut contenir plusieurs IPs, prendre la première
    return forwardedFor.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  if (connectingIp) {
    return connectingIp;
  }
  
  // Fallback vers l'IP de la requête
  return request.ip || '127.0.0.1';
}

/*** Fonction pour enregistrer une vue avec déduplication ***/
async function trackPropertyView(
  propertyId: string, 
  viewerIp: string, 
  userAgent: string | null,
  userId?: string
) {
  try {
    // Déduplication : Éviter d'enregistrer plusieurs vues de la même IP dans la dernière heure
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const existingView = await prisma.propertyView.findFirst({
      where: {
        propertyId,
        viewerIp,
        createdAt: {
          gte: oneHourAgo
        }
      }
    });
    
    // Si aucune vue récente trouvée, enregistrer la nouvelle vue
    if (!existingView) {
      // Utiliser une transaction pour s'assurer que les deux opérations réussissent
      await prisma.$transaction([
        // Créer l'enregistrement de vue
        prisma.propertyView.create({
          data: {
            propertyId,
            viewerIp,
            userAgent,
            userId
          }
        }),
        // Incrémenter le compteur de vues dans la propriété
        prisma.property.update({
          where: { id: propertyId },
          data: {
            viewsCount: {
              increment: 1
            }
          }
        })
      ]);
    }
  } catch (error) {
    // Log l'erreur mais ne pas faire échouer la requête principale
    console.error('Erreur lors du tracking de vue:', error);
  }
}

// GET /api/properties/[id] - Récupérer une propriété spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Récupérer la propriété avec toutes les informations
    const property = await prisma.property.findUnique({
      where: { 
        id,
        isActive: true // Seulement les propriétés actives
      },
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
          orderBy: {
            order: 'asc'
          }
        },
        _count: {
          select: {
            favorites: true,
            visitRequests: true,
            reports: true,
            views: true // Ajouter le compte des vues
          }
        }
      }
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Propriété non trouvée' },
        { status: 404 }
      );
    }

    // Obtenir les informations de session
    const session = await getServerSession(authOptions);
    
    // Tracker la vue en arrière-plan (asynchrone)
    const viewerIp = getClientIp(request);
    const userAgent = request.headers.get('user-agent');
    const userId = session?.user?.id;
    
    // Tracking asynchrone pour ne pas ralentir la réponse
    trackPropertyView(id, viewerIp, userAgent, userId);
    
    // Pour les utilisateurs non connectés, masquer les informations sensibles de l'agent
    if (!session) {
      property.agent.email = '';
      property.agent.telephone = '';
    }

    return NextResponse.json({ property });

  } catch (error) {
    console.error('Erreur lors de la récupération de la propriété:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// PUT /api/properties/[id] - Mettre à jour une propriété
export async function PUT(
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

    const { id } = await params;

    // Vérifier que la propriété existe
    const existingProperty = await prisma.property.findUnique({
      where: { id },
      select: { agentId: true }
    });

    if (!existingProperty) {
      return NextResponse.json(
        { error: 'Propriété non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier les permissions (propriétaire ou admin)
    if (
      session.user.role !== 'ADMIN' &&
      existingProperty.agentId !== session.user.id
    ) {
      return NextResponse.json(
        { error: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }

    // Récupérer et valider les données
    const body = await request.json();
    const validatedData = updatePropertySchema.parse(body);

    // Mettre à jour la propriété
    const updatedProperty = await prisma.property.update({
      where: { id },
      data: validatedData,
      include: {
        agent: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            telephone: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Propriété mise à jour avec succès',
      property: updatedProperty
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la propriété:', error);
    
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

// DELETE /api/properties/[id] - Supprimer une propriété
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

    const { id } = await params;

    // Vérifier que la propriété existe
    const existingProperty = await prisma.property.findUnique({
      where: { id },
      select: { agentId: true, medias: true }
    });

    if (!existingProperty) {
      return NextResponse.json(
        { error: 'Propriété non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier les permissions (propriétaire ou admin)
    if (
      session.user.role !== 'ADMIN' &&
      existingProperty.agentId !== session.user.id
    ) {
      return NextResponse.json(
        { error: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }

    // Supprimer les relations dépendantes
    await prisma.$transaction([
      // Supprimer les favoris
      prisma.favorite.deleteMany({
        where: { propertyId: id }
      }),
      // Supprimer les demandes de visite
      prisma.visitRequest.deleteMany({
        where: { propertyId: id }
      }),
      // Supprimer les signalements
      prisma.report.deleteMany({
        where: { propertyId: id }
      }),
      // Supprimer la propriété
      prisma.property.delete({
        where: { id }
      })
    ]);

    // TODO: Supprimer les fichiers de Backblaze B2
    // const filesToDelete = [...existingProperty.photos, ...existingProperty.videos];
    // await deleteFromBackblaze(filesToDelete);

    return NextResponse.json({
      message: 'Propriété supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de la propriété:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}