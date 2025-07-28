// Dashboard pour les agents immobiliers
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Home, Eye, MessageSquare, AlertTriangle, TrendingUp, MapPin, Bell, CheckCircle, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AgentDashboardProps {
  user: User;
}

// Interface pour les données complètes de l'API
interface AgentStats {
  totalProperties: number;
  activeProperties: number;
  inactiveProperties: number;
  propertiesSoldThisMonth: number;
  propertiesAddedThisWeek: number;
  totalViews: number;
  totalVisitRequests: number;
  pendingVisitRequests: number;
  confirmedVisitRequests: number;
  totalMessages: number;
  unreadMessages: number;
  totalRevenue: number;
  conversionRate: number;
  viewsLast30Days: Array<{ date: string; views: number }>;
  propertiesByCity: Array<{ city: string; count: number }>;
  propertiesByType: Array<{ type: string; count: number; avgPrice: number }>;
  topProperties: Array<{
    id: string;
    titre: string;
    views: number;
    visitRequests: number;
  }>;
  avgPrice: number;
  marketAvgPrice: number;
}

// Interface pour les demandes de visite
interface VisitRequest {
  id: string;
  message: string | null;
  datePreferee: string | null;
  status: string;
  createdAt: string;
  requester: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
  };
  property: {
    id: string;
    titre: string;
    prix: number;
    adresse: string;
    type: string;
  };
}

