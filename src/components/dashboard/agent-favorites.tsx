// Composant pour afficher et gérer les favoris des agents
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Heart, 
  MapPin, 
  Eye, 
  User, 
  Home, 
  Briefcase, 
  Grid,
  ArrowLeftRight,
  Clock,
  Trash2,
  ExternalLink
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PropertyImage } from '@/components/ui/property-image';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useFavorite } from '@/hooks/use-favorite';

// Types pour les favoris
interface FavoriteProperty {
  id: string;
  titre: string;
  description: string;
  type: 'MAISON' | 'TERRAIN' | 'BUREAU' | 'HANGAR';
  prix: number;
  superficie: number;
  adresse: string;
  fraisVisite: number;
  troc: boolean;
  payer_apres: boolean;
  medias: Array<{
    url: string;
    type: 'PHOTO' | 'VIDEO';
    order: number;
  }>;
  agent: {
    id: string;
    nom: string;
    prenom: string;
  };
  createdAt: string;
  _count: {
    favorites: number;
    visitRequests: number;
  };
}

interface Favorite {
  id: string;
  createdAt: string;
  property: FavoriteProperty;
}

interface AgentFavoritesProps {
  userId: string;
}

// Types de propriétés avec icônes
const propertyTypes = {
  MAISON: { label: 'Maison', icon: Home },
  TERRAIN: { label: 'Terrain', icon: MapPin },
  BUREAU: { label: 'Bureau', icon: Briefcase },
  HANGAR: { label: 'Hangar', icon: Grid }
};

// Composant de carte de propriété favorite
function FavoriteCard({ favorite, onRemove }: { favorite: Favorite; onRemove: (id: string) => void }) {
  const { property } = favorite;
  const [isRemoving, setIsRemoving] = useState(false);

  // Utiliser le hook useFavorite pour la gestion de la suppression
  const { removeFromFavorites } = useFavorite({
    propertyId: property.id,
    initialIsFavorite: true,
    onToggle: (isFavorite) => {
      if (!isFavorite) {
        onRemove(property.id);
      }
    }
  });

  // Fonction pour formater le prix
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  // Supprimer des favoris
  const handleRemoveFavorite = async () => {
    setIsRemoving(true);
    try {
      await removeFromFavorites();
    } catch (error) {
      console.error('Erreur lors de la suppression du favori:', error);
    } finally {
      setIsRemoving(false);
    }
  };

  const TypeIcon = propertyTypes[property.type]?.icon || Home;
  const firstPhoto = property.medias?.find(m => m.type === 'PHOTO')?.url;

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Image */}
      <div className="relative h-48 overflow-hidden rounded-t-xl">
        <PropertyImage 
          src={firstPhoto} 
          alt={property.titre}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* Badge type */}
        <div className="absolute top-3 left-3 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
          <TypeIcon className="w-3 h-3" />
          {propertyTypes[property.type]?.label}
        </div>
        
        {/* Prix */}
        <div className="absolute top-3 right-3 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium">
          {formatPrice(property.prix)}
        </div>
        
        {/* Bouton supprimer favori */}
        <div className="absolute bottom-3 right-3">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleRemoveFavorite}
            disabled={isRemoving}
            className="bg-red-500/80 hover:bg-red-600 backdrop-blur-sm"
          >
            {isRemoving ? (
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Contenu */}
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-1">
          {property.titre}
        </h3>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {property.description}
        </p>

        {/* Informations de la propriété */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span className="line-clamp-1">{property.adresse}</span>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>{property.superficie} m²</span>
            <span>•</span>
            <span>Visite: {formatPrice(property.fraisVisite || 0)}</span>
          </div>
          
          {/* Statistiques */}
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{property._count.favorites} favoris</span>
            </div>
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              <span>{property._count.visitRequests} demandes</span>
            </div>
          </div>
          
          {/* Badges pour les options spéciales */}
          {(property.troc || property.payer_apres) && (
            <div className="flex flex-wrap gap-2 pt-2">
              {property.troc && (
                <div className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                  <ArrowLeftRight className="w-3 h-3" />
                  Troc accepté
                </div>
              )}
              {property.payer_apres && (
                <div className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  <Clock className="w-3 h-3" />
                  Paiement différé
                </div>
              )}
            </div>
          )}
        </div>

        {/* Agent et actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <User className="w-3 h-3" />
              <span>{property.agent.prenom} {property.agent.nom}</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              Ajouté le {formatDate(favorite.createdAt)}
            </div>
          </div>
          
          <Link href={`/properties/${property.id}`}>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
              <ExternalLink className="w-3 h-3" />
              Voir détails
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// Composant principal des favoris
export function AgentFavorites({ userId }: AgentFavoritesProps) {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fonction pour récupérer les favoris
  const fetchFavorites = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/properties/favorites');
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des favoris');
      }
      
      const data = await response.json();
      setFavorites(data.favorites || []);
    } catch (err: any) {
      console.error('Erreur API favoris:', err);
      setError(err.message || 'Erreur lors du chargement des favoris');
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les favoris au montage
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  // Fonction pour supprimer un favori de la liste
  const handleRemoveFavorite = useCallback((propertyId: string) => {
    setFavorites(prev => prev.filter(fav => fav.property.id !== propertyId));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" text="Chargement de vos favoris..." />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-red-400 mb-4">
            <Heart className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Erreur de chargement
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchFavorites} variant="outline">
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (favorites.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Heart className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Aucun favori
          </h3>
          <p className="text-gray-600 mb-6">
            Vous n'avez encore ajouté aucune propriété à vos favoris.
          </p>
          <Link href="/properties">
            <Button className="bg-blue-600 hover:bg-blue-700">
              Découvrir des propriétés
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500" />
            Mes favoris ({favorites.length})
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Grille des favoris */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {favorites.map(favorite => (
          <FavoriteCard
            key={favorite.id}
            favorite={favorite}
            onRemove={handleRemoveFavorite}
          />
        ))}
      </div>
    </div>
  );
}