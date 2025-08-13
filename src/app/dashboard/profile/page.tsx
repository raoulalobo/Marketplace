// Page principale du profil utilisateur sous /dashboard/profile
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ProfileContent } from '@/components/profile/profile-content';

/**
 * Page principale du profil utilisateur
 * Affiche les informations personnelles et permet la navigation vers les sous-pages
 * Route: /dashboard/profile
 */
export default async function ProfilePage() {
  // Vérification de l'authentification
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/login?callbackUrl=/dashboard/profile');
  }

  // Récupération des données complètes de l'utilisateur
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      role: true,
      telephone: true,
      avatar: true,
      createdAt: true,
      // Statistiques optionnelles selon le rôle
      properties: session.user.role === 'AGENT' ? {
        select: { id: true }
      } : false,
      favorites: session.user.role === 'ACHETEUR' ? {
        select: { id: true }
      } : false,
      visitRequests: session.user.role === 'ACHETEUR' ? {
        select: { id: true }
      } : false,
    }
  });

  if (!user) {
    redirect('/auth/login');
  }

  return <ProfileContent user={user} />;
}

// Métadonnées pour SEO
export const metadata = {
  title: 'Mon Profil - Plateforme Immobilière',
  description: 'Gérez vos informations personnelles et vos préférences',
};