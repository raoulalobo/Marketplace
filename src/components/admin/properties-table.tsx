// Tableau des propriétés avec statistiques pour l'admin
'use client';

import Link from 'next/link';
import { 
  Eye, 
  Heart, 
  Calendar, 
  Flag, 
  Clock,
  ChevronUp,
  ChevronDown,
  MoreHorizontal,
  Edit,
  Power,
  PowerOff
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

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

interface PropertiesTableProps {
  properties: PropertyWithStats[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  onPageChange: (page: number) => void;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  currentSort: {
    sortBy: string;
    sortOrder: string;
  };
  loading: boolean;
}

export function PropertiesTable({ 
  properties, 
  pagination, 
  onPageChange, 
  onSortChange, 
  currentSort,
  loading 
}: PropertiesTableProps) {
  const formatPrice = (price: number) => {
    return `${(price / 1000000).toFixed(1)}M FCFA`;
  };

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}min`;
    return `${Math.round(seconds / 3600)}h`;
  };

  const getSortIcon = (column: string) => {
    if (currentSort.sortBy !== column) return null;
    return currentSort.sortOrder === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  const handleSort = (column: string) => {
    const newOrder = currentSort.sortBy === column && currentSort.sortOrder === 'asc' ? 'desc' : 'asc';
    onSortChange(column, newOrder);
  };

  if (properties.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-gray-500">Aucune propriété trouvée avec ces filtres</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tableau */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left p-4">
                    <button
                      onClick={() => handleSort('titre')}
                      className="flex items-center space-x-1 font-medium text-gray-900 hover:text-blue-600"
                    >
                      <span>Propriété</span>
                      {getSortIcon('titre')}
                    </button>
                  </th>
                  <th className="text-left p-4">
                    <span className="font-medium text-gray-900">Agent</span>
                  </th>
                  <th className="text-left p-4">
                    <button
                      onClick={() => handleSort('prix')}
                      className="flex items-center space-x-1 font-medium text-gray-900 hover:text-blue-600"
                    >
                      <span>Prix</span>
                      {getSortIcon('prix')}
                    </button>
                  </th>
                  <th className="text-center p-4">
                    <span className="font-medium text-gray-900">Statistiques</span>
                  </th>
                  <th className="text-center p-4">
                    <span className="font-medium text-gray-900">Statut</span>
                  </th>
                  <th className="text-center p-4">
                    <span className="font-medium text-gray-900">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {properties.map((property) => (
                  <tr key={property.id} className="border-b border-gray-100 hover:bg-gray-50">
                    {/* Propriété */}
                    <td className="p-4">
                      <div>
                        <Link
                          href={`/admin/properties/${property.id}`}
                          className="font-medium text-gray-900 hover:text-blue-600"
                        >
                          {property.titre}
                        </Link>
                        <p className="text-sm text-gray-500 mt-1">
                          {property.type} • {property.adresse}
                        </p>
                      </div>
                    </td>

                    {/* Agent */}
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-gray-900">
                          {property.agent.prenom} {property.agent.nom}
                        </p>
                        <p className="text-sm text-gray-500">{property.agent.email}</p>
                      </div>
                    </td>

                    {/* Prix */}
                    <td className="p-4">
                      <span className="font-medium text-gray-900">
                        {formatPrice(property.prix)}
                      </span>
                    </td>

                    {/* Statistiques */}
                    <td className="p-4">
                      <div className="flex flex-wrap gap-3 justify-center">
                        <div className="flex items-center space-x-1 text-sm">
                          <Eye className="w-4 h-4 text-blue-500" />
                          <span>{property.stats.viewsCount}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm">
                          <Heart className="w-4 h-4 text-red-500" />
                          <span>{property.stats.favoritesCount}</span>
                        </div>
                        <div className="flex items-center space-x-1 text-sm">
                          <Calendar className="w-4 h-4 text-green-500" />
                          <span>{property.stats.visitRequestsCount}</span>
                        </div>
                        {property.stats.reportsCount > 0 && (
                          <div className="flex items-center space-x-1 text-sm">
                            <Flag className="w-4 h-4 text-yellow-500" />
                            <span>{property.stats.reportsCount}</span>
                          </div>
                        )}
                        {property.stats.avgTimeSpent > 0 && (
                          <div className="flex items-center space-x-1 text-sm">
                            <Clock className="w-4 h-4 text-purple-500" />
                            <span>{formatTime(property.stats.avgTimeSpent)}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Statut */}
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        property.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {property.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Link
                          href={`/admin/properties/${property.id}`}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/properties/${property.id}/edit`}
                          className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          className={`p-2 hover:bg-gray-50 rounded ${
                            property.isActive 
                              ? 'text-gray-400 hover:text-red-600' 
                              : 'text-gray-400 hover:text-green-600'
                          }`}
                          title={property.isActive ? 'Désactiver' : 'Activer'}
                        >
                          {property.isActive ? (
                            <PowerOff className="w-4 h-4" />
                          ) : (
                            <Power className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {pagination.page} sur {pagination.totalPages} 
                ({pagination.totalCount} propriétés au total)
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage || loading}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                
                {/* Pages */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const page = Math.max(1, pagination.page - 2) + i;
                    if (page > pagination.totalPages) return null;
                    
                    return (
                      <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`px-3 py-1 text-sm rounded ${
                          page === pagination.page
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                        disabled={loading}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={!pagination.hasNextPage || loading}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}