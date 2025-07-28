// Page de métriques détaillées pour une propriété spécifique
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { PropertyImage } from '@/components/ui/property-image';
import { 
  ArrowLeft, BarChart3, Clock, Users, Eye, TrendingUp, 
  MousePointer, Heart, Calendar, MapPin, Home, 
  Briefcase, Grid, Share2, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Interfaces pour les données d'analytics
interface TimeAnalytics {
  overview: {
    totalSessions: number;
    averageTimeSpent: number;
    averageActiveTime: number;
    averageScrollDepth: number;
    bounceRate: number;
    engagementRate: number;
  };
  propertiesPerformance: Array<{
    propertyId: string;
    propertyTitle: string;
    totalSessions: number;
    averageTimeSpent: number;
    averageActiveTime: number;
    averageScrollDepth: number;
    bounceRate: number;
    conversionRate: number;
  }>;
  timeDistribution: Array<{
    timeRange: string;
    count: number;
    percentage: number;
  }>;
  engagementEvents: Array<{
    eventType: string;
    count: number;
    properties: Array<{
      propertyId: string;
      propertyTitle: string;
      count: number;
    }>;
  }>;
  trends: {
    dailyAverages: Array<{
      date: string;
      averageTimeSpent: number;
      sessionsCount: number;
    }>;
  };
}

interface Property {
  id: string;
  titre: string;
  description: string;
  type: 'MAISON' | 'TERRAIN' | 'BUREAU' | 'HANGAR';
  prix: number;
  superficie: number;
  adresse: string;
  fraisVisite: number;
  isActive: boolean;
  createdAt: string;
  viewsCount: number;
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

export default function PropertyMetricsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();

  const [property, setProperty] = useState<Property | null>(null);
  const [analytics, setAnalytics] = useState<TimeAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const propertyId = params.id as string;

  // Charger les données de la propriété et ses analytics
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Récupérer les données de la propriété
        const [propertyResponse, analyticsResponse] = await Promise.all([
          fetch(`/api/properties/${propertyId}`),
          fetch('/api/dashboard/agent-time-analytics')
        ]);

        if (propertyResponse.ok) {
          const propertyData = await propertyResponse.json();
          setProperty(propertyData.property);
        } else {
          throw new Error('Propriété non trouvée');
        }

        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json();
          setAnalytics(analyticsData);
        } else {
          console.warn('Erreur lors du chargement des analytics');
        }

      } catch (err) {
        console.error('Erreur lors du chargement:', err);
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.role === 'AGENT' && propertyId) {
      fetchData();
    }
  }, [session, propertyId]);

  // Fonction utilitaire pour formater les prix
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  // Fonction pour formater le temps
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  // Fonction pour formater les dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des métriques...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Propriété non trouvée'}
          </h3>
          <p className="text-gray-600 mb-4">
            Impossible de charger les données de cette propriété.
          </p>
          <Button onClick={() => router.push('/dashboard/properties')} variant="outline">
            Retour à mes propriétés
          </Button>
        </div>
      </div>
    );
  }

  const TypeIcon = typeIcons[property.type];
  const photos = property.medias
    .filter(media => media.type === 'PHOTO')
    .sort((a, b) => a.order - b.order);

  // Trouver les métriques spécifiques à cette propriété
  const propertyMetrics = analytics?.propertiesPerformance.find(
    p => p.propertyId === propertyId
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header avec navigation */}
      <div className="flex items-center gap-4 mb-8">
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard/properties')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>
        <div className="flex items-center gap-2">
          <TypeIcon className="w-5 h-5 text-blue-600" />
          <Badge variant="secondary">{typeLabels[property.type]}</Badge>
        </div>
      </div>

      {/* Informations de la propriété */}
      <div className="bg-white rounded-lg shadow-lg mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          {/* Image principale */}
          <div className="lg:col-span-1">
            <div className="relative h-64 rounded-lg overflow-hidden">
              {photos.length > 0 ? (
                <PropertyImage
                  src={photos[0].url}
                  alt={property.titre}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 400px"
                  fallbackUrl=""
                />
              ) : (
                <div className="h-full bg-gray-200 flex items-center justify-center">
                  <TypeIcon className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Informations générales */}
          <div className="lg:col-span-2">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{property.titre}</h1>
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <MapPin className="w-4 h-4" />
                  <span>{property.adresse}</span>
                </div>
                <div className="text-sm text-gray-500">
                  Publié le {formatDate(property.createdAt)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {formatPrice(property.prix)}
                </div>
                <div className="text-sm text-gray-500">
                  {formatPrice(Math.round(property.prix / property.superficie))}/m²
                </div>
              </div>
            </div>

            {/* Caractéristiques rapides */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{property.superficie}</div>
                <div className="text-sm text-gray-600">m²</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{property.viewsCount || 0}</div>
                <div className="text-sm text-gray-600">Vues</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-gray-900">{formatPrice(property.fraisVisite)}</div>
                <div className="text-sm text-gray-600">Frais visite</div>
              </div>
              <div className="text-center">
                <Badge className={property.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {property.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="flex gap-3 mt-4">
              <Button asChild size="sm">
                <Link href={`/properties/${property.id}`}>
                  <Eye className="w-4 h-4 mr-2" />
                  Voir l'annonce
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={`/properties/${property.id}/edit`}>
                  Modifier
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Métriques de performance */}
      {analytics && (
        <>
          {/* Vue d'ensemble des métriques */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {propertyMetrics?.totalSessions || analytics.overview.totalSessions}
                  </p>
                  <p className="text-gray-600">Sessions totales</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatTime(propertyMetrics?.averageTimeSpent || analytics.overview.averageTimeSpent)}
                  </p>
                  <p className="text-gray-600">Temps moyen</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MousePointer className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {propertyMetrics?.averageScrollDepth.toFixed(1) || analytics.overview.averageScrollDepth.toFixed(1)}%
                  </p>
                  <p className="text-gray-600">Scroll moyen</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {propertyMetrics?.bounceRate.toFixed(1) || analytics.overview.bounceRate.toFixed(1)}%
                  </p>
                  <p className="text-gray-600">Taux de rebond</p>
                </div>
              </div>
            </div>
          </div>

          {/* Distribution du temps et événements */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Distribution du temps passé */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Distribution du temps</h3>
              <div className="space-y-4">
                {analytics.timeDistribution.map((range, index) => (
                  <div key={index} className="flex items-center">
                    <div className="w-20 text-sm text-gray-600">{range.timeRange}</div>
                    <div className="flex-1 mx-4">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${range.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-16 text-right">
                      <div className="text-sm font-medium text-gray-900">{range.count}</div>
                      <div className="text-xs text-gray-500">{range.percentage}%</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Événements d'engagement */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Événements d'engagement</h3>
              <div className="space-y-4">
                {analytics.engagementEvents.slice(0, 6).map((event, index) => {
                  let eventLabel = event.eventType;
                  let EventIcon = MousePointer;
                  
                  switch (event.eventType) {
                    case 'visit_request_clicked':
                      eventLabel = 'Demandes de visite';
                      EventIcon = Calendar;
                      break;
                    case 'favorite_clicked':
                      eventLabel = 'Ajouts aux favoris';
                      EventIcon = Heart;
                      break;
                    case 'share_clicked':
                      eventLabel = 'Partages';
                      EventIcon = Share2;
                      break;
                    case 'image_changed':
                      eventLabel = 'Navigation photos';
                      EventIcon = Eye;
                      break;
                  }

                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <EventIcon className="w-5 h-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900">{eventLabel}</span>
                      </div>
                      <div className="text-sm font-bold text-blue-600">{event.count}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tendances temporelles */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Tendances des 7 derniers jours</h3>
            <div className="space-y-2">
              {analytics.trends.dailyAverages.slice(-7).map((day, index) => {
                const date = new Date(day.date).toLocaleDateString('fr-FR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short'
                });
                const maxSessions = Math.max(...analytics.trends.dailyAverages.slice(-7).map(d => d.sessionsCount));
                const percentage = maxSessions > 0 ? (day.sessionsCount / maxSessions) * 100 : 0;
                
                return (
                  <div key={index} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg">
                    <div className="w-16 text-sm font-medium text-gray-700">{date}</div>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-4 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(percentage, 2)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <div className="text-sm font-bold text-gray-900">{day.sessionsCount} sessions</div>
                      <div className="text-xs text-gray-500">{formatTime(day.averageTimeSpent)} moy.</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Conseils d'optimisation */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6 mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Conseils d'optimisation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(propertyMetrics?.bounceRate || analytics.overview.bounceRate) > 60 && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h4 className="font-medium text-orange-800 mb-2">Taux de rebond élevé</h4>
                  <p className="text-sm text-orange-700">
                    Votre taux de rebond est élevé. Vérifiez que vos photos sont attrayantes et que le prix est compétitif.
                  </p>
                </div>
              )}
              
              {(propertyMetrics?.averageScrollDepth || analytics.overview.averageScrollDepth) < 30 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Faible engagement</h4>
                  <p className="text-sm text-blue-700">
                    Les visiteurs ne scrollent pas beaucoup. Améliorez votre description et ajoutez plus de détails.
                  </p>
                </div>
              )}
              
              {(propertyMetrics?.averageTimeSpent || analytics.overview.averageTimeSpent) > 120 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Excellent engagement</h4>
                  <p className="text-sm text-green-700">
                    Les visiteurs passent beaucoup de temps sur votre annonce. C'est un très bon signe !
                  </p>
                </div>
              )}

              {(propertyMetrics?.conversionRate || 0) > 5 && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="font-medium text-purple-800 mb-2">Bon taux de conversion</h4>
                  <p className="text-sm text-purple-700">
                    Votre annonce génère de bonnes conversions en demandes de visite. Continuez ainsi !
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}