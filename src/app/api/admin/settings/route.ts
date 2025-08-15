// API pour les paramètres système
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// Forcer le rendu dynamique pour cette route API
export const dynamic = 'force-dynamic';

// Interface pour les paramètres système
interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    supportEmail: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    defaultPropertyListingDuration: number;
    maxPhotoUploadsPerProperty: number;
    featuredPropertyCost: number;
  };
  moderation: {
    autoApproveProperties: boolean;
    requireEmailVerification: boolean;
    maxReportsBeforeAutoSuspend: number;
    suspensionDurationDays: number;
    moderationNotificationEmail: string;
  };
  notifications: {
    emailNotificationsEnabled: boolean;
    smsNotificationsEnabled: boolean;
    notifyAdminOnNewProperty: boolean;
    notifyAdminOnNewReport: boolean;
    notifyAgentOnPropertyView: boolean;
    dailyDigestEnabled: boolean;
  };
  backup: {
    autoBackupEnabled: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    maxBackupRetention: number;
    lastBackupDate: Date | null;
    backupStorageUsed: number;
  };
  analytics: {
    enableUserTracking: boolean;
    enablePerformanceMonitoring: boolean;
    dataRetentionDays: number;
    allowCookies: boolean;
  };
  security: {
    sessionTimeoutMinutes: number;
    maxLoginAttempts: number;
    lockoutDurationMinutes: number;
    requireStrongPasswords: boolean;
    twoFactorEnabled: boolean;
  };
}

// Paramètres par défaut du système
const defaultSettings: SystemSettings = {
  general: {
    siteName: "Marketplace Immobilière",
    siteDescription: "Plateforme de mise en relation entre agents immobiliers et acheteurs",
    supportEmail: "support@marketplace-immo.com",
    maintenanceMode: false,
    registrationEnabled: true,
    defaultPropertyListingDuration: 30,
    maxPhotoUploadsPerProperty: 10,
    featuredPropertyCost: 50000 // 50k FCFA
  },
  moderation: {
    autoApproveProperties: false,
    requireEmailVerification: true,
    maxReportsBeforeAutoSuspend: 3,
    suspensionDurationDays: 7,
    moderationNotificationEmail: "moderation@marketplace-immo.com"
  },
  notifications: {
    emailNotificationsEnabled: true,
    smsNotificationsEnabled: false,
    notifyAdminOnNewProperty: true,
    notifyAdminOnNewReport: true,
    notifyAgentOnPropertyView: false,
    dailyDigestEnabled: true
  },
  backup: {
    autoBackupEnabled: true,
    backupFrequency: 'daily',
    maxBackupRetention: 30,
    lastBackupDate: new Date(),
    backupStorageUsed: 1024 // 1GB en MB
  },
  analytics: {
    enableUserTracking: true,
    enablePerformanceMonitoring: true,
    dataRetentionDays: 365,
    allowCookies: true
  },
  security: {
    sessionTimeoutMinutes: 120,
    maxLoginAttempts: 3,
    lockoutDurationMinutes: 15,
    requireStrongPasswords: true,
    twoFactorEnabled: false
  }
};

// GET /api/admin/settings - Récupérer les paramètres système
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

    // Pour cette démo, on retourne les paramètres par défaut
    // Dans un vrai projet, ils seraient stockés en base de données
    return NextResponse.json(defaultSettings);

  } catch (error) {
    console.error('Erreur API /admin/settings:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/settings - Mettre à jour les paramètres système
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    
    // Validation basique des données
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Données invalides' },
        { status: 400 }
      );
    }

    // Ici, dans un vrai projet, on sauvegarderait en base de données
    // Pour cette démo, on simule la sauvegarde
    console.log('Paramètres mis à jour:', body);
    
    // Log de l'action admin
    console.log(`Admin ${session.user.email} a mis à jour les paramètres système à ${new Date().toISOString()}`);

    return NextResponse.json({
      success: true,
      message: 'Paramètres mis à jour avec succès',
      updatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur API /admin/settings PUT:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}