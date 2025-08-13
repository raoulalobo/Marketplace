// API Route pour l'upload d'avatar utilisateur
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Configuration des uploads
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'avatars');

/**
 * Assure que le dossier d'upload existe
 */
async function ensureUploadDir() {
  try {
    await fs.access(UPLOAD_DIR);
  } catch {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Génère un nom de fichier unique
 */
function generateFileName(originalName: string): string {
  const extension = path.extname(originalName);
  const uuid = uuidv4();
  return `${uuid}${extension}`;
}

/**
 * Supprime l'ancien avatar s'il existe
 */
async function removeOldAvatar(avatarUrl: string | null) {
  if (!avatarUrl) return;

  try {
    // Extraire le nom du fichier de l'URL
    const fileName = path.basename(avatarUrl);
    const filePath = path.join(UPLOAD_DIR, fileName);
    
    // Vérifier si le fichier existe et le supprimer
    await fs.access(filePath);
    await fs.unlink(filePath);
    console.log(`Ancien avatar supprimé: ${fileName}`);
  } catch (error) {
    // Ignore les erreurs si le fichier n'existe pas
    console.warn('Impossible de supprimer l\'ancien avatar:', error);
  }
}

/**
 * POST /api/profile/avatar
 * Upload et mise à jour de l'avatar utilisateur
 */
export async function POST(request: NextRequest) {
  try {
    // Vérification de l'authentification
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    // Récupération des données du formulaire
    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Validation du type de fichier
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Type de fichier non autorisé. Utilisez JPEG, PNG ou WebP.' },
        { status: 400 }
      );
    }

    // Validation de la taille du fichier
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Le fichier est trop volumineux. Taille maximale: 5MB.' },
        { status: 400 }
      );
    }

    // Récupération de l'utilisateur actuel pour l'ancien avatar
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatar: true }
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    // Assurer que le dossier d'upload existe
    await ensureUploadDir();

    // Génération du nom de fichier unique
    const fileName = generateFileName(file.name);
    const filePath = path.join(UPLOAD_DIR, fileName);

    // Sauvegarde du fichier
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(filePath, fileBuffer);

    // URL publique du fichier
    const avatarUrl = `/uploads/avatars/${fileName}`;

    // Mise à jour de l'avatar dans la base de données
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        avatar: avatarUrl,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        avatar: true,
      }
    });

    // Suppression de l'ancien avatar (asynchrone, ne pas attendre)
    if (currentUser.avatar && currentUser.avatar !== avatarUrl) {
      removeOldAvatar(currentUser.avatar).catch(console.error);
    }

    return NextResponse.json({
      success: true,
      message: 'Avatar mis à jour avec succès',
      data: {
        avatarUrl: avatarUrl,
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'upload de l\'avatar:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/profile/avatar
 * Supprime l'avatar utilisateur
 */
export async function DELETE() {
  try {
    // Vérification de l'authentification
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Authentification requise' },
        { status: 401 }
      );
    }

    // Récupération de l'utilisateur actuel
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { avatar: true }
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    if (!currentUser.avatar) {
      return NextResponse.json(
        { error: 'Aucun avatar à supprimer' },
        { status: 400 }
      );
    }

    // Suppression de l'avatar de la base de données
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        avatar: null,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        avatar: true,
      }
    });

    // Suppression du fichier (asynchrone)
    removeOldAvatar(currentUser.avatar).catch(console.error);

    return NextResponse.json({
      success: true,
      message: 'Avatar supprimé avec succès',
      data: {
        user: updatedUser
      }
    });

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'avatar:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}