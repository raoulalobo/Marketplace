// Page de gestion des signalements pour l'admin
'use client';

import { useEffect, useState } from 'react';
import { AdminBreadcrumb } from '@/components/admin/admin-breadcrumb';
import { ReportsTable } from '@/components/admin/reports-table';
import { ReportsFilters } from '@/components/admin/reports-filters';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Flag, AlertTriangle, Check, X, Clock } from 'lucide-react';
import { ReportStatus } from '@prisma/client';

// Interface pour un signalement avec ses détails
interface ReportWithDetails {
  id: string;
  motif: string;
  description: string | null;
  status: ReportStatus;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    email: string;
    nom: string;
    prenom: string;
  };
  property: {
    id: string;
    titre: string;
    prix: number;
    adresse: string;
    isActive: boolean;
    agent: {
      id: string;
      nom: string;
      prenom: string;
      email: string;
    };
  };
}

interface ReportsResponse {
  reports: ReportWithDetails[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export default function AdminReportsPage() {
  const [data, setData] = useState<ReportsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États pour les filtres
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: 'all' as ReportStatus | 'all',
    motif: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Fonction pour charger les signalements
  const fetchReports = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.motif && { motif: filters.motif }),
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`/api/admin/reports?${queryParams}`);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des signalements');
      }
      
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour mettre à jour le statut d'un signalement
  const handleStatusUpdate = async (reportId: string, status: ReportStatus) => {
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour');
      }

      // Recharger les données
      await fetchReports();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erreur lors de la mise à jour');
    }
  };

  // Charger les données au montage et quand les filtres changent
  useEffect(() => {
    fetchReports();
  }, [filters]);

  // Gestionnaires d'événements pour les filtres
  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1 // Reset page lors d'un changement de filtre
    }));
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setFilters(prev => ({ ...prev, sortBy, sortOrder }));
  };

  // Calcul des statistiques pour les cartes
  const getStatsFromData = () => {
    if (!data?.reports) return { total: 0, pending: 0, resolved: 0, rejected: 0, recent: 0 };
    
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    return {
      total: data.pagination.totalCount,
      pending: data.reports.filter(r => r.status === ReportStatus.PENDING).length,
      resolved: data.reports.filter(r => r.status === ReportStatus.RESOLVED).length,
      rejected: data.reports.filter(r => r.status === ReportStatus.REJECTED).length,
      recent: data.reports.filter(r => new Date(r.createdAt) >= yesterday).length
    };
  };

  const stats = getStatsFromData();

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Chargement des signalements..." />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-red-800 font-medium">Erreur de chargement</h3>
            <p className="text-red-600 mt-1">{error}</p>
            <button
              onClick={fetchReports}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Fil d'ariane */}
      <AdminBreadcrumb 
        items={[
          { label: 'Signalements', icon: <Flag className="w-4 h-4" /> }
        ]} 
      />

      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Signalements</h1>
        <p className="text-gray-600 mt-2">
          Gérez tous les signalements de propriétés et modérez le contenu de la marketplace
        </p>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Flag className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">Total signalements</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                <p className="text-sm text-gray-600">En attente</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
                <p className="text-sm text-gray-600">Résolus</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
                <p className="text-sm text-gray-600">Rejetés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">{stats.recent}</p>
                <p className="text-sm text-gray-600">Dernières 24h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message d'alerte pour les signalements en attente */}
      {stats.pending > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-yellow-800 font-medium">
                  {stats.pending} signalement{stats.pending > 1 ? 's' : ''} en attente de traitement
                </p>
                <p className="text-yellow-700 text-sm">
                  Ces signalements nécessitent votre attention pour maintenir la qualité de la marketplace.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtres */}
      <ReportsFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        loading={loading}
      />

      {/* Tableau des signalements */}
      {data ? (
        <ReportsTable
          reports={data.reports}
          pagination={data.pagination}
          onPageChange={handlePageChange}
          onSortChange={handleSortChange}
          onStatusUpdate={handleStatusUpdate}
          currentSort={{ sortBy: filters.sortBy, sortOrder: filters.sortOrder }}
          loading={loading}
        />
      ) : (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <Flag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucun signalement trouvé</p>
              <p className="text-gray-400 text-sm mt-1">
                {filters.status !== 'all' || filters.search || filters.motif 
                  ? 'Essayez de modifier vos filtres'
                  : 'La marketplace ne contient actuellement aucun signalement'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}