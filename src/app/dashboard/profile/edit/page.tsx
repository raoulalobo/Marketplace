// Page d'édition du profil utilisateur
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ProfileEditForm } from '@/components/profile/profile-edit-form';

/**
 * Page d'édition des informations du profil utilisateur
 * Permet de modifier les informations personnelles (nom, email, téléphone, avatar)
 * Route: /dashboard/profile/edit
 */
export default async function ProfileEditPage() {
  // Vérification de l'authentification
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/login?callbackUrl=/dashboard/profile/edit');
  }

  // Récupération des données utilisateur à éditer
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      telephone: true,
      avatar: true,
      role: true,
    }
  });

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Modifier mon profil
        </h1>
        <p className="text-gray-600">
          Mettez à jour vos informations personnelles et vos préférences.
        </p>
      </div>

      {/* Formulaire d'édition */}
      <ProfileEditForm user={user} />
    </div>
  );
}

// Métadonnées pour SEO
export const metadata = {
  title: 'Modifier mon profil - Plateforme Immobilière',
  description: 'Modifiez vos informations personnelles et vos préférences',
};