// Page des paramètres de sécurité du profil utilisateur
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { SecuritySettings } from '@/components/profile/security-settings';

/**
 * Page des paramètres de sécurité
 * Permet de modifier le mot de passe et gérer les paramètres de sécurité
 * Route: /dashboard/profile/security
 */
export default async function ProfileSecurityPage() {
  // Vérification de l'authentification
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/login?callbackUrl=/dashboard/profile/security');
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Paramètres de sécurité
        </h1>
        <p className="text-gray-600">
          Gérez votre mot de passe et vos paramètres de sécurité.
        </p>
      </div>

      {/* Paramètres de sécurité */}
      <SecuritySettings userId={session.user.id} />
    </div>
  );
}

// Métadonnées pour SEO
export const metadata = {
  title: 'Sécurité - Plateforme Immobilière',
  description: 'Gérez vos paramètres de sécurité et votre mot de passe',
};