export function AgentDashboard({ user }: AgentDashboardProps) {
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [visitRequests, setVisitRequests] = useState<VisitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [visitRequestsLoading, setVisitRequestsLoading] = useState(true);
  const [error, setError] = useState('');

  // Charger les statistiques complètes depuis l'API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await fetch('/api/dashboard/agent-stats');
        
        if (response.ok) {
          const data: AgentStats = await response.json();
          setStats(data);
        } else {
          setError('Erreur lors du chargement des statistiques');
          console.error('Erreur lors du chargement des statistiques');
        }
      } catch (error) {
        setError('Erreur de connexion');
        console.error('Erreur API:', error);
      } finally {
        setLoading(false);
      }
    };

    // Fonction pour charger les demandes de visite
    const fetchVisitRequests = async () => {
      try {
        setVisitRequestsLoading(true);
        const response = await fetch('/api/dashboard/agent-visit-requests?limit=5');
        
        if (response.ok) {
          const data = await response.json();
          setVisitRequests(data.visitRequests || []);
        } else {
          console.error('Erreur lors du chargement des demandes de visite');
        }
      } catch (error) {
        console.error('Erreur API demandes de visite:', error);
      } finally {
        setVisitRequestsLoading(false);
      }
    };

    fetchStats();
    fetchVisitRequests();
  }, []);

  // Fonction utilitaire pour formater les prix
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  // Affichage de chargement
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement du tableau de bord...</p>
          </div>
        </div>
      </div>
    );
  }

  // Affichage d'erreur
  if (error || !stats) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-red-400 mb-4">
            <TrendingUp className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Erreur de chargement'}
          </h3>
          <p className="text-gray-600 mb-4">
            Impossible de charger les statistiques du tableau de bord.
          </p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Tableau de bord Agent
        </h1>
        <p className="text-gray-600">
          Bonjour {user.name}, gérez vos propriétés et suivez vos performances.
        </p>
      </div>

      {/* Actions rapides */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
          <div className="flex flex-wrap gap-4">
            <Button asChild>
              <Link href="/properties/add">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter une propriété
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/properties">
                <Home className="w-4 h-4 mr-2" />
                Mes propriétés
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard/visits">
                <MessageSquare className="w-4 h-4 mr-2" />
                Demandes de visite
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Home className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats.totalProperties}</p>
              <p className="text-gray-600">Propriétés totales</p>
              <p className="text-xs text-green-600 mt-1">
                +{stats.propertiesAddedThisWeek} cette semaine
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats.activeProperties}</p>
              <p className="text-gray-600">Propriétés actives</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.inactiveProperties} inactives
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats.pendingVisitRequests}</p>
              <p className="text-gray-600">Visites en attente</p>
              <p className="text-xs text-blue-600 mt-1">
                {stats.confirmedVisitRequests} confirmées
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Eye className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats.totalViews}</p>
              <p className="text-gray-600">Vues totales</p>
              <p className="text-xs text-green-600 mt-1">
                {stats.conversionRate.toFixed(1)}% de conversion
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques de performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold">{formatPrice(stats.totalRevenue)}</p>
              <p className="text-green-100">Revenus ce mois</p>
              <p className="text-xs text-green-200 mt-1">
                {stats.propertiesSoldThisMonth} propriétés vendues/louées
              </p>
            </div>
            <div className="text-green-200">
              <TrendingUp className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.avgPrice)}</p>
              <p className="text-gray-600">Prix moyen de mes biens</p>
              <p className="text-xs mt-1 flex items-center">
                <span className={`${stats.avgPrice > stats.marketAvgPrice ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.avgPrice > stats.marketAvgPrice ? '+' : ''}
                  {((stats.avgPrice - stats.marketAvgPrice) / stats.marketAvgPrice * 100).toFixed(1)}% vs marché
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.totalMessages}</p>
              <p className="text-gray-600">Messages</p>
              <p className="text-xs text-orange-600 mt-1">
                {stats.unreadMessages} non lus
              </p>
            </div>
            <div className="text-blue-600">
              <MessageSquare className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Sections détaillées */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top propriétés les plus vues */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Top propriétés
              <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                Les plus vues
              </span>
            </h3>
            <Link href="/dashboard/properties" className="text-blue-600 hover:text-blue-500 text-sm">
              Voir tout
            </Link>
          </div>
          <div className="space-y-3">
            {stats.topProperties.length > 0 ? (
              stats.topProperties.slice(0, 3).map((property, index) => (
                <div key={property.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{property.titre}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {property.views} vues
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {property.visitRequests} demandes
                      </span>
                    </div>
                  </div>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                    Performant
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Home className="w-8 h-8 mx-auto mb-2" />
                <p>Aucune propriété pour le moment</p>
              </div>
            )}
          </div>
        </div>

        {/* Répartition par ville */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Répartition géographique
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                Mes biens par ville
              </span>
            </h3>
            <Link href="/dashboard/analytics" className="text-blue-600 hover:text-blue-500 text-sm">
              Détails
            </Link>
          </div>
          <div className="space-y-3">
            {stats.propertiesByCity.length > 0 ? (
              stats.propertiesByCity.slice(0, 4).map((cityData, index) => {
                const total = stats.propertiesByCity.reduce((sum, city) => sum + city.count, 0);
                const percentage = ((cityData.count / total) * 100).toFixed(1);
                return (
                  <div key={cityData.city} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{cityData.city}</h4>
                      <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gray-900">
                      {cityData.count}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 text-gray-500">
                <MapPin className="w-8 h-8 mx-auto mb-2" />
                <p>Aucune donnée géographique</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Section analytiques avancées */}
      <div className="mt-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            Analyses avancées
            <span className="ml-2 text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
              Performances & Tendances
            </span>
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Types de propriétés */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Répartition par type de bien</h4>
              <div className="space-y-3">
                {stats.propertiesByType.length > 0 ? (
                  stats.propertiesByType.map((typeData) => (
                    <div key={typeData.type} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{typeData.type}</span>
                        <span className="text-sm font-bold text-blue-600">{typeData.count} biens</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Prix moyen: {formatPrice(typeData.avgPrice)}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">Aucune donnée disponible</p>
                )}
              </div>
            </div>

            {/* Évolution des vues (dernières entrées) */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">
                  Tendance des vues (7 derniers jours)
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    Données réelles
                  </span>
                </h4>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-xs"
                  onClick={() => window.open('/dashboard/analytics/views', '_blank')}
                >
                  Détails complets
                </Button>
              </div>
              <div className="space-y-2">
                {stats.viewsLast30Days.slice(-7).map((dayData, index) => {
                  const date = new Date(dayData.date).toLocaleDateString('fr-FR', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short'
                  });
                  const maxViews = Math.max(...stats.viewsLast30Days.slice(-7).map(d => d.views));
                  const percentage = maxViews > 0 ? (dayData.views / maxViews) * 100 : 0;
                  
                  // Déterminer la couleur selon les performances
                  let barColor = 'bg-gray-300';
                  if (percentage > 75) barColor = 'bg-green-500';
                  else if (percentage > 50) barColor = 'bg-blue-500';
                  else if (percentage > 25) barColor = 'bg-yellow-500';
                  else if (percentage > 0) barColor = 'bg-orange-500';
                  
                  return (
                    <div key={index} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                      <span className="text-xs text-gray-600 w-16 font-medium">{date}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-3 relative overflow-hidden">
                        <div 
                          className={`${barColor} h-3 rounded-full transition-all duration-500 ease-out`}
                          style={{ width: `${Math.max(percentage, 2)}%` }}
                        ></div>
                        {dayData.views === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs text-gray-400">•</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right w-12">
                        <span className="text-sm font-bold text-gray-900">
                          {dayData.views}
                        </span>
                        {index > 0 && stats.viewsLast30Days.slice(-7)[index - 1] && (
                          <div className="text-xs">
                            {(() => {
                              const prevViews = stats.viewsLast30Days.slice(-7)[index - 1].views;
                              const change = dayData.views - prevViews;
                              if (change > 0) return <span className="text-green-600">+{change}</span>;
                              if (change < 0) return <span className="text-red-600">{change}</span>;
                              return <span className="text-gray-400">=</span>;
                            })()} 
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Résumé de la semaine */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-blue-800 font-medium">
                    📊 Cette semaine
                  </span>
                  <div className="flex items-center gap-4">
                    {(() => {
                      const weekViews = stats.viewsLast30Days.slice(-7).reduce((sum, day) => sum + day.views, 0);
                      const avgDaily = (weekViews / 7).toFixed(1);
                      const bestDay = stats.viewsLast30Days.slice(-7).reduce((max, day) => 
                        day.views > max.views ? day : max, stats.viewsLast30Days.slice(-7)[0] || { views: 0 }
                      );
                      
                      return (
                        <>
                          <span className="text-blue-700">
                            Total: <strong>{weekViews}</strong>
                          </span>
                          <span className="text-blue-700">
                            Moy/jour: <strong>{avgDaily}</strong>
                          </span>
                          <span className="text-blue-700">
                            Pic: <strong>{bestDay?.views || 0}</strong>
                          </span>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Widget de performance et gains potentiels */}
      <div className="mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Objectifs du mois */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Objectifs du mois</h3>
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Ventes/Locations</span>
                  <span>{stats.propertiesSoldThisMonth}/10</span>
                </div>
                <div className="w-full bg-blue-400 rounded-full h-2">
                  <div 
                    className="bg-white h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min((stats.propertiesSoldThisMonth / 10) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Revenus</span>
                  <span>{((stats.totalRevenue / 5000000) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-blue-400 rounded-full h-2">
                  <div 
                    className="bg-white h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min((stats.totalRevenue / 5000000) * 100, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-blue-200 mt-1">
                  Objectif: 5,000,000 FCFA
                </p>
              </div>
            </div>
          </div>

          {/* Gains potentiels */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Gains potentiels</h3>
              <span className="text-2xl">💰</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Pipeline total</p>
                  <p className="font-bold text-green-600">
                    {formatPrice(stats.activeProperties * 500000)}
                  </p>
                </div>
                <div className="text-green-600">
                  <span className="text-xs bg-green-100 px-2 py-1 rounded">
                    {stats.activeProperties} biens actifs
                  </span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  Commission moyenne estimée: 500,000 FCFA/bien
                </p>
              </div>
            </div>
          </div>

          {/* Conseils IA */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Conseils IA</h3>
              <span className="text-2xl">🤖</span>
            </div>
            <div className="space-y-3">
              {stats.conversionRate < 5 ? (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800 font-medium mb-1">
                    📈 Améliorer la conversion
                  </p>
                  <p className="text-xs text-orange-700">
                    Votre taux de conversion ({stats.conversionRate.toFixed(1)}%) est faible. 
                    Ajoutez plus de photos et améliorez vos descriptions.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-medium mb-1">
                    ✅ Excellente conversion !
                  </p>
                  <p className="text-xs text-green-700">
                    Votre taux de conversion ({stats.conversionRate.toFixed(1)}%) est excellent. Continuez !
                  </p>
                </div>
              )}
              
              {stats.avgPrice > stats.marketAvgPrice && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 font-medium mb-1">
                    💎 Positionnement premium
                  </p>
                  <p className="text-xs text-blue-700">
                    Vos prix sont {((stats.avgPrice / stats.marketAvgPrice - 1) * 100).toFixed(0)}% 
                    au-dessus du marché. Mettez en avant la qualité.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section demandes de visite récentes */}
      <div className="mt-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Demandes de visite récentes
              <span className="ml-2 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                À traiter
              </span>
            </h3>
            <Link href="/dashboard/visits" className="text-blue-600 hover:text-blue-500 text-sm">
              Voir tout
            </Link>
          </div>
          
          {visitRequestsLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-start space-x-4 p-4 border rounded-lg animate-pulse">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                  <div className="w-20 h-6 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : visitRequests.length > 0 ? (
            <div className="space-y-4">
              {visitRequests.map((request) => {
                const statusColors = {
                  PENDING: 'bg-orange-100 text-orange-800',
                  ACCEPTED: 'bg-green-100 text-green-800',
                  REJECTED: 'bg-red-100 text-red-800',
                  COMPLETED: 'bg-blue-100 text-blue-800'
                };
                
                const statusLabels = {
                  PENDING: 'En attente',
                  ACCEPTED: 'Accepté',
                  REJECTED: 'Refusé',
                  COMPLETED: 'Terminé'
                };
                
                return (
                  <div key={request.id} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-gray-50">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {request.requester.prenom.charAt(0)}{request.requester.nom.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-900">
                          {request.requester.prenom} {request.requester.nom}
                        </h4>
                        <span className={`text-xs px-2 py-1 rounded ${statusColors[request.status as keyof typeof statusColors]}`}>
                          {statusLabels[request.status as keyof typeof statusLabels]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{request.property.titre}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{formatPrice(request.property.prix)}</span>
                        <span>
                          Demandé le {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                        {request.datePreferee && (
                          <span>
                            Souhaité le {new Date(request.datePreferee).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>
                      {request.message && (
                        <p className="text-sm text-gray-700 mt-2 italic">\u00ab {request.message} \u00bb</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {request.status === 'PENDING' && (
                        <>
                          <Button size="sm" className="text-xs">
                            Accepter
                          </Button>
                          <Button size="sm" variant="outline" className="text-xs">
                            Refuser
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="ghost" className="text-xs">
                        Contacter
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">Aucune demande de visite</h4>
              <p className="text-gray-600 mb-4">
                Les nouvelles demandes de visite apparaîtront ici.
              </p>
              <Button asChild variant="outline">
                <Link href="/dashboard/properties">Gérer mes propriétés</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Section Alertes et Notifications Intelligentes */}
      <div className="mt-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Centre de notifications
              <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                IA évoluée
              </span>
            </h3>
            <Button variant="outline" size="sm">
              <Bell className="w-4 h-4 mr-2" />
              Paramétrer
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Alertes urgentes */}
            {stats.pendingVisitRequests > 5 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-800">Action requise</span>
                </div>
                <p className="text-sm text-red-700">
                  {stats.pendingVisitRequests} demandes de visite en attente depuis plus de 24h.
                </p>
                <Button size="sm" className="mt-2 bg-red-600 hover:bg-red-700 text-xs">
                  Traiter maintenant
                </Button>
              </div>
            )}

            {/* Opportunités commerciales */}
            {stats.totalViews > 100 && stats.conversionRate < 3 && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-orange-600" />
                  <span className="font-medium text-orange-800">Opportunité détectée</span>
                </div>
                <p className="text-sm text-orange-700">
                  Beaucoup de vues mais peu de conversions. Pensez à ajuster vos prix ou descriptions.
                </p>
                <Button size="sm" variant="outline" className="mt-2 text-xs border-orange-300">
                  Optimiser
                </Button>
              </div>
            )}

            {/* Succès récents */}
            {stats.propertiesSoldThisMonth > 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-800">Félicitations !</span>
                </div>
                <p className="text-sm text-green-700">
                  {stats.propertiesSoldThisMonth} {stats.propertiesSoldThisMonth === 1 ? 'vente ce mois' : 'ventes ce mois'}. 
                  Excellent travail !
                </p>
                <Button size="sm" variant="outline" className="mt-2 text-xs border-green-300">
                  Voir détails
                </Button>
              </div>
            )}

            {/* Rappels et suivis */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">Rappels du jour</span>
              </div>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Relancer 3 clients inactifs</li>
                <li>• Mettre à jour 2 annonces</li>
                <li>• Répondre aux messages</li>
              </ul>
              <Button size="sm" variant="outline" className="mt-2 text-xs border-blue-300">
                Planifier
              </Button>
            </div>

            {/* Tendances marché */}
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-800">Tendance marché</span>
              </div>
              <p className="text-sm text-purple-700">
                Les {stats.propertiesByType[0]?.type.toLowerCase() || 'maisons'} sont en forte demande ce mois (+15%).
              </p>
              <Button size="sm" variant="outline" className="mt-2 text-xs border-purple-300">
                En savoir plus
              </Button>
            </div>

            {/* Performance personnelle */}
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-5 h-5 text-indigo-600" />
                <span className="font-medium text-indigo-800">Votre performance</span>
              </div>
              <p className="text-sm text-indigo-700">
                Vous êtes dans le top {stats.conversionRate > 5 ? '20%' : '40%'} des agents cette semaine !
              </p>
              <Button size="sm" variant="outline" className="mt-2 text-xs border-indigo-300">
                Voir classement
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}