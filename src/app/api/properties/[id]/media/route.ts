// API route pour ajouter des médias à une propriété existante
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// POST /api/properties/[id]/media - Ajouter des médias à une propriété
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

    const { id } = await params;
    const body = await request.json();
    const { mediaUrls } = body; // Array of { url: string, type: 'photo' | 'video' }

    if (!mediaUrls || !Array.isArray(mediaUrls) || mediaUrls.length === 0) {
      return NextResponse.json(
        { error: 'Aucun média fourni' },
        { status: 400 }
      );
    }

    // Vérifier que la propriété existe et que l'utilisateur a les permissions
    const existingProperty = await prisma.property.findUnique({
      where: { id },
      select: { 
        agentId: true,
        medias: {
          select: { type: true }
        }
      }
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

    // Vérifier les limites de médias
    const currentPhotos = existingProperty.medias.filter(m => m.type === 'PHOTO').length;
    const currentVideos = existingProperty.medias.filter(m => m.type === 'VIDEO').length;

    const newPhotos = mediaUrls.filter(m => m.type === 'photo').length;
    const newVideos = mediaUrls.filter(m => m.type === 'video').length;

    if (currentPhotos + newPhotos > 5) {
      return NextResponse.json(
        { error: `Limite de 5 photos dépassée. Actuellement: ${currentPhotos}, nouvelles: ${newPhotos}` },
        { status: 400 }
      );
    }

    if (currentVideos + newVideos > 5) {
      return NextResponse.json(
        { error: `Limite de 5 vidéos dépassée. Actuellement: ${currentVideos}, nouvelles: ${newVideos}` },
        { status: 400 }
      );
    }

    // Obtenir le prochain numéro d'ordre
    const maxOrder = await prisma.propertyMedia.findFirst({
      where: { propertyId: id },
      orderBy: { order: 'desc' },
      select: { order: true }
    });

    const startOrder = (maxOrder?.order || 0) + 1;

    // Créer les nouveaux médias en transaction
    const createdMedias = await prisma.$transaction(
      mediaUrls.map((media, index) => 
        prisma.propertyMedia.create({
          data: {
            url: media.url,
            type: media.type === 'photo' ? 'PHOTO' : 'VIDEO',
            order: startOrder + index,
            propertyId: id
          }
        })
      )
    );

    return NextResponse.json({
      message: `${createdMedias.length} média(s) ajouté(s) avec succès`,
      medias: createdMedias
    });

  } catch (error) {
    console.error('Erreur lors de l\'ajout des médias:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}