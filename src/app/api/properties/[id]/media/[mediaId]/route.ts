// API route pour supprimer un média spécifique d'une propriété
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// DELETE /api/properties/[id]/media/[mediaId] - Supprimer un média spécifique
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; mediaId: string }> }
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

    const { id: propertyId, mediaId } = await params;

    // Vérifier que le média existe et appartient à cette propriété
    const existingMedia = await prisma.propertyMedia.findUnique({
      where: { id: mediaId },
      include: {
        property: {
          select: {
            id: true,
            agentId: true
          }
        }
      }
    });

    if (!existingMedia) {
      return NextResponse.json(
        { error: 'Média non trouvé' },
        { status: 404 }
      );
    }

    // Vérifier que le média appartient bien à la propriété demandée
    if (existingMedia.property.id !== propertyId) {
      return NextResponse.json(
        { error: 'Le média n\'appartient pas à cette propriété' },
        { status: 400 }
      );
    }

    // Vérifier les permissions (propriétaire ou admin)
    if (
      session.user.role !== 'ADMIN' &&
      existingMedia.property.agentId !== session.user.id
    ) {
      return NextResponse.json(
        { error: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }

    // Supprimer le média de la base de données
    await prisma.propertyMedia.delete({
      where: { id: mediaId }
    });

    // TODO: Optionnel - Supprimer le fichier de Backblaze B2
    // La suppression du fichier physique pourrait être implémentée ici
    // mais ce n'est pas critique car cela évite les liens brisés en cas de restauration

    return NextResponse.json({
      message: 'Média supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression du média:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}