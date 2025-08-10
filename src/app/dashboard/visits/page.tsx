// Page des demandes de visite refactorisée - Design moderne en cartes
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { PropertyImage } from '@/components/ui/property-image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, Calendar, Clock, CheckCircle, XCircle, 
  AlertCircle, Eye, Phone, MapPin, Home, Building, 
  Grid, Search, User
} from 'lucide-react';

// Interface pour les demandes de visite (selon le vrai schéma Prisma)
interface VisitRequestWithDetails {
  id: string;
  message: string | null;
  datePreferee: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'REJECTED';
  responseMessage: string | null;
  scheduledDate: string | null;
  createdAt: string;
  updatedAt: string;
  property: {
    id: string;
    titre: string;
    type: string;
    prix: number;
    superficie: number;
    adresse: string;
    fraisVisite: number;
    medias: Array<{
      url: string;
      type: string;
      order: number;
    }>;
    agent: {
      id: string;
      nom: string;
      prenom: string;
      email: string;
    };
  };
  acheteur: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
  };
}

// Configuration des statuts avec couleurs et icônes
const statusConfig = {
  PENDING: {
    label: 'En attente',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: Clock,
    description: 'Demande en cours de traitement'
  },
  ACCEPTED: {
    label: 'Acceptée',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    description: 'Visite acceptée et programmée'
  },
  COMPLETED: {
    label: 'Terminée',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CheckCircle,
    description: 'Visite réalisée'
  },
  REJECTED: {
    label: 'Refusée',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
    description: 'Demande refusée par l\'agent'
  }
};

// Types de propriétés avec icônes
const typeIcons = {
  MAISON: Home,
  TERRAIN: MapPin,
  BUREAU: Building,
  HANGAR: Grid
};

const typeLabels = {
  MAISON: 'Maison',
  TERRAIN: 'Terrain',
  BUREAU: 'Bureau',
  HANGAR: 'Hangar'
};

export default function VisitsPage() {
  const { data: session, status } = useSession();
  const [visits, setVisits] = useState<VisitRequestWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState<string>('');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    completed: 0,
    rejected: 0
  });

  // États de filtrage
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('TOUS');
  const [filterType, setFilterType] = useState<string>('TOUS');
  const [filterDate, setFilterDate] = useState<string>('TOUS');

  // Charger les demandes de visite
  useEffect(() => {
    const fetchVisitRequests = async () => {
      if (!session) return;
      
      try {
        setLoading(true);
        setError('');
        
        const response = await fetch('/api/dashboard/visit-requests');
        
        if (response.ok) {
          const data = await response.json();
          setVisits(data.visitRequests || []);
          setStats(data.stats || stats);
          setUserRole(data.userRole || '');
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Erreur lors du chargement des demandes');
        }
      } catch (err) {
        console.error('Erreur API:', err);
        setError('Erreur de connexion');
      } finally {
        setLoading(false);
      }
    };

    if (session && status !== 'loading') {
      fetchVisitRequests();
    }
  }, [session, status]);

  // Filtrer les demandes
  const filteredVisits = visits.filter(visit => {
    // Filtre par recherche (titre de propriété)
    if (searchTerm && !visit.property.titre.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    // Filtre par statut
    if (filterStatus !== 'TOUS' && visit.status !== filterStatus) {
      return false;
    }
    
    // Filtre par type de propriété
    if (filterType !== 'TOUS' && visit.property.type !== filterType) {
      return false;
    }
    
    // Filtre par date
    if (filterDate !== 'TOUS') {
      const visitDate = new Date(visit.createdAt);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - visitDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (filterDate === 'SEMAINE' && daysDiff > 7) return false;
      if (filterDate === 'MOIS' && daysDiff > 30) return false;
    }
    
    return true;
  });

  // Fonctions utilitaires
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Gestion des erreurs d'authentification
  if (status === 'loading' || loading) {
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

  if (!session) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Accès refusé
        </h3>
        <p className="text-gray-600">
          Vous devez être connecté pour voir vos demandes de visite.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Erreur de chargement
        </h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* En-tête avec statistiques */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-6">
          <MessageSquare className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {userRole === 'AGENT' ? 'Demandes reçues' : 'Mes demandes de visite'}
            </h1>
            <p className="text-gray-600">
              {userRole === 'AGENT' 
                ? 'Gérez les demandes de visite sur vos propriétés'
                : 'Suivez l\'état de vos demandes de visite'
              }
            </p>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">En attente</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
            <div className="text-sm text-gray-600">Acceptées</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">Terminées</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-gray-600">Refusées</div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Barre de recherche */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par propriété..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filtre par statut */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="TOUS">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="ACCEPTED">Acceptées</option>
            <option value="COMPLETED">Terminées</option>
            <option value="REJECTED">Refusées</option>
          </select>

          {/* Filtre par type */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="TOUS">Tous les types</option>
            <option value="MAISON">Maison</option>
            <option value="TERRAIN">Terrain</option>
            <option value="BUREAU">Bureau</option>
            <option value="HANGAR">Hangar</option>
          </select>

          {/* Filtre par date */}
          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="TOUS">Toutes les dates</option>
            <option value="SEMAINE">Cette semaine</option>
            <option value="MOIS">Ce mois</option>
          </select>
        </div>
        
        <div className="mt-4 text-sm text-gray-600">
          {filteredVisits.length} résultat{filteredVisits.length > 1 ? 's' : ''} trouvé{filteredVisits.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Grille de cartes des demandes */}
      {filteredVisits.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            {visits.length === 0 
              ? 'Aucune demande de visite' 
              : 'Aucun résultat pour ces filtres'
            }
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {visits.length === 0 
              ? `${userRole === 'AGENT' 
                  ? 'Aucune demande n\'a encore été faite sur vos propriétés.' 
                  : 'Vous n\'avez pas encore fait de demande de visite.'
                }` 
              : 'Essayez de modifier les filtres pour voir plus de résultats.'
            }
          </p>
          {visits.length === 0 && userRole !== 'AGENT' && (
            <Button size="lg" asChild>
              <Link href="/properties">
                <Calendar className="w-5 h-5 mr-2" />
                Parcourir les propriétés
              </Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVisits.map((visit) => {
            const config = statusConfig[visit.status];
            const StatusIcon = config.icon;
            const TypeIcon = typeIcons[visit.property.type as keyof typeof typeIcons];
            const firstImage = visit.property.medias.find(m => m.type === 'PHOTO');
            
            return (
              <div key={visit.id} className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
                {/* Image de la propriété */}
                <div className="relative">
                  {firstImage ? (
                    <PropertyImage
                      src={firstImage.url}
                      alt={visit.property.titre}
                      width={400}
                      height={200}
                      className="w-full h-48 object-cover"
                      propertyType={visit.property.type}
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                      <TypeIcon className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Badge de statut */}
                  <div className="absolute top-3 right-3">
                    <Badge className={config.color}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {config.label}
                    </Badge>
                  </div>
                  
                  {/* Badge de type */}
                  <div className="absolute top-3 left-3">
                    <Badge variant="secondary" className="bg-white/90 text-gray-700">
                      <TypeIcon className="w-3 h-3 mr-1" />
                      {typeLabels[visit.property.type as keyof typeof typeLabels]}
                    </Badge>
                  </div>
                </div>

                {/* Contenu de la carte */}
                <div className="p-4">
                  {/* Titre et prix */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                    {visit.property.titre}
                  </h3>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xl font-bold text-green-600">
                      {formatPrice(visit.property.prix)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {visit.property.superficie} m²
                    </div>
                  </div>
                  
                  {/* Adresse */}
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                    <span className="truncate">{visit.property.adresse}</span>
                  </div>
                  
                  {/* Informations sur la demande */}
                  <div className="space-y-2 mb-4">
                    {userRole === 'AGENT' && (
                      <div className="flex items-center text-sm text-gray-600">
                        <User className="w-4 h-4 mr-2" />
                        <span>{visit.acheteur.prenom} {visit.acheteur.nom}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Demandée le {formatDate(visit.createdAt)}</span>
                    </div>
                    
                    {visit.scheduledDate && (
                      <div className="flex items-center text-sm text-green-600">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>Programmée le {formatDateTime(visit.scheduledDate)}</span>
                      </div>
                    )}
                    
                    {visit.datePreferee && (
                      <div className="flex items-center text-sm text-blue-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>Souhaitée le {formatDateTime(visit.datePreferee)}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Message de la demande */}
                  {visit.message && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700 italic">
                        "{visit.message}"
                      </p>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button asChild size="sm" className="flex-1">
                      <Link href={`/properties/${visit.property.id}`}>
                        <Eye className="w-4 h-4 mr-1" />
                        Voir
                      </Link>
                    </Button>
                    
                    {userRole === 'AGENT' && visit.status === 'PENDING' && (
                      <Button size="sm" variant="outline" className="flex-1">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Répondre
                      </Button>
                    )}
                    
                    {visit.status === 'ACCEPTED' && (
                      <Button size="sm" variant="outline" className="flex-1">
                        <Phone className="w-4 h-4 mr-1" />
                        Contact
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}