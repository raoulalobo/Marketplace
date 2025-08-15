// API pour les statistiques système du dashboard admin
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// Forcer le rendu dynamique pour cette route API
export const dynamic = 'force-dynamic';

// Interface pour les statistiques système
interface SystemStats {
  database: {
    totalUsers: number;
    totalProperties: number;
    totalReports: number;
    dbSizeGB: number;
    lastOptimized: Date | null;
  };
  performance: {
    avgResponseTime: number;
    uptime: number;
    errorRate: number;
    memoryUsage: number;
  };
  storage: {
    totalStorageGB: number;
    usedStorageGB: number;
    mediaFilesCount: number;
    backupSizeGB: number;
  };
}

// GET /api/admin/stats - Récupérer les statistiques système
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

    // Récupération des statistiques réelles de la base de données
    const [
      totalUsers,
      totalProperties,
      totalReports,
      totalPropertyImages
    ] = await Promise.all([
      // Compter tous les utilisateurs
      prisma.user.count(),
      
      // Compter toutes les propriétés
      prisma.property.count(),
      
      // Compter tous les signalements
      prisma.report.count(),
      
      // Compter les images de propriétés (approximation des fichiers média)
      prisma.propertyImage.count()
    ]);

    // Calcul approximatif de la taille de la base de données
    // Dans un vrai environnement, cela nécessiterait une requête spécialisée selon le SGBD
    const estimatedDbSizeGB = (
      (totalUsers * 1.5) + // ~1.5KB par utilisateur
      (totalProperties * 10) + // ~10KB par propriété
      (totalReports * 2) + // ~2KB par signalement
      (totalPropertyImages * 5000) // ~5MB par image moyenne
    ) / (1024 * 1024 * 1024); // Conversion en GB

    const stats: SystemStats = {
      database: {
        totalUsers,
        totalProperties,
        totalReports,
        dbSizeGB: Math.max(0.1, estimatedDbSizeGB), // Minimum 0.1GB
        lastOptimized: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Il y a 7 jours (simulé)
      },
      performance: {
        avgResponseTime: 245, // ms - à intégrer avec un système de monitoring réel
        uptime: 99.8, // % - à intégrer avec un système de monitoring
        errorRate: 0.02, // 2% - à intégrer avec logs d'erreur
        memoryUsage: 67.5 // % - à intégrer avec système de monitoring
      },
      storage: {
        totalStorageGB: 100, // GB - à configurer selon l'environnement
        usedStorageGB: Math.max(1.5, estimatedDbSizeGB * 1.3), // Base + fichiers système
        mediaFilesCount: totalPropertyImages,
        backupSizeGB: Math.max(0.5, estimatedDbSizeGB * 0.8) // Sauvegardes compressées
      }
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Erreur API /admin/stats:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}