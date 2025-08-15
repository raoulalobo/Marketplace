// Filtres pour la gestion des utilisateurs
'use client';

import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { UserRole } from '@prisma/client';

interface UsersFiltersProps {
  filters: {
    page: number;
    limit: number;
    role: UserRole | 'all';
    status: 'active' | 'inactive' | 'all';
    search: string;
    sortBy: string;
    sortOrder: string;
  };
  onFilterChange: (filters: Partial<UsersFiltersProps['filters']>) => void;
  loading: boolean;
}

export function UsersFilters({ filters, onFilterChange, loading }: UsersFiltersProps) {
  const [searchTerm, setSearchTerm] = useState(filters.search);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ search: searchTerm });
  };

  const handleSearchClear = () => {
    setSearchTerm('');
    onFilterChange({ search: '' });
  };

  const roleOptions = [
    { value: 'all', label: 'Tous les rôles' },
    { value: UserRole.ADMIN, label: 'Administrateurs' },
    { value: UserRole.AGENT, label: 'Agents' },
    { value: UserRole.ACHETEUR, label: 'Acheteurs' }
  ];

  const statusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'active', label: 'Actifs' },
    { value: 'inactive', label: 'Inactifs' }
  ];

  const limitOptions = [
    { value: 10, label: '10 par page' },
    { value: 25, label: '25 par page' },
    { value: 50, label: '50 par page' },
    { value: 100, label: '100 par page' }
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Ligne 1 : Recherche */}
          <form onSubmit={handleSearchSubmit} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher par nom, prénom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleSearchClear}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>

          {/* Ligne 2 : Filtres */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Filtre par rôle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rôle
              </label>
              <select
                value={filters.role}
                onChange={(e) => onFilterChange({ 
                  role: e.target.value as UserRole | 'all' 
                })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                {roleOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre par statut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                value={filters.status}
                onChange={(e) => onFilterChange({ 
                  status: e.target.value as 'active' | 'inactive' | 'all' 
                })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre par nombre d'éléments */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Affichage
              </label>
              <select
                value={filters.limit}
                onChange={(e) => onFilterChange({ 
                  limit: parseInt(e.target.value) 
                })}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                {limitOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Bouton de réinitialisation */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  onFilterChange({
                    role: 'all',
                    status: 'all',
                    search: '',
                    page: 1
                  });
                }}
                className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                disabled={loading}
              >
                <Filter className="w-4 h-4" />
                <span>Réinitialiser</span>
              </button>
            </div>
          </div>

          {/* Indicateurs de filtres actifs */}
          {(filters.search || filters.role !== 'all' || filters.status !== 'all') && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600">Filtres actifs:</span>
              
              {filters.search && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                  Recherche: "{filters.search}"
                  <button
                    onClick={() => onFilterChange({ search: '' })}
                    className="ml-1 hover:text-blue-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              
              {filters.role !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  Rôle: {roleOptions.find(r => r.value === filters.role)?.label}
                  <button
                    onClick={() => onFilterChange({ role: 'all' })}
                    className="ml-1 hover:text-green-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              
              {filters.status !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                  Statut: {statusOptions.find(s => s.value === filters.status)?.label}
                  <button
                    onClick={() => onFilterChange({ status: 'all' })}
                    className="ml-1 hover:text-purple-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}