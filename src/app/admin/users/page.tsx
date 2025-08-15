// Page de gestion des utilisateurs pour l'admin
'use client';

import { useEffect, useState } from 'react';
import { AdminBreadcrumb } from '@/components/admin/admin-breadcrumb';
import { UsersTable } from '@/components/admin/users-table';
import { UsersFilters } from '@/components/admin/users-filters';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Users, Shield, Building2, User } from 'lucide-react';
import { UserRole } from '@prisma/client';

// Interface pour un utilisateur avec ses statistiques
interface UserWithStats {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone: string | null;
  role: UserRole;
  isActive: boolean;
  emailVerified: Date | null;
  createdAt: Date;
  lastLoginAt: Date | null;
  stats: {
    propertiesCount: number;
    favoritesCount: number;
    reportsCount: number;
    visitRequestsCount: number;
  };
}

interface UsersResponse {
  users: UserWithStats[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export default function AdminUsersPage() {
  const [data, setData] = useState<UsersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // États pour les filtres
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    role: 'all' as UserRole | 'all',
    status: 'all' as 'active' | 'inactive' | 'all',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  // Fonction pour charger les utilisateurs
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: filters.page.toString(),
        limit: filters.limit.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        ...(filters.role !== 'all' && { role: filters.role }),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.search && { search: filters.search })
      });

      const response = await fetch(`/api/admin/users?${queryParams}`);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des utilisateurs');
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

  // Fonction pour mettre à jour un utilisateur
  const handleUserUpdate = async (userId: string, updates: { role?: UserRole; isActive?: boolean }) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour');
      }

      // Recharger les données
      await fetchUsers();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erreur lors de la mise à jour');
    }
  };

  // Charger les données au montage et quand les filtres changent
  useEffect(() => {
    fetchUsers();
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
    if (!data?.users) return { total: 0, admins: 0, agents: 0, acheteurs: 0, activeUsers: 0 };
    
    return {
      total: data.pagination.totalCount,
      admins: data.users.filter(u => u.role === UserRole.ADMIN).length,
      agents: data.users.filter(u => u.role === UserRole.AGENT).length,
      acheteurs: data.users.filter(u => u.role === UserRole.ACHETEUR).length,
      activeUsers: data.users.filter(u => u.isActive).length
    };
  };

  const stats = getStatsFromData();

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Chargement des utilisateurs..." />
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
              onClick={fetchUsers}
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
          { label: 'Utilisateurs', icon: <Users className="w-4 h-4" /> }
        ]} 
      />

      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
        <p className="text-gray-600 mt-2">
          Gérez tous les utilisateurs de la marketplace avec leurs rôles et statistiques
        </p>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-600">Total utilisateurs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{stats.admins}</p>
                <p className="text-sm text-gray-600">Administrateurs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{stats.agents}</p>
                <p className="text-sm text-gray-600">Agents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <User className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.acheteurs}</p>
                <p className="text-sm text-gray-600">Acheteurs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{stats.activeUsers}</p>
                <p className="text-sm text-gray-600">Actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <UsersFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        loading={loading}
      />

      {/* Tableau des utilisateurs */}
      {data ? (
        <UsersTable
          users={data.users}
          pagination={data.pagination}
          onPageChange={handlePageChange}
          onSortChange={handleSortChange}
          onUserUpdate={handleUserUpdate}
          currentSort={{ sortBy: filters.sortBy, sortOrder: filters.sortOrder }}
          loading={loading}
        />
      ) : (
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-500 text-center">Aucun utilisateur trouvé</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}