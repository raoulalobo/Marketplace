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
  Home, Briefcase, Grid, ArrowUpDown, ChevronLeft, ChevronRight,
  Clock, Activity, Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// Métriques supprimées pour optimiser l'interface
import dynamic from 'next/dynamic';

// Composant d'aide supprimé pour simplifier l'interface

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
  const { data: session, status } = useSession();
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

  // Attendre que la session soit chargée avant de vérifier les permissions
  if (status === 'loading') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden animate-pulse">
            <div className="h-48 bg-gray-200"></div>
            <div className="p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-16 mb-4"></div>
              <div className="flex gap-2">
                <div className="h-8 bg-gray-200 rounded flex-1"></div>
                <div className="h-8 bg-gray-200 rounded flex-1"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

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
    <div>
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
          {/* Section simplifiée - aide supprimée pour optimiser l'interface */}

          {/* Vue en cartes des propriétés - Layout Grid Optimisé */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {properties.map((property) => {
              const TypeIcon = typeIcons[property.type];
              const firstImage = property.medias.find(m => m.type === 'PHOTO');
              
              return (
                <div key={property.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1 h-fit">
                  {/* Image principale */}
                  <div className="relative">
                    {firstImage ? (
                      <PropertyImage
                        src={firstImage.url}
                        alt={property.titre}
                        width={400}
                        height={200}
                        className="w-full h-48 object-cover"
                        propertyType={property.type}
                      />
                    ) : (
                      <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <TypeIcon className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <Badge className={property.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}>
                        {property.isActive ? '✓ Active' : '⏸ Inactive'}
                      </Badge>
                    </div>
                    <div className="absolute top-3 left-3">
                      <Badge variant="secondary" className="bg-white/90 text-gray-700">
                        <TypeIcon className="w-3 h-3 mr-1" />
                        {typeLabels[property.type]}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Contenu compact */}
                  <div className="p-4">
                    {/* Titre et info principales */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {property.titre}
                    </h3>
                    
                    <div className="flex items-center text-sm text-gray-500 mb-2">
                      <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                      <span className="truncate">{property.adresse}</span>
                    </div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-gray-600">{property.superficie} m²</span>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          {formatPrice(property.prix)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatPrice(Math.round(property.prix / property.superficie))}/m²
                        </div>
                      </div>
                    </div>
                    
                    {/* Statistiques compactes */}
                    <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-blue-600">{property.stats.viewsCount}</div>
                        <div className="text-xs text-gray-500">Vues</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-green-600">{property.stats.visitRequestsCount}</div>
                        <div className="text-xs text-gray-500">Visites</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-purple-600">{property._count.favorites}</div>
                        <div className="text-xs text-gray-500">Favoris</div>
                      </div>
                    </div>
                    
                    {/* Actions compactes */}
                    <div className="flex gap-2">
                      <Button asChild size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                        <Link href={`/properties/${property.id}`}>
                          <Eye className="w-4 h-4 mr-1" />
                          Voir
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="flex-1">
                        <Link href={`/properties/${property.id}/edit`}>
                          <Edit className="w-4 h-4 mr-1" />
                          Modifier
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-8">
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