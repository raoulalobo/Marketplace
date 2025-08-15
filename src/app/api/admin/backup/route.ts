// API pour la sauvegarde système
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// Forcer le rendu dynamique pour cette route API
export const dynamic = 'force-dynamic';

// POST /api/admin/backup - Lancer une sauvegarde manuelle
export async function POST(request: NextRequest) {
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

    // Simulation d'une sauvegarde
    // Dans un vrai projet, cela déclencherait une sauvegarde réelle
    const backupId = `backup_${Date.now()}`;
    const timestamp = new Date().toISOString();
    
    // Log de l'action
    console.log(`Sauvegarde manuelle déclenchée par ${session.user.email} à ${timestamp}`);
    console.log(`ID de sauvegarde: ${backupId}`);
    
    // Simulation d'un délai de traitement
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({
      success: true,
      message: 'Sauvegarde déclenchée avec succès',
      backupId,
      timestamp,
      estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
    });

  } catch (error) {
    console.error('Erreur API /admin/backup:', error);
    return NextResponse.json(
      { error: 'Erreur lors du déclenchement de la sauvegarde' },
      { status: 500 }
    );
  }
}