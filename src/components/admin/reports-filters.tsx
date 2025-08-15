// Filtres pour la gestion des signalements
'use client';

import { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ReportStatus } from '@prisma/client';

interface ReportsFiltersProps {
  filters: {
    page: number;
    limit: number;
    status: ReportStatus | 'all';
    motif: string;
    search: string;
    sortBy: string;
    sortOrder: string;
  };
  onFilterChange: (filters: Partial<ReportsFiltersProps['filters']>) => void;
  loading: boolean;
}

export function ReportsFilters({ filters, onFilterChange, loading }: ReportsFiltersProps) {
  const [searchTerm, setSearchTerm] = useState(filters.search);
  const [motifTerm, setMotifTerm] = useState(filters.motif);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ search: searchTerm });
  };

  const handleMotifSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilterChange({ motif: motifTerm });
  };

  const handleSearchClear = () => {
    setSearchTerm('');
    onFilterChange({ search: '' });
  };

  const handleMotifClear = () => {
    setMotifTerm('');
    onFilterChange({ motif: '' });
  };

  const statusOptions = [
    { value: 'all', label: 'Tous les statuts' },
    { value: ReportStatus.PENDING, label: 'En attente' },
    { value: ReportStatus.RESOLVED, label: 'Résolus' },
    { value: ReportStatus.REJECTED, label: 'Rejetés' }
  ];

  const limitOptions = [
    { value: 10, label: '10 par page' },
    { value: 25, label: '25 par page' },
    { value: 50, label: '50 par page' },
    { value: 100, label: '100 par page' }
  ];

  // Motifs de signalement courants (basés sur des données réelles)
  const commonMotifs = [
    'Photos inappropriées',
    'Prix suspect',
    'Description mensongère',
    'Propriété inexistante',
    'Contenu offensant',
    'Spam',
    'Fausses informations',
    'Arnaque potentielle'
  ];

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Ligne 1 : Recherche générale */}
          <form onSubmit={handleSearchSubmit} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher dans les signalements, propriétés, utilisateurs..."
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

          {/* Ligne 2 : Filtres spécifiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Filtre par statut */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                value={filters.status}
                onChange={(e) => onFilterChange({ 
                  status: e.target.value as ReportStatus | 'all' 
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

            {/* Filtre par motif */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motif
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filtrer par motif..."
                  value={motifTerm}
                  onChange={(e) => setMotifTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleMotifSubmit(e)}
                  className="w-full p-2 pr-8 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                  list="motifs-list"
                />
                <datalist id="motifs-list">
                  {commonMotifs.map(motif => (
                    <option key={motif} value={motif} />
                  ))}
                </datalist>
                {motifTerm && (
                  <button
                    type="button"
                    onClick={handleMotifClear}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
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
                  setMotifTerm('');
                  onFilterChange({
                    status: 'all',
                    motif: '',
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
          {(filters.search || filters.status !== 'all' || filters.motif) && (
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
              
              {filters.status !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  Statut: {statusOptions.find(s => s.value === filters.status)?.label}
                  <button
                    onClick={() => onFilterChange({ status: 'all' })}
                    className="ml-1 hover:text-green-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              
              {filters.motif && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                  Motif: "{filters.motif}"
                  <button
                    onClick={() => onFilterChange({ motif: '' })}
                    className="ml-1 hover:text-purple-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Statistiques rapides des signalements */}
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-yellow-600 font-medium">
                  Signalements en attente
                </div>
                <div className="text-xs text-gray-500">
                  Nécessitent votre attention
                </div>
              </div>
              <div>
                <div className="text-sm text-green-600 font-medium">
                  Signalements résolus
                </div>
                <div className="text-xs text-gray-500">
                  Traités avec succès
                </div>
              </div>
              <div>
                <div className="text-sm text-red-600 font-medium">
                  Signalements rejetés
                </div>
                <div className="text-xs text-gray-500">
                  Jugés non fondés
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}