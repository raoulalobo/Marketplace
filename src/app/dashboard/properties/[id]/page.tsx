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

// Interface pour les analytics PostHog (compatible avec l'API existante)
interface PropertyAnalytics {
  totalViews: number;
  totalSessions: number;
  averageTime: number;
  bounceRate: number;
  conversionRate: number;
  dailyTrends: Array<{
    date: string;
    sessions: number;
    averageTime: number;
  }>;
  topPages: Array<{
    page: string;
    views: number;
  }>;
  userTypes: {
    authenticated: number;
    anonymous: number;
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
  const [analytics, setAnalytics] = useState<PropertyAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const propertyId = params.id as string;

  // Charger les données de la propriété et ses analytics
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        // Récupérer les données de la propriété et ses analytics PostHog
        const [propertyResponse, analyticsResponse] = await Promise.all([
          fetch(`/api/properties/${propertyId}`),
          fetch(`/api/properties/${propertyId}/posthog-analytics`)
        ]);

        if (propertyResponse.ok) {
          const propertyData = await propertyResponse.json();
          setProperty(propertyData.property);
        } else {
          throw new Error('Propriété non trouvée');
        }

        if (analyticsResponse.ok) {
          const analyticsData = await analyticsResponse.json();
          // Les données PostHog sont dans analyticsData.data
          setAnalytics(analyticsData.success ? analyticsData.data : null);
        } else {
          console.warn('Erreur lors du chargement des analytics PostHog');
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

  // Les analytics sont maintenant spécifiques à cette propriété

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
                <div className="text-lg font-bold text-gray-900">{analytics?.totalViews || 0}</div>
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
                    {analytics.totalSessions}
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
                    {formatTime(analytics.averageTime)}
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
                    {analytics.conversionRate.toFixed(1)}%
                  </p>
                  <p className="text-gray-600">Taux conversion</p>
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
                    {analytics.bounceRate.toFixed(1)}%
                  </p>
                  <p className="text-gray-600">Taux de rebond</p>
                </div>
              </div>
            </div>
          </div>

          {/* Métriques supplémentaires PostHog */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Types d'utilisateurs */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Types d'utilisateurs</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-600" />
                    <span className="text-sm font-medium text-gray-900">Utilisateurs connectés</span>
                  </div>
                  <div className="text-sm font-bold text-blue-600">{analytics.userTypes.authenticated}</div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">Visiteurs anonymes</span>
                  </div>
                  <div className="text-sm font-bold text-gray-600">{analytics.userTypes.anonymous}</div>
                </div>
              </div>
            </div>

            {/* Résumé PostHog */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Analytics PostHog</h3>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Données fiables</h4>
                  <p className="text-sm text-green-700">
                    Analytics collectés avec PostHog, garantissant la cohérence temporelle et la précision des métriques.
                  </p>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Vues totales</h4>
                  <p className="text-sm text-blue-700">
                    {analytics.totalViews} vues sur {analytics.totalSessions} sessions
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tendances temporelles */}
          <div className="bg-white rounded-lg shadow p-6">
            {(() => {
              // Calculer l'âge de la propriété pour adapter l'affichage
              const propertyCreated = new Date(property.createdAt);
              const now = new Date();
              const daysSinceCreation = Math.ceil((now.getTime() - propertyCreated.getTime()) / (1000 * 60 * 60 * 24));
              
              // Filtrer les données PostHog pour ne montrer que les jours depuis la création
              const relevantDays = analytics.dailyTrends.filter(day => {
                const dayDate = new Date(day.date);
                return dayDate >= propertyCreated;
              }).slice(-Math.min(daysSinceCreation, 7));
              
              const displayPeriod = daysSinceCreation === 1 ? "aujourd'hui" : 
                                  daysSinceCreation <= 7 ? `${daysSinceCreation} derniers jours` :
                                  "7 derniers jours";
              
              return (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Tendances {displayPeriod}
                    </h3>
                    {daysSinceCreation === 1 && (
                      <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        Propriété créée aujourd'hui
                      </div>
                    )}
                  </div>
                  
                  {relevantDays.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>Aucune donnée de tendance disponible encore.</p>
                      <p className="text-sm">Les visiteurs doivent d'abord consulter votre propriété.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {relevantDays.map((day, index) => {
                const date = new Date(day.date).toLocaleDateString('fr-FR', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short'
                });
                const maxSessions = Math.max(...relevantDays.map(d => d.sessions));
                const percentage = maxSessions > 0 ? (day.sessions / maxSessions) * 100 : 0;
                
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
                      <div className="text-sm font-bold text-gray-900">{day.sessions} sessions</div>
                      <div className="text-xs text-gray-500">{formatTime(day.averageTime)} moy.</div>
                    </div>
                  </div>
                );
                      })}
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Conseils d'optimisation */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-6 mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              Conseils d'optimisation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analytics.bounceRate > 60 && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h4 className="font-medium text-orange-800 mb-2">Taux de rebond élevé</h4>
                  <p className="text-sm text-orange-700">
                    Votre taux de rebond est élevé. Vérifiez que vos photos sont attrayantes et que le prix est compétitif.
                  </p>
                </div>
              )}
              
              {analytics.conversionRate < 5 && analytics.totalSessions > 5 && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Faible taux de conversion</h4>
                  <p className="text-sm text-blue-700">
                    Peu de visiteurs effectuent des actions. Améliorez votre description et ajoutez un appel à l'action.
                  </p>
                </div>
              )}
              
              {analytics.averageTime > 120 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Excellent engagement</h4>
                  <p className="text-sm text-green-700">
                    Les visiteurs passent beaucoup de temps sur votre annonce. C'est un très bon signe !
                  </p>
                </div>
              )}

              {analytics.totalSessions > 10 && analytics.totalViews > 0 && (analytics.totalSessions / analytics.totalViews) > 2 && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="font-medium text-purple-800 mb-2">Bon engagement</h4>
                  <p className="text-sm text-purple-700">
                    Votre annonce génère plusieurs sessions par vue. Les visiteurs reviennent consulter votre propriété !
                  </p>
                </div>
              )}
              
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Analytics PostHog</h4>
                <p className="text-sm text-green-700">
                  Données collectées avec PostHog pour une précision maximale et des insights avancés.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}