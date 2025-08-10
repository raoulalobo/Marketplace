// Dashboard agent optimisé et scindé en composants
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { StatsCard, QuickActions, PerformanceMetrics, PropertyDistribution } from './dashboard-stats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Home,
  AlertTriangle, 
  TrendingUp, 
  Eye,
  MessageSquare
} from 'lucide-react';

// Interfaces
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AgentStats {
  totalProperties: number;
  activeProperties: number;
  inactiveProperties: number;
  propertiesSoldThisMonth: number;
  propertiesAddedThisWeek: number;
  totalViews: number;
  totalVisitRequests: number;
  pendingVisitRequests: number;
  confirmedVisitRequests: number;
  totalMessages: number;
  unreadMessages: number;
  totalRevenue: number;
  conversionRate: number;
  viewsLast30Days: Array<{ date: string; views: number }>;
  propertiesByCity: Array<{ city: string; count: number }>;
  propertiesByType: Array<{ type: string; count: number; avgPrice: number }>;
  topProperties: Array<{
    id: string;
    titre: string;
    views: number;
    visitRequests: number;
  }>;
  avgPrice: number;
  marketAvgPrice: number;
}

interface VisitRequest {
  id: string;
  message: string | null;
  datePreferee: string | null;
  status: string;
  createdAt: string;
  requester: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
  };
  property: {
    id: string;
    titre: string;
    prix: number;
    adresse: string;
    type: string;
  };
}

interface AgentDashboardProps {
  user: User;
}

// Hook pour charger les données du dashboard
const useDashboardData = () => {
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [visitRequests, setVisitRequests] = useState<VisitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch('/api/dashboard/agent-stats');
      
      if (response.ok) {
        const data: AgentStats = await response.json();
        setStats(data);
      } else {
        setError('Erreur lors du chargement des statistiques');
      }
    } catch (error) {
      setError('Erreur de connexion');
      console.error('Erreur API:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVisitRequests = useCallback(async () => {
    try {
      const response = await fetch('/api/dashboard/agent-visit-requests?limit=5');
      
      if (response.ok) {
        const data = await response.json();
        setVisitRequests(data.visitRequests || []);
      }
    } catch (error) {
      console.error('Erreur API demandes de visite:', error);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    fetchVisitRequests();
  }, [fetchStats, fetchVisitRequests]);

  return { stats, visitRequests, loading, error, refetch: fetchStats };
};


// Composant pour les demandes de visite récentes
const RecentVisitRequests: React.FC<{ visitRequests: VisitRequest[] }> = ({ visitRequests }) => {
  const formatCurrency = useMemo(() => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format;
  }, []);

  const formatDate = useMemo(() => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format;
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'ACCEPTED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Demandes récentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {visitRequests.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            Aucune demande de visite récente
          </p>
        ) : (
          <div className="space-y-3">
            {visitRequests.slice(0, 5).map((request) => (
              <div key={request.id} className="border-b border-gray-100 pb-3 last:border-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">
                        {request.requester.prenom} {request.requester.nom}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(request.status)}`}>
                        {request.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">
                      {request.property.titre}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{formatCurrency(request.property.prix)}</span>
                      <span>{formatDate(new Date(request.createdAt))}</span>
                    </div>
                    {request.message && (
                      <p className="text-sm text-gray-700 mt-2 italic">
                        "{request.message}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Composant principal du dashboard
export const AgentDashboard: React.FC<AgentDashboardProps> = ({ user }) => {
  const { stats, visitRequests, loading, error } = useDashboardData();

  // Utilitaires de formatage mémoïzés
  const formatCurrency = useMemo(() => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format;
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner 
          size="lg" 
          text="Chargement du tableau de bord..." 
          center 
        />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Erreur de chargement'}
          </h3>
          <p className="text-gray-600 mb-4">
            Impossible de charger les statistiques du tableau de bord.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12 space-y-6 sm:space-y-8 lg:space-y-10">
        {/* En-tête */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tableau de bord Agent
          </h1>
          <p className="text-gray-600">
            Bonjour {user.name}, gérez vos propriétés et suivez vos performances.
          </p>
        </div>

        {/* Actions rapides */}
        <QuickActions />

        {/* Statistiques principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatsCard
            title="Total Biens"
            value={stats.totalProperties}
            icon={<Home className="w-5 h-5 text-blue-600" />}
            description={`${stats.activeProperties} actifs`}
          />
          <StatsCard
            title="Vues Totales"
            value={stats.totalViews}
            icon={<Eye className="w-5 h-5 text-green-600" />}
            description="Ce mois"
          />
          <StatsCard
            title="Demandes"
            value={stats.totalVisitRequests}
            icon={<MessageSquare className="w-5 h-5 text-purple-600" />}
            description={`${stats.pendingVisitRequests} en attente`}
          />
          <StatsCard
            title="Revenus"
            value={formatCurrency(stats.totalRevenue)}
            icon={<TrendingUp className="w-5 h-5 text-orange-600" />}
            description="Ce mois"
          />
        </div>

        {/* Layout moderne en sections */}
        <div className="space-y-8">
          {/* Section Analytics - Distribution des propriétés */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Analytics</h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PropertyDistribution
                propertiesByCity={stats.propertiesByCity}
                propertiesByType={stats.propertiesByType}
              />
            </div>
          </div>

          {/* Section Prix Moyen et Activité */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Métrique Prix Moyen */}
            <div className="lg:col-span-1">
              <PerformanceMetrics stats={stats} />
            </div>

            {/* Activité Récente */}
            <div className="lg:col-span-2">
              <RecentVisitRequests visitRequests={visitRequests} />
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};