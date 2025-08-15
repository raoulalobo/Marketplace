// Composant de filtres pour les propriétés admin
'use client';

import { useState } from 'react';
import { Search, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface PropertiesFiltersProps {
  filters: {
    filter: string;
    search: string;
    sortBy: string;
    sortOrder: string;
  };
  onFilterChange: (filters: any) => void;
  loading: boolean;
}

export function PropertiesFilters({ filters, onFilterChange, loading }: PropertiesFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ search: searchInput });
  };

  const handleFilterChange = (key: string, value: string) => {
    onFilterChange({ [key]: value });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Barre de recherche */}
          <form onSubmit={handleSearchSubmit} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Rechercher par titre, adresse ou agent..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>
          </form>

          {/* Filtre par statut */}
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filters.filter}
              onChange={(e) => handleFilterChange('filter', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="all">Toutes les propriétés</option>
              <option value="active">Propriétés actives</option>
              <option value="inactive">Propriétés inactives</option>
            </select>
          </div>

          {/* Tri */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Trier par:</span>
            <select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split('-');
                onFilterChange({ sortBy, sortOrder });
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            >
              <option value="createdAt-desc">Plus récentes</option>
              <option value="createdAt-asc">Plus anciennes</option>
              <option value="titre-asc">Titre A-Z</option>
              <option value="titre-desc">Titre Z-A</option>
              <option value="prix-desc">Prix décroissant</option>
              <option value="prix-asc">Prix croissant</option>
            </select>
          </div>
        </div>

        {/* Filtres rapides */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => onFilterChange({ filter: 'all', search: '' })}
            className={`px-3 py-1 rounded-full text-sm ${
              filters.filter === 'all' && !filters.search
                ? 'bg-blue-100 text-blue-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            disabled={loading}
          >
            Toutes
          </button>
          <button
            onClick={() => onFilterChange({ filter: 'active' })}
            className={`px-3 py-1 rounded-full text-sm ${
              filters.filter === 'active'
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            disabled={loading}
          >
            Actives
          </button>
          <button
            onClick={() => onFilterChange({ filter: 'inactive' })}
            className={`px-3 py-1 rounded-full text-sm ${
              filters.filter === 'inactive'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            disabled={loading}
          >
            Inactives
          </button>
        </div>
      </CardContent>
    </Card>
  );
}