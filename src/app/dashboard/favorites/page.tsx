// Page des favoris pour les agents immobiliers
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AgentFavorites } from '@/components/dashboard/agent-favorites';

export default async function FavoritesPage() {
  // Vérifier l'authentification et les permissions
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login');
  }

  // Vérifier que l'utilisateur est bien un agent ou admin
  if (session.user.role !== 'AGENT' && session.user.role !== 'ADMIN' && session.user.role !== 'ACHETEUR') {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Mes favoris
        </h1>
        <p className="text-gray-600">
          Propriétés que vous avez ajoutées à vos favoris
        </p>
      </div>
      
      <AgentFavorites userId={session.user.id} />
    </div>
  );
}