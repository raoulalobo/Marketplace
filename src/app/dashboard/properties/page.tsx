// Page de gestion des propriétés de l'agent
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PropertyImage } from '@/components/ui/property-image';
import { 
  Search, Filter, Plus, Eye, Edit, ToggleLeft, ToggleRight, 
  BarChart3, MapPin, Calendar, TrendingUp, Users, MessageSquare,
  Home, Briefcase, Grid, ArrowUpDown, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Interfaces pour les données
interface PropertyStats {
  averageTimeSpent: number;
  averageActiveTime: number;
  averageScrollDepth: number;
  totalSessions: number;
  bounceRate: number;
  viewsCount: number;
  favoritesCount: number;
  visitRequestsCount: number;
}

interface AgentProperty {
  id: string;
  titre: string;
  description: string;
  type: 'MAISON' | 'TERRAIN' | 'BUREAU' | 'HANGAR';
  prix: number;
  superficie: number;
  adresse: string;
  isActive: boolean;
  createdAt: string;
  viewsCount: number;
  medias: Array<{
    url: string;
    type: string;
  }>;
  stats: PropertyStats;
  _count: {
    favorites: number;
    visitRequests: number;
    timeSessions: number;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Types de propriétés avec icônes
const typeIcons = {
  MAISON: Home,
  TERRAIN: MapPin,
  BUREAU: Briefcase,
  HANGAR: Grid
};

const typeLabels = {
  MAISON: 'Maison',
  TERRAIN: 'Terrain', 
  BUREAU: 'Bureau',
  HANGAR: 'Hangar'
};

export default function AgentPropertiesPage() {
  const { data: session } = useSession();
  const router = useRouter();

  // États pour les données et filtres
  const [properties, setProperties] = useState<AgentProperty[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // États pour les filtres et recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fonction pour charger les propriétés
  const fetchProperties = async (page = 1) => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sortBy,
        sortOrder
      });

      if (searchTerm) params.append('search', searchTerm);
      if (selectedType !== 'all') params.append('type', selectedType);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);

      const response = await fetch(`/api/dashboard/agent-properties?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setProperties(data.properties);
        setPagination(data.pagination);
      } else {
        setError('Erreur lors du chargement des propriétés');
      }
    } catch (err) {
      console.error('Erreur API:', err);
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  // Charger les propriétés au montage et lors des changements de filtres
  useEffect(() => {
    if (session?.user?.role === 'AGENT') {
      fetchProperties(1);
    }
  }, [session, searchTerm, selectedType, selectedStatus, sortBy, sortOrder]);

  // Gestionnaire de changement de page
  const handlePageChange = (newPage: number) => {
    fetchProperties(newPage);
  };

  // Gestionnaire de tri
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  // Fonction utilitaire pour formater les prix
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  // Fonction pour formater le temps
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Vérifier les permissions
  if (session?.user?.role !== 'AGENT') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Accès refusé</h2>
          <p className="text-gray-600">Cette page est réservée aux agents immobiliers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes propriétés</h1>
          <p className="text-gray-600">
            Gérez vos annonces et consultez leurs performances
          </p>
        </div>
        <Button asChild>
          <Link href="/properties/add">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une propriété
          </Link>
        </Button>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Recherche */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par titre, adresse..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtre par type */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous les types</option>
            <option value="MAISON">Maison</option>
            <option value="TERRAIN">Terrain</option>
            <option value="BUREAU">Bureau</option>
            <option value="HANGAR">Hangar</option>
          </select>

          {/* Filtre par statut */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tous les statuts</option>
            <option value="active">Actives</option>
            <option value="inactive">Inactives</option>
          </select>

          {/* Tri */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order as 'asc' | 'desc');
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="createdAt-desc">Plus récentes</option>
            <option value="createdAt-asc">Plus anciennes</option>
            <option value="titre-asc">Titre A-Z</option>
            <option value="titre-desc">Titre Z-A</option>
            <option value="prix-desc">Prix décroissant</option>
            <option value="prix-asc">Prix croissant</option>
            <option value="viewsCount-desc">Plus vues</option>
          </select>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{pagination.total}</div>
            <div className="text-sm text-gray-600">Total propriétés</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {properties.filter(p => p.isActive).length}
            </div>
            <div className="text-sm text-gray-600">Actives</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {properties.reduce((sum, p) => sum + p.stats.viewsCount, 0)}
            </div>
            <div className="text-sm text-gray-600">Vues totales</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {properties.reduce((sum, p) => sum + p.stats.visitRequestsCount, 0)}
            </div>
            <div className="text-sm text-gray-600">Demandes de visite</div>
          </div>
        </div>
      </div>

      {/* Tableau des propriétés */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des propriétés...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => fetchProperties(pagination.page)} variant="outline">
            Réessayer
          </Button>
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-12">
          <Home className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune propriété trouvée</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedType !== 'all' || selectedStatus !== 'all'
              ? 'Aucune propriété ne correspond aux critères de recherche.'
              : 'Vous n\'avez pas encore ajouté de propriété.'}
          </p>
          <Button asChild>
            <Link href="/properties/add">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter votre première propriété
            </Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Tableau responsive */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Propriété
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('prix')}
                    >
                      <div className="flex items-center gap-1">
                        Prix
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('viewsCount')}
                    >
                      <div className="flex items-center gap-1">
                        Performance
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Engagement
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {properties.map((property) => {
                    const TypeIcon = typeIcons[property.type];
                    const firstImage = property.medias.find(m => m.type === 'PHOTO');
                    
                    return (
                      <tr key={property.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-16 w-16">
                              {firstImage ? (
                                <PropertyImage
                                  src={firstImage.url}
                                  alt={property.titre}
                                  width={64}
                                  height={64}
                                  className="h-16 w-16 rounded-lg object-cover"
                                  fallbackUrl=""
                                />
                              ) : (
                                <div className="h-16 w-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                  <TypeIcon className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                                {property.titre}
                              </div>
                              <div className="text-sm text-gray-500 flex items-center gap-2">
                                <Badge variant="secondary">{typeLabels[property.type]}</Badge>
                                <span>{property.superficie} m²</span>
                              </div>
                              <div className="text-xs text-gray-400 max-w-xs truncate">
                                {property.adresse}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {formatPrice(property.prix)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatPrice(Math.round(property.prix / property.superficie))}/m²
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {property.isActive ? (
                              <Badge className="bg-green-100 text-green-800">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                Inactive
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Eye className="w-4 h-4 text-blue-600" />
                              <span>{property.stats.viewsCount} vues</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MessageSquare className="w-4 h-4 text-green-600" />
                              <span>{property.stats.visitRequestsCount} demandes</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-purple-600" />
                              <span>{property.stats.totalSessions} sessions</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="space-y-1">
                            <div>
                              <span className="text-xs text-gray-500">Temps moyen:</span>
                              <div className="font-medium">
                                {formatTime(property.stats.averageTimeSpent)}
                              </div>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Taux rebond:</span>
                              <div className={`font-medium ${
                                property.stats.bounceRate > 70 ? 'text-red-600' :
                                property.stats.bounceRate > 40 ? 'text-orange-600' : 'text-green-600'
                              }`}>
                                {property.stats.bounceRate}%
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              <Link href={`/dashboard/properties/${property.id}`}>
                                <BarChart3 className="w-4 h-4" />
                              </Link>
                            </Button>
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                            >
                              <Link href={`/properties/${property.id}`}>
                                <Eye className="w-4 h-4" />
                              </Link>
                            </Button>
                            <Button
                              asChild
                              size="sm"
                              variant="outline"
                            >
                              <Link href={`/properties/${property.id}/edit`}>
                                <Edit className="w-4 h-4" />
                              </Link>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Affichage de {((pagination.page - 1) * pagination.limit) + 1} à{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} sur{' '}
                {pagination.total} propriétés
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Précédent
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNumber;
                    if (pagination.totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNumber = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNumber = pagination.totalPages - 4 + i;
                    } else {
                      pageNumber = pagination.page - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNumber}
                        variant={pageNumber === pagination.page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNumber)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                >
                  Suivant
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}