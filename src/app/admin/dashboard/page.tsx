// Dashboard administrateur unifié - Modèle Agent/Client
'use client';

import { useEffect, useState } from 'react';
import { AdminBreadcrumb } from '@/components/admin/admin-breadcrumb';
import { AdminQuickActions } from '@/components/admin/admin-quick-actions';
import { AdminDashboardSections } from '@/components/admin/admin-dashboard-sections';
import { StatsCard } from '@/components/dashboard/dashboard-stats';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { 
  Users, 
  Home, 
  Flag, 
  Eye,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Shield
} from 'lucide-react';

// Interface pour les statistiques principales
interface AdminStats {
  totalUsers: number;
  totalAgents: number;
  totalAcheteurs: number;
  totalProperties: number;
  activeProperties: number;
  totalReports: number;
  pendingReports: number;
  totalViews: number;
  conversionRate: number;
  activeUsers24h: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/dashboard/admin-stats');
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des statistiques');
        }
        const data = await response.json();
        setStats(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Chargement du dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center">
        <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Erreur de chargement</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6 sm:space-y-8 lg:space-y-10">
        {/* Fil d'ariane */}
        <AdminBreadcrumb 
          items={[
            { label: 'Dashboard', icon: <BarChart3 className="w-4 h-4" /> }
          ]} 
        />

        {/* En-tête - Modèle Agent/Client */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard Administrateur
          </h1>
          <p className="text-gray-600">
            Vue d'ensemble et gestion de la marketplace immobilière - Surveillez les performances, gérez les utilisateurs et modérez le contenu.
          </p>
        </div>

        {/* Actions rapides - Modèle Agent/Client */}
        <AdminQuickActions />

        {/* Statistiques principales - Modèle Agent/Client */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatsCard
              title="Utilisateurs"
              value={stats.totalUsers}
              icon={<Users className="w-5 h-5 text-blue-600" />}
              description={`${stats.totalAgents} agents, ${stats.totalAcheteurs} acheteurs`}
            />
            <StatsCard
              title="Propriétés"
              value={stats.totalProperties}
              icon={<Home className="w-5 h-5 text-green-600" />}
              description={`${stats.activeProperties} actives`}
            />
            <StatsCard
              title="Signalements"
              value={stats.totalReports}
              icon={<Flag className="w-5 h-5 text-red-600" />}
              description={`${stats.pendingReports} en attente`}
            />
            <StatsCard
              title="Vues Totales"
              value={stats.totalViews}
              icon={<Eye className="w-5 h-5 text-purple-600" />}
              description="Toutes propriétés"
            />
          </div>
        )}

        {/* Métriques de performance */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            <StatsCard
              title="Taux Conversion"
              value={`${stats.conversionRate}%`}
              icon={<TrendingUp className="w-5 h-5 text-orange-600" />}
              description="Vue → Demande visite"
            />
            <StatsCard
              title="Utilisateurs Actifs"
              value={stats.activeUsers24h}
              icon={<Users className="w-5 h-5 text-indigo-600" />}
              description="Dernières 24h"
            />
            <StatsCard
              title="Système"
              value="99.8%"
              icon={<Shield className="w-5 h-5 text-green-600" />}
              description="Disponibilité"
            />
            <StatsCard
              title="Performance"
              value="245ms"
              icon={<BarChart3 className="w-5 h-5 text-cyan-600" />}
              description="Temps réponse moyen"
            />
          </div>
        )}

        {/* Alerte si signalements en attente */}
        {stats && stats.pendingReports > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-yellow-800 font-medium">
                  {stats.pendingReports} signalement{stats.pendingReports > 1 ? 's' : ''} en attente
                </p>
                <p className="text-yellow-700 text-sm">
                  Ces signalements nécessitent votre attention pour maintenir la qualité de la marketplace.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sections détaillées - Intégration du contenu des sous-pages */}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Gestion de la plateforme</h2>
          </div>
          <AdminDashboardSections />
        </div>
      </div>
    </ErrorBoundary>
  );
}