// Page d'analytics avancées pour l'admin
'use client';

import { useEffect, useState } from 'react';
import { AdminBreadcrumb } from '@/components/admin/admin-breadcrumb';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  TrendingUp, 
  Users, 
  Eye, 
  Heart, 
  Calendar,
  MapPin,
  Award,
  Activity,
  Clock,
  AlertCircle,
  BarChart3
} from 'lucide-react';

// Interface pour les analytics avancées
interface AdvancedAnalytics {
  userRegistrations: {
    daily: Array<{ date: string; count: number; byRole: { agents: number; acheteurs: number } }>;
    weekly: Array<{ week: string; count: number; byRole: { agents: number; acheteurs: number } }>;
    monthly: Array<{ month: string; count: number; byRole: { agents: number; acheteurs: number } }>;
  };
  
  propertyActivity: {
    daily: Array<{ date: string; added: number; views: number; favorites: number; visits: number }>;
    weekly: Array<{ week: string; added: number; views: number; favorites: number; visits: number }>;
    topProperties: Array<{ 
      id: string; 
      titre: string; 
      views: number; 
      favorites: number; 
      visits: number;
      agent: { nom: string; prenom: string };
    }>;
  };
  
  agentPerformance: {
    topAgents: Array<{
      id: string;
      nom: string;
      prenom: string;
      propertiesCount: number;
      totalViews: number;
      totalFavorites: number;
      avgResponseTime: number;
      conversionRate: number;
    }>;
    agentActivity: Array<{ date: string; newProperties: number; responses: number }>;
  };
  
  geographicDistribution: {
    propertiesByCity: Array<{ city: string; count: number; avgPrice: number; views: number }>;
    usersByRegion: Array<{ region: string; agents: number; acheteurs: number }>;
  };
  
  conversionMetrics: {
    visitToContact: number;
    viewToFavorite: number;
    favoriteToVisit: number;
    reportRate: number;
  };
  
  systemHealth: {
    avgResponseTime: number;
    errorRate: number;
    activeUsers24h: number;
    peakHours: Array<{ hour: number; activity: number }>;
  };
}

// Composant pour graphique en barres simple
function SimpleBarChart({ 
  data, 
  title, 
  valueKey, 
  labelKey,
  color = 'blue'
}: { 
  data: any[]; 
  title: string; 
  valueKey: string; 
  labelKey: string;
  color?: string;
}) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-500 text-center py-8">Aucune donnée disponible</div>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...data.map(item => item[valueKey] || 0));
  const colorClass = `bg-${color}-500`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.slice(0, 8).map((item, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-24 text-sm text-gray-600 truncate">
                {item[labelKey]}
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-3 relative">
                <div
                  className={`${colorClass} h-3 rounded-full transition-all duration-500`}
                  style={{
                    width: `${maxValue > 0 ? (item[valueKey] / maxValue) * 100 : 0}%`
                  }}
                />
              </div>
              <div className="w-16 text-sm font-medium text-gray-900 text-right">
                {item[valueKey]?.toLocaleString() || 0}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Composant pour graphique linéaire simple
function SimpleLineChart({ 
  data, 
  title, 
  valueKey, 
  labelKey 
}: { 
  data: any[]; 
  title: string; 
  valueKey: string; 
  labelKey: string;
}) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-500 text-center py-8">Aucune donnée disponible</div>
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...data.map(item => item[valueKey] || 0));
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((item[valueKey] || 0) / (maxValue || 1)) * 80;
    return `${x},${y}`;
  }).join(' ');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 relative">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
            
            <polyline
              fill="none"
              stroke="#3b82f6"
              strokeWidth="2"
              points={points}
            />
            
            {data.map((item, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = 100 - ((item[valueKey] || 0) / (maxValue || 1)) * 80;
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="1.5"
                  fill="#3b82f6"
                />
              );
            })}
          </svg>
          
          <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 mt-2">
            <span>{data[0]?.[labelKey]}</span>
            <span>{data[Math.floor(data.length / 2)]?.[labelKey]}</span>
            <span>{data[data.length - 1]?.[labelKey]}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AdvancedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fonction pour charger les analytics
  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/analytics');
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des analytics');
      }
      
      const result = await response.json();
      setAnalytics(result);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Chargement des analytics..." />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-red-800 font-medium">Erreur de chargement</h3>
            <p className="text-red-600 mt-1">{error}</p>
            <button
              onClick={fetchAnalytics}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucune donnée d'analytics disponible</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Fil d'ariane */}
      <AdminBreadcrumb 
        items={[
          { label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> }
        ]} 
      />

      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics Avancées</h1>
        <p className="text-gray-600 mt-2">
          Analyse détaillée des performances et tendances de la marketplace
        </p>
      </div>

      {/* Métriques de conversion */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Eye className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {analytics.conversionMetrics.viewToFavorite}%
                </p>
                <p className="text-sm text-gray-600">Vue → Favori</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {analytics.conversionMetrics.favoriteToVisit}%
                </p>
                <p className="text-sm text-gray-600">Favori → Visite</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {analytics.conversionMetrics.visitToContact}%
                </p>
                <p className="text-sm text-gray-600">Vue → Contact</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">
                  {analytics.conversionMetrics.reportRate}%
                </p>
                <p className="text-sm text-gray-600">Taux signalement</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Santé du système */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {analytics.systemHealth.avgResponseTime}ms
                </p>
                <p className="text-sm text-gray-600">Temps de réponse</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {(analytics.systemHealth.errorRate * 100).toFixed(1)}%
                </p>
                <p className="text-sm text-gray-600">Taux d'erreur</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {analytics.systemHealth.activeUsers24h}
                </p>
                <p className="text-sm text-gray-600">Actifs 24h</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.max(...analytics.systemHealth.peakHours.map(h => h.activity))}
                </p>
                <p className="text-sm text-gray-600">Pic d'activité</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques d'activité */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Enregistrements d'utilisateurs */}
        <SimpleLineChart
          data={analytics.userRegistrations.daily}
          title="Enregistrements d'utilisateurs (7 derniers jours)"
          valueKey="count"
          labelKey="date"
        />

        {/* Activité des propriétés */}
        <SimpleLineChart
          data={analytics.propertyActivity.daily}
          title="Vues de propriétés (7 derniers jours)"
          valueKey="views"
          labelKey="date"
        />
      </div>

      {/* Performances et distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top agents */}
        <SimpleBarChart
          data={analytics.agentPerformance.topAgents}
          title="Top Agents par Vues"
          valueKey="totalViews"
          labelKey="prenom"
          color="green"
        />

        {/* Propriétés par ville */}
        <SimpleBarChart
          data={analytics.geographicDistribution.propertiesByCity}
          title="Propriétés par Ville"
          valueKey="count"
          labelKey="city"
          color="purple"
        />
      </div>

      {/* Top propriétés */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            <Award className="w-5 h-5 text-yellow-500" />
            <span>Top Propriétés les plus vues</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.propertyActivity.topProperties.length > 0 ? (
            <div className="space-y-4">
              {analytics.propertyActivity.topProperties.slice(0, 10).map((property, index) => (
                <div key={property.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      index === 2 ? 'bg-orange-500 text-white' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{property.titre}</h4>
                      <p className="text-sm text-gray-500">
                        Agent: {property.agent.prenom} {property.agent.nom}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="text-center">
                      <div className="flex items-center space-x-1 text-blue-600">
                        <Eye className="w-4 h-4" />
                        <span className="font-medium">{property.views}</span>
                      </div>
                      <div className="text-gray-500">Vues</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center space-x-1 text-red-600">
                        <Heart className="w-4 h-4" />
                        <span className="font-medium">{property.favorites}</span>
                      </div>
                      <div className="text-gray-500">Favoris</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center space-x-1 text-green-600">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">{property.visits}</span>
                      </div>
                      <div className="text-gray-500">Visites</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">
              Aucune donnée de propriété disponible
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}