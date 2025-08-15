// Page de gestion des propriétés pour l'admin
'use client';

import { useEffect, useState } from 'react';
import { PropertiesTable } from '@/components/admin/properties-table';
import { PropertiesFilters } from '@/components/admin/properties-filters';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

// Interface pour une propriété avec ses statistiques
interface PropertyWithStats {
  id: string;
  titre: string;
  type: string;
  prix: number;
  adresse: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  agent: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
  };
  stats: {
    viewsCount: number;
    favoritesCount: number;
    visitRequestsCount: number;
    reportsCount: number;
    avgTimeSpent: number;
  };
}

interface PropertiesResponse {
  properties: PropertyWithStats[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export default function AdminPropertiesPage() {
  const [data, setData] = useState<PropertiesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États pour les filtres
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    filter: 'all', // 'all', 'active', 'inactive'
    search: ''
  });

  // Fonction pour charger les propriétés
  const fetchProperties = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        filter: filters.filter,
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`/api/admin/properties?${queryParams}`);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des propriétés');
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

  // Charger les données au montage et quand les filtres changent
  useEffect(() => {
    fetchProperties();
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

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Chargement des propriétés..." />
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
              onClick={fetchProperties}
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
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Propriétés</h1>
        <p className="text-gray-600 mt-2">
          Gérez toutes les propriétés de la marketplace avec leurs statistiques
        </p>
      </div>

      {/* Statistiques rapides */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">{data.pagination.totalCount}</p>
                <p className="text-sm text-gray-600">Total propriétés</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {data.properties.filter(p => p.isActive).length}
                </p>
                <p className="text-sm text-gray-600">Actives</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">
                  {data.properties.filter(p => !p.isActive).length}
                </p>
                <p className="text-sm text-gray-600">Inactives</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-600">
                  {data.properties.reduce((sum, p) => sum + p.stats.reportsCount, 0)}
                </p>
                <p className="text-sm text-gray-600">Signalements</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres */}
      <PropertiesFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        loading={loading}
      />

      {/* Tableau des propriétés */}
      {data ? (
        <PropertiesTable
          properties={data.properties}
          pagination={data.pagination}
          onPageChange={handlePageChange}
          onSortChange={handleSortChange}
          currentSort={{ sortBy: filters.sortBy, sortOrder: filters.sortOrder }}
          loading={loading}
        />
      ) : (
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-500 text-center">Aucune propriété trouvée</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}