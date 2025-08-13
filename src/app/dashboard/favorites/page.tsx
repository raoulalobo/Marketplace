// Page des favoris unifiée pour tous les rôles utilisateur
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { FavoritesContent } from '@/components/dashboard/favorites-content';

export default async function FavoritesPage() {
  // Vérifier l'authentification et les permissions
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login?callbackUrl=/dashboard/favorites');
  }

  // Vérifier que l'utilisateur a un rôle autorisé
  if (!['AGENT', 'ACHETEUR', 'ADMIN'].includes(session.user.role)) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <FavoritesContent user={session.user} />
      </div>
    </div>
  );
}