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
  CheckCircle, 
  Clock, 
  Zap, 
  TrendingUp, 
  Eye,
  Bell,
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

// Composant pour les alertes et insights
const DashboardAlerts: React.FC<{ stats: AgentStats }> = ({ stats }) => {
  const alerts = useMemo(() => {
    const items = [];

    // Alertes urgentes
    if (stats.pendingVisitRequests > 5) {
      items.push({
        type: 'urgent',
        icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
        title: 'Action requise',
        message: `${stats.pendingVisitRequests} demandes de visite en attente depuis plus de 24h.`,
        action: 'Traiter maintenant',
        color: 'red',
      });
    }

    // Opportunités commerciales
    if (stats.totalViews > 100 && stats.conversionRate < 3) {
      items.push({
        type: 'opportunity',
        icon: <Zap className="w-5 h-5 text-orange-600" />,
        title: 'Opportunité détectée',
        message: 'Beaucoup de vues mais peu de conversions. Pensez à ajuster vos prix ou descriptions.',
        action: 'Optimiser',
        color: 'orange',
      });
    }

    // Succès récents
    if (stats.propertiesSoldThisMonth > 0) {
      items.push({
        type: 'success',
        icon: <CheckCircle className="w-5 h-5 text-green-600" />,
        title: 'Félicitations !',
        message: `${stats.propertiesSoldThisMonth} ${stats.propertiesSoldThisMonth === 1 ? 'vente ce mois' : 'ventes ce mois'}. Excellent travail !`,
        action: 'Voir détails',
        color: 'green',
      });
    }

    // Rappels et suivis
    items.push({
      type: 'reminder',
      icon: <Clock className="w-5 h-5 text-blue-600" />,
      title: 'Rappels du jour',
      message: 'Relancer 3 clients inactifs, mettre à jour 2 annonces, répondre aux messages.',
      action: 'Planifier',
      color: 'blue',
    });

    // Tendances marché
    if (stats.propertiesByType.length > 0) {
      const topType = stats.propertiesByType[0];
      items.push({
        type: 'trend',
        icon: <TrendingUp className="w-5 h-5 text-purple-600" />,
        title: 'Tendance marché',
        message: `Les ${topType.type.toLowerCase()} sont en forte demande ce mois (+15%).`,
        action: 'En savoir plus',
        color: 'purple',
      });
    }

    // Performance personnelle
    items.push({
      type: 'performance',
      icon: <Eye className="w-5 h-5 text-indigo-600" />,
      title: 'Votre performance',
      message: `Vous êtes dans le top ${stats.conversionRate > 5 ? '20%' : '40%'} des agents cette semaine !`,
      action: 'Voir classement',
      color: 'indigo',
    });

    return items;
  }, [stats]);

  const colorClasses: Record<string, string> = {
    red: 'bg-red-50 border-red-200 text-red-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-800',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Alertes et Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map((alert, index) => (
            <div
              key={index}
              className={`p-4 border rounded-lg ${colorClasses[alert.color]}`}
            >
              <div className="flex items-center gap-2 mb-2">
                {alert.icon}
                <span className="font-medium">{alert.title}</span>
              </div>
              <p className="text-sm mb-2">{alert.message}</p>
              <button className="text-xs font-medium hover:underline">
                {alert.action}
              </button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
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
      <div className="container mx-auto px-4 py-8 space-y-8">
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

        {/* Deux colonnes pour le reste */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Colonne de gauche (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Métriques de performance */}
            <PerformanceMetrics stats={stats} />

            {/* Distribution des propriétés */}
            <PropertyDistribution
              propertiesByCity={stats.propertiesByCity}
              propertiesByType={stats.propertiesByType}
            />
          </div>

          {/* Colonne de droite (1/3) */}
          <div className="space-y-6">
            {/* Alertes et insights */}
            <DashboardAlerts stats={stats} />

            {/* Demandes de visite récentes */}
            <RecentVisitRequests visitRequests={visitRequests} />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};