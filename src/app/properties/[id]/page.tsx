// Page de détail d'une propriété spécifique
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { PropertyImage } from '@/components/ui/property-image';
import { 
  ArrowLeft, MapPin, Home, Briefcase, Grid, Calendar, 
  Heart, Flag, User, Phone, Mail, Share2, Camera,
  Ruler, DollarSign, Eye
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Nouveaux imports pour les modals et hooks
import { VisitRequestModal } from '@/components/modals/visit-request-modal';
import { ReportModal } from '@/components/modals/report-modal';
import { ShareModal } from '@/components/modals/share-modal';
import { AuthRequiredModal } from '@/components/modals/auth-required-modal';
import { ToastContainer, useToast } from '@/components/ui/toast';
import { useFavorite } from '@/hooks/use-favorite';
import { usePostHogPropertyTracking } from '@/hooks/use-posthog-property-tracking';

// Interface pour les propriétés
interface Property {
  id: string;
  titre: string;
  description: string;
  type: 'MAISON' | 'TERRAIN' | 'BUREAU' | 'HANGAR';
  prix: number;
  superficie: number;
  adresse: string;
  fraisVisite: number;
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
}

// Fonction pour récupérer une propriété depuis l'API
const fetchProperty = async (id: string): Promise<Property | null> => {
  try {
    const response = await fetch(`/api/properties/${id}`);
    
    if (!response.ok) {
      console.error('Erreur lors du chargement de la propriété');
      return null;
    }
    
    const data = await response.json();
    return data.property;
  } catch (error) {
    console.error('Erreur API:', error);
    return null;
  }
};

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

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [property, setProperty] = useState<Property | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authAction, setAuthAction] = useState<'visit' | 'favorite' | 'report'>('visit');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Hook pour les toasts
  const { toasts, toast, removeToast } = useToast();

  // Hook pour gérer les favoris
  const {
    isFavorite,
    isLoading: favoriteLoading,
    toggleFavorite
  } = useFavorite({
    propertyId: params.id as string,
    onToggle: (isFav) => {
      toast.success(
        isFav ? 'Ajouté aux favoris' : 'Retiré des favoris',
        isFav ? 'Cette propriété a été ajoutée à vos favoris' : 'Cette propriété a été retirée de vos favoris'
      );
    },
    onError: (error) => {
      toast.error('Erreur', error);
    }
  });

  // Hook PostHog pour tracker le temps passé sur la propriété
  const timeTracking = usePostHogPropertyTracking({
    propertyId: params.id as string,
    enabled: true, // Toujours activé pour tous les utilisateurs
    heartbeatInterval: 15, // Heartbeat toutes les 15 secondes
    onError: (error) => {
      console.error('Erreur de tracking PostHog:', error);
      // Pas de toast d'erreur pour ne pas déranger l'utilisateur
    }
  });

  // Charger les données de la propriété depuis l'API
  useEffect(() => {
    const loadProperty = async () => {
      try {
        setLoading(true);
        setError('');
        
        const propertyData = await fetchProperty(params.id as string);
        
        if (propertyData) {
          setProperty(propertyData);
        } else {
          setError('Propriété non trouvée');
        }
      } catch (err) {
        console.error('Erreur lors du chargement:', err);
        setError('Erreur lors du chargement de la propriété');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadProperty();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de la propriété...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 mb-4">
            <Home className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Propriété non trouvée'}
          </h3>
          <p className="text-gray-600 mb-4">
            Cette propriété n'existe pas ou a été supprimée.
          </p>
          <Button onClick={() => router.push('/properties')} variant="outline">
            Retour aux propriétés
          </Button>
        </div>
      </div>
    );
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Extraire les photos des médias
  const photos = property.medias
    .filter(media => media.type === 'PHOTO')
    .sort((a, b) => a.order - b.order)
    .map(media => media.url);

  // Extraire la ville de l'adresse
  const adresseParts = property.adresse.split(',');
  const ville = adresseParts[adresseParts.length - 1]?.trim() || 'Cameroun';

  const TypeIcon = typeIcons[property.type];

  // Gestionnaires d'événements pour les actions
  const handleVisitRequest = () => {
    // Tracker l'interaction avec intention d'achat élevée
    timeTracking.trackEvent('visit_request_clicked');
    timeTracking.trackPurchaseIntent('high', 'visit_request_button');
    timeTracking.trackElementInteraction('visit_button', 'click', { 
      button_text: 'Demander une visite',
      price_displayed: property?.prix 
    });
    
    if (!session) {
      setAuthAction('visit');
      setShowAuthModal(true);
      return;
    }
    setShowVisitModal(true);
  };

  const handleReport = () => {
    // Tracker l'interaction
    timeTracking.trackEvent('report_clicked');
    
    if (!session) {
      setAuthAction('report');
      setShowAuthModal(true);
      return;
    }
    setShowReportModal(true);
  };

  const handleShare = () => {
    // Tracker l'interaction
    timeTracking.trackEvent('share_clicked');
    setShowShareModal(true);
  };

  const handleFavorite = async () => {
    // Tracker l'interaction avec intention d'achat modérée
    const action = isFavorite ? 'remove' : 'add';
    timeTracking.trackEvent('favorite_clicked', { currentState: action });
    timeTracking.trackPurchaseIntent('medium', 'favorite_button');
    timeTracking.trackElementInteraction('favorite_button', action, { 
      property_type: property?.type,
      property_price: property?.prix 
    });
    
    if (!session) {
      setAuthAction('favorite');
      setShowAuthModal(true);
      return;
    }
    await toggleFavorite();
  };

  // Callbacks pour les modals
  const handleVisitSuccess = (visitRequest: any) => {
    // Tracker la conversion réussie
    timeTracking.trackEvent('visit_request_success', { 
      visitRequestId: visitRequest.id 
    });
    
    toast.success(
      'Demande envoyée !',
      `Votre demande de visite pour "${property?.titre}" a été envoyée à l'agent.`
    );
  };

  const handleReportSuccess = (report: any) => {
    // Tracker le signalement réussi
    timeTracking.trackEvent('report_success', { 
      reportId: report.id 
    });
    
    toast.success(
      'Signalement envoyé',
      'Votre signalement a été transmis à notre équipe de modération.'
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header avec bouton retour */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => router.back()}
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
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Galerie photos */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="relative h-96">
                {photos.length > 0 ? (
                  <PropertyImage
                    src={photos[currentImageIndex]}
                    alt={property.titre}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 800px"
                    fallbackUrl=""
                  />
                ) : (
                  <div className="h-full bg-gray-200 flex items-center justify-center">
                    <Camera className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                {photos.length > 0 && (
                  <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    {currentImageIndex + 1} / {photos.length}
                  </div>
                )}
              </div>
              
              {/* Miniatures */}
              {photos.length > 1 && (
                <div className="p-4 flex gap-2 overflow-x-auto">
                  {photos.map((photo, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setCurrentImageIndex(index);
                        timeTracking.trackEvent('image_changed', { 
                          fromIndex: currentImageIndex, 
                          toIndex: index 
                        });
                        timeTracking.trackElementInteraction('image_thumbnail', 'click', {
                          image_index: index,
                          total_images: photos.length,
                          engagement_level: 'visual_exploration'
                        });
                        // Engagement modéré si l'utilisateur explore plusieurs photos
                        if (index !== currentImageIndex) {
                          timeTracking.trackPurchaseIntent('low', 'image_exploration');
                        }
                      }}
                      className={`relative h-16 w-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                        index === currentImageIndex ? 'border-blue-600' : 'border-gray-200'
                      }`}
                    >
                      <PropertyImage
                        src={photo}
                        alt={`Photo ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="64px"
                        fallbackUrl=""
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Informations détaillées */}
            <div className="bg-white rounded-lg shadow-lg p-6">
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
                  <div className="text-2xl font-bold text-green-600">
                    {formatPrice(property.prix)}
                  </div>
                  <div className="text-sm text-gray-500">
                    Frais de visite: {formatPrice(property.fraisVisite)}
                  </div>
                </div>
              </div>

              {/* Caractéristiques */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Ruler className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="text-sm text-gray-500">Superficie</div>
                    <div className="font-semibold">{property.superficie} m²</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="text-sm text-gray-500">Prix au m²</div>
                    <div className="font-semibold">{formatPrice(Math.round(property.prix / property.superficie))}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-purple-600" />
                  <div>
                    <div className="text-sm text-gray-500">Visite</div>
                    <div className="font-semibold">{formatPrice(property.fraisVisite)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-600" />
                  <div>
                    <div className="text-sm text-gray-500">Disponible</div>
                    <div className="font-semibold">Immédiatement</div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                <div className="prose prose-gray max-w-none">
                  {property.description.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-3 text-gray-600 leading-relaxed">
                      {paragraph.trim()}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Actions */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
              <div className="space-y-3">
                <Button 
                  onClick={handleVisitRequest}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  size="lg"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Demander une visite
                </Button>
                
                <Button 
                  onClick={handleFavorite}
                  variant={isFavorite ? "default" : "outline"}
                  className={`w-full ${isFavorite ? 'bg-red-600 hover:bg-red-700' : ''}`}
                  disabled={favoriteLoading}
                >
                  {favoriteLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Heart className={`w-4 h-4 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
                  )}
                  {isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                </Button>
                
                <Button onClick={handleShare} variant="outline" className="w-full">
                  <Share2 className="w-4 h-4 mr-2" />
                  Partager
                </Button>
                
                <Button 
                  onClick={handleReport}
                  variant="outline" 
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Flag className="w-4 h-4 mr-2" />
                  Signaler un problème
                </Button>
              </div>
            </div>

            {/* Informations de l'agent */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Agent immobilier</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {property.agent.prenom} {property.agent.nom}
                  </div>
                  <div className="text-sm text-gray-500">Agent certifié</div>
                </div>
              </div>
              
              {session ? (
                <div className="space-y-2">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-3">
                      Contactez {property.agent.prenom} {property.agent.nom} pour plus d'informations
                    </p>
                    <Button variant="outline" className="w-full">
                      Contacter l'agent
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-3">
                    Connectez-vous pour voir les coordonnées de l'agent
                  </p>
                  <Button 
                    onClick={() => router.push('/auth/login?callbackUrl=' + encodeURIComponent(window.location.href))}
                    size="sm"
                  >
                    Se connecter
                  </Button>
                </div>
              )}
            </div>

            {/* Propriétés similaires */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Propriétés similaires</h3>
              <div className="text-center text-gray-500">
                <p>Bientôt disponible...</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {property && (
        <>
          {/* Modal de demande de visite */}
          <VisitRequestModal
            isOpen={showVisitModal}
            onClose={() => setShowVisitModal(false)}
            property={property}
            onSuccess={handleVisitSuccess}
          />

          {/* Modal de signalement */}
          <ReportModal
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
            property={property}
            onSuccess={handleReportSuccess}
          />

          {/* Modal de partage */}
          <ShareModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            property={property}
          />

          {/* Modal de connexion requise */}
          <AuthRequiredModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            action={authAction}
          />
        </>
      )}

      {/* Conteneur des toasts */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
}