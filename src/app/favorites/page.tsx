// Page des propriétés favorites de l'utilisateur
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Heart, ArrowLeft, Filter, MapPin, Home, Briefcase, Grid, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PropertyImage } from '@/components/ui/property-image';

// Interface pour les favoris
interface FavoriteProperty {
  id: string;
  titre: string;
  prix: number;
  type: 'MAISON' | 'TERRAIN' | 'BUREAU' | 'HANGAR';
  ville: string;
  addedAt: string;
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

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('TOUS');
  const [filterCity, setFilterCity] = useState<string>('TOUS');

  // Rediriger si non connecté
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/login?callbackUrl=/favorites');
      return;
    }
  }, [session, status, router]);

  // Charger les favoris
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!session) return;
      
      try {
        const response = await fetch('/api/dashboard/acheteur-stats');
        if (response.ok) {
          const data = await response.json();
          setFavorites(data.favoriteProperties || []);
        } else {
          console.error('Erreur lors du chargement des favoris');
        }
      } catch (error) {
        console.error('Erreur API:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [session]);

  // Filtrer les favoris
  const filteredFavorites = favorites.filter(favorite => {
    const typeMatch = filterType === 'TOUS' || favorite.type === filterType;
    const cityMatch = filterCity === 'TOUS' || favorite.ville.toLowerCase().includes(filterCity.toLowerCase());
    return typeMatch && cityMatch;
  });

  // Obtenir la liste des villes uniques
  const uniqueCities = [...new Set(favorites.map(fav => fav.ville))];

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

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
        </div>

        {/* Filters skeleton */}
        <div className="mb-8 flex gap-4">
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>

        {/* Grid skeleton */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
              <div className="h-48 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Redirection en cours
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour au dashboard
              </Link>
            </Button>
          </div>
          
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-8 h-8 text-red-500" />
            <h1 className="text-3xl font-bold text-gray-900">Mes favoris</h1>
          </div>
          <p className="text-gray-600">
            {favorites.length} propriété{favorites.length > 1 ? 's' : ''} sauvegardée{favorites.length > 1 ? 's' : ''}
          </p>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Aucun favori pour le moment
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Parcourez nos propriétés et cliquez sur le cœur pour sauvegarder vos coups de cœur.
            </p>
            <Button size="lg" asChild>
              <Link href="/properties">
                <Eye className="w-5 h-5 mr-2" />
                Découvrir les propriétés
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Filtres */}
            <div className="mb-8 bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-4 mb-4">
                <Filter className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">Filtrer mes favoris</h3>
              </div>
              
              <div className="flex flex-wrap gap-4">
                <div className="min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type de propriété
                  </label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TOUS">Tous les types</SelectItem>
                      <SelectItem value="MAISON">Maison</SelectItem>
                      <SelectItem value="TERRAIN">Terrain</SelectItem>
                      <SelectItem value="BUREAU">Bureau</SelectItem>
                      <SelectItem value="HANGAR">Hangar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville
                  </label>
                  <Select value={filterCity} onValueChange={setFilterCity}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TOUS">Toutes les villes</SelectItem>
                      {uniqueCities.map(city => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Résultats */}
            <div className="mb-4">
              <p className="text-gray-600">
                {filteredFavorites.length} résultat{filteredFavorites.length > 1 ? 's' : ''}
                {(filterType !== 'TOUS' || filterCity !== 'TOUS') && ' (filtré)'}
              </p>
            </div>

            {/* Grille des favoris */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFavorites.map((favorite) => {
                const TypeIcon = typeIcons[favorite.type];
                
                return (
                  <div 
                    key={favorite.id} 
                    className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300 overflow-hidden group"
                  >
                    {/* Image */}
                    <div className="relative h-48">
                      <PropertyImage
                        src=""
                        alt={favorite.titre}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      
                      {/* Badges */}
                      <div className="absolute top-3 left-3">
                        <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <TypeIcon className="w-3 h-3" />
                          {typeLabels[favorite.type]}
                        </span>
                      </div>

                      {/* Bouton favori */}
                      <div className="absolute top-3 right-3">
                        <button className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors">
                          <Heart className="w-4 h-4 text-red-500 fill-current" />
                        </button>
                      </div>

                      {/* Prix */}
                      <div className="absolute bottom-3 left-3">
                        <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2">
                          <span className="text-sm font-bold text-blue-600">
                            {formatPrice(favorite.prix)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contenu */}
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                        {favorite.titre}
                      </h3>
                      
                      <div className="flex items-center text-gray-600 mb-3">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="text-sm">{favorite.ville}</span>
                      </div>

                      <div className="text-xs text-gray-500 mb-4">
                        Ajouté le {formatDate(favorite.addedAt)}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          asChild
                        >
                          <Link href={`/properties/${favorite.id}`}>
                            Voir détails
                          </Link>
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          Contacter
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredFavorites.length === 0 && (filterType !== 'TOUS' || filterCity !== 'TOUS') && (
              <div className="text-center py-12">
                <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Aucun résultat pour ces filtres
                </h3>
                <p className="text-gray-600 mb-4">
                  Essayez de modifier vos critères de recherche.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFilterType('TOUS');
                    setFilterCity('TOUS');
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}