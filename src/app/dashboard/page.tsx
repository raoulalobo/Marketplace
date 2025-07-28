// Page dashboard avec contenu conditionnel selon le rôle
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';

import { AgentDashboard } from '@/components/dashboard/agent-dashboard';
import { AcheteurDashboard } from '@/components/dashboard/acheteur-dashboard';
import { AdminDashboard } from '@/components/dashboard/admin-dashboard';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  // Redirection si non connecté
  if (!session) {
    redirect('/auth/login');
  }

  // Contenu conditionnel selon le rôle
  switch (session.user.role) {
    case UserRole.AGENT:
      return <AgentDashboard user={session.user} />;
    
    case UserRole.ACHETEUR:
      return <AcheteurDashboard user={session.user} />;
    
    case UserRole.ADMIN:
      return <AdminDashboard user={session.user} />;
    
    default:
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Tableau de bord
            </h1>
            <p className="text-gray-600">
              Rôle non reconnu. Veuillez contacter l'administrateur.
            </p>
          </div>
        </div>
      );
  }
}