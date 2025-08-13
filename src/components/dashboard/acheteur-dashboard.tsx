// Dashboard pour les acheteurs
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Search, MessageSquare, Bell, TrendingUp, MapPin, Home, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PropertyImage } from '@/components/ui/property-image';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AcheteurDashboardProps {
  user: User;
}

export function AcheteurDashboard({ user }: AcheteurDashboardProps) {
  const [stats, setStats] = useState({
    favoriteProperties: 0,
    visitRequests: 0,
    recentSearches: 0,
  });

  const [detailedData, setDetailedData] = useState({
    favoriteProperties: [],
    visitHistory: [],
    recommendations: [],
    loading: true
  });

  // Charger les statistiques depuis l'API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/acheteur-stats');
        if (response.ok) {
          const data = await response.json();
          setStats({
            favoriteProperties: data.totalFavorites,
            visitRequests: data.totalVisitRequests,
            recentSearches: data.savedSearches,
          });
          
          // Mettre à jour les données détaillées
          setDetailedData({
            favoriteProperties: data.favoriteProperties || [],
            visitHistory: data.visitHistory || [],
            recommendations: data.recommendations || [],
            loading: false
          });
        } else {
          console.error('Erreur lors du chargement des statistiques');
          setDetailedData(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error('Erreur API:', error);
        setDetailedData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Tableau de bord Acheteur
        </h1>
        <p className="text-gray-600">
          Bonjour {user.name}, découvrez vos propriétés favorites et gérez vos recherches.
        </p>
      </div>

      {/* Actions rapides */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
          <div className="flex flex-wrap gap-4">
            <Button asChild>
              <Link href="/properties">
                <Search className="w-4 h-4 mr-2" />
                Rechercher des biens
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/favorites">
                <Heart className="w-4 h-4 mr-2" />
                Mes favoris
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/visits">
                <MessageSquare className="w-4 h-4 mr-2" />
                Mes demandes de visite
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/searches">
                <Search className="w-4 h-4 mr-2" />
                Recherches récentes
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/profile">
                <User className="w-4 h-4 mr-2" />
                Mon profil
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Heart className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats.favoriteProperties}</p>
              <p className="text-gray-600">Favoris</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats.visitRequests}</p>
              <p className="text-gray-600">Demandes de visite</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Search className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats.recentSearches}</p>
              <p className="text-gray-600">Recherches récentes</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Search className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats.recentSearches}</p>
              <p className="text-gray-600">Recherches sauvegardées</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sections détaillées */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Propriétés favorites */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Mes favoris</h3>
            <Link href="/dashboard/favorites" className="text-blue-600 hover:text-blue-500 text-sm">
              Voir tout
            </Link>
          </div>
          
          {detailedData.loading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : detailedData.favoriteProperties.length > 0 ? (
            <div className="space-y-3">
              {detailedData.favoriteProperties.slice(0, 2).map((favorite: any) => (
                <div key={favorite.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{favorite.titre}</h4>
                    <p className="text-sm text-gray-600">{favorite.ville}</p>
                    <p className="text-sm font-medium text-blue-600">
                      {new Intl.NumberFormat('fr-FR').format(favorite.prix)} FCFA
                    </p>
                  </div>
                  <Heart className="w-5 h-5 text-red-500 fill-current" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Aucun favori pour le moment</h4>
              <p className="text-gray-600 mb-4">Découvrez nos propriétés et ajoutez vos coups de cœur !</p>
              <Button asChild>
                <Link href="/properties">Parcourir les propriétés</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Demandes de visite */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Mes demandes de visite</h3>
            <Link href="/dashboard/visits" className="text-blue-600 hover:text-blue-500 text-sm">
              Voir tout
            </Link>
          </div>
          
          {detailedData.loading ? (
            <div className="space-y-3">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex items-center space-x-3 p-3 border rounded-lg animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                  <div className="w-16 h-6 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : detailedData.visitHistory.length > 0 ? (
            <div className="space-y-3">
              {detailedData.visitHistory.slice(0, 2).map((visit: any) => (
                <div key={visit.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{visit.propertyTitle}</h4>
                    <p className="text-sm text-gray-600">
                      Demandé le {new Date(visit.requestedAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    visit.status === 'PENDING' ? 'bg-orange-100 text-orange-800' :
                    visit.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                    visit.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {visit.status === 'PENDING' ? 'En attente' :
                     visit.status === 'ACCEPTED' ? 'Accepté' :
                     visit.status === 'COMPLETED' ? 'Terminé' : 'Rejeté'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Aucune demande de visite</h4>
              <p className="text-gray-600 mb-4">Planifiez une visite pour voir vos propriétés préférées</p>
              <Button asChild>
                <Link href="/properties">Demander une visite</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Recommandations */}
      <div className="mt-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Nouvelles propriétés pour vous
            <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              Depuis votre dernière visite
            </span>
          </h3>
          
          {detailedData.loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border rounded-lg p-4 animate-pulse">
                  <div className="w-full h-32 bg-gray-200 rounded-lg mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          ) : detailedData.recommendations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {detailedData.recommendations.map((recommendation: any) => (
                <Link
                  key={recommendation.id}
                  href={`/properties/${recommendation.id}`}
                  className="bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300 block group"
                >
                  {/* Image de la propriété */}
                  <div className="relative h-48 w-full">
                    <PropertyImage
                      src={recommendation.imageUrl || ''}
                      alt={recommendation.titre}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    {/* Badge du type de propriété */}
                    <div className="absolute top-3 left-3">
                      <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                        {recommendation.type}
                      </span>
                    </div>
                    {/* Badge "Nouveau" */}
                    <div className="absolute top-3 right-3">
                      <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        Nouveau
                      </span>
                    </div>
                  </div>
                  
                  {/* Contenu */}
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {recommendation.titre}
                    </h4>
                    <div className="flex items-center text-gray-600 mb-3">
                      <MapPin className="w-4 h-4 mr-1 flex-shrink-0" />
                      <span className="text-sm truncate">{recommendation.ville}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-lg font-bold text-blue-600">
                        {new Intl.NumberFormat('fr-FR').format(recommendation.prix)} FCFA
                      </p>
                      <div className="text-xs text-green-600 font-medium">
                        {recommendation.matchScore}% compatible
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Aucune nouvelle propriété</h4>
              <p className="text-gray-600 mb-4">
                Pas de nouvelles propriétés depuis votre dernière visite. Explorez notre catalogue !
              </p>
              <Button asChild>
                <Link href="/properties">Explorer les propriétés</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}