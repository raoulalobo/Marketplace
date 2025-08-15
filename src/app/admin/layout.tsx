// Layout pour le dashboard administrateur - Modèle unifié sans sidebar
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export const metadata = {
  title: 'Administration - Marketplace Immo',
  description: 'Dashboard administrateur de la marketplace immobilière',
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Vérifier l'authentification et les permissions
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/auth/login');
  }

  if (session.user.role !== UserRole.ADMIN) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Contenu principal avec le même modèle que les dashboards Agent/Client */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {children}
      </div>
    </div>
  );
}