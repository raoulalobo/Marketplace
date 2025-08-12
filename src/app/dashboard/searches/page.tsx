// Page des recherches sauvegardées pour les acheteurs
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SearchHistory } from '@/components/dashboard/search-history';

export default async function SearchesPage() {
  // Vérifier l'authentification et les permissions
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/login');
  }

  // Vérifier que l'utilisateur est un acheteur ou admin
  if (session.user.role !== 'ACHETEUR' && session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Mes recherches sauvegardées
        </h1>
        <p className="text-gray-600">
          Retrouvez et relancez vos recherches précédentes
        </p>
      </div>
      
      <SearchHistory userId={session.user.id} />
    </div>
  );
}