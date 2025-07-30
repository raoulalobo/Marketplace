// Modal pour partager une propriété sur les réseaux sociaux via Ayrshare
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Share2, 
  Facebook, 
  Instagram, 
  Linkedin,
  Twitter,
  Youtube,
  Video,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  Image as ImageIcon,
  DollarSign,
  FileText,
  Ruler,
  Tag,
  X
} from 'lucide-react';

// Interface pour les propriétés
interface Property {
  id: string;
  titre: string;
  description: string;
  type: 'MAISON' | 'TERRAIN' | 'BUREAU' | 'HANGAR';
  prix: number;
  superficie: number;
  adresse: string;
  medias: Array<{
    url: string;
    type: 'PHOTO' | 'VIDEO';
    order: number;
  }>;
}

// Interface pour les plateformes sociales supportées
interface SocialPlatform {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
}

// Configuration des plateformes sociales
const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    icon: Facebook,
    color: 'text-blue-600',
    description: 'Partage sur votre page Facebook'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: Instagram,
    color: 'text-pink-600',
    description: 'Publication sur Instagram'
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: Linkedin,
    color: 'text-blue-700',
    description: 'Réseau professionnel'
  },
  {
    id: 'twitter',
    name: 'X (Twitter)',
    icon: Twitter,
    color: 'text-gray-800',
    description: 'Post sur X'
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: Video,
    color: 'text-black',
    description: 'Publication sur TikTok'
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: Youtube,
    color: 'text-red-600',
    description: 'Post communautaire YouTube'
  }
];

// Props du composant
interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

export function SocialShareModal({
  isOpen,
  onClose,
  property,
  onSuccess,
  onError
}: SocialShareModalProps) {
  // États du composant
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['facebook']);
  const [includeElements, setIncludeElements] = useState({
    title: true,
    price: true,
    surface: true,
    description: true,
  });
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [publishResult, setPublishResult] = useState<any>(null);

  // Formatage du prix
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  // Générer la prévisualisation du contenu
  const generatePreview = () => {
    let content = '';
    
    if (customMessage.trim()) {
      content += customMessage.trim() + '\n\n';
    }

    if (includeElements.title) {
      content += `🏡 ${property.titre}\n\n`;
    }

    const details = [];
    if (includeElements.price) {
      details.push(`💰 Prix: ${formatPrice(property.prix)}`);
    }
    if (includeElements.surface) {
      details.push(`📐 Superficie: ${property.superficie} m²`);
    }
    if (details.length > 0) {
      content += details.join('\n') + '\n\n';
    }

    if (includeElements.description && property.description) {
      const shortDescription = property.description.length > 200 
        ? property.description.substring(0, 200) + '...'
        : property.description;
      content += `📋 ${shortDescription}\n\n`;
    }

    content += `📍 ${property.adresse}\n\n`;
    
    const typeHashtags = {
      'MAISON': '#Maison #Villa',
      'TERRAIN': '#Terrain #Parcelle',
      'BUREAU': '#Bureau #Commercial',
      'HANGAR': '#Hangar #Entrepot'
    };
    
    content += `${typeHashtags[property.type]} #ImmobilierCameroun #RealEstate #Investissement`;

    return content.trim();
  };

  // Gérer la sélection des plateformes
  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev => {
      if (prev.includes(platformId)) {
        return prev.filter(id => id !== platformId);
      } else {
        return [...prev, platformId];
      }
    });
  };

  // Gérer la sélection des éléments à inclure
  const toggleElement = (element: keyof typeof includeElements) => {
    setIncludeElements(prev => ({
      ...prev,
      [element]: !prev[element]
    }));
  };

  // Gérer la sélection des photos
  const togglePhoto = (photoUrl: string) => {
    setSelectedPhotos(prev => {
      if (prev.includes(photoUrl)) {
        return prev.filter(url => url !== photoUrl);
      } else {
        // Limiter à 4 photos selon les limites de l'API
        if (prev.length >= 4) {
          return prev;
        }
        return [...prev, photoUrl];
      }
    });
  };

  // Publier sur les réseaux sociaux
  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      onError?.('Veuillez sélectionner au moins une plateforme');
      return;
    }

    setIsLoading(true);
    setPublishResult(null);

    try {
      const response = await fetch(`/api/properties/${property.id}/share-social`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platforms: selectedPlatforms,
          includeElements: {
            ...includeElements,
            photos: selectedPhotos.length > 0
          },
          selectedPhotos,
          customMessage: customMessage.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la publication');
      }

      setPublishResult(result);
      onSuccess?.(result);
      
    } catch (error) {
      console.error('Erreur publication sociale:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Réinitialiser et fermer
  const handleClose = () => {
    setPublishResult(null);
    setIsLoading(false);
    onClose();
  };

  // Obtenir les photos disponibles
  const availablePhotos = property.medias
    .filter(media => media.type === 'PHOTO')
    .sort((a, b) => a.order - b.order);

  // Ne pas rendre le composant si le modal n'est pas ouvert
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Share2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Publier sur les réseaux sociaux
              </h3>
              <p className="text-sm text-gray-600">
                {property.titre}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-6">

        {!publishResult ? (
          <div className="space-y-6">
            {/* Sélection des plateformes */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Plateformes de publication
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {SOCIAL_PLATFORMS.map((platform) => {
                  const Icon = platform.icon;
                  const isSelected = selectedPlatforms.includes(platform.id);
                  
                  return (
                    <div
                      key={platform.id}
                      onClick={() => togglePlatform(platform.id)}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 border-2 rounded ${
                          isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                        } flex items-center justify-center`}>
                          {isSelected && (
                            <CheckCircle className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <Icon className={`w-5 h-5 ${platform.color}`} />
                        <div>
                          <div className="font-medium">{platform.name}</div>
                          <div className="text-sm text-gray-500">{platform.description}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Sélection du contenu */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Éléments à inclure dans la publication
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div 
                  onClick={() => toggleElement('title')}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    includeElements.title ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 border-2 rounded ${
                      includeElements.title ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                    } flex items-center justify-center`}>
                      {includeElements.title && (
                        <CheckCircle className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <Tag className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">Titre de la propriété</span>
                  </div>
                </div>

                <div 
                  onClick={() => toggleElement('price')}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    includeElements.price ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 border-2 rounded ${
                      includeElements.price ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                    } flex items-center justify-center`}>
                      {includeElements.price && (
                        <CheckCircle className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <DollarSign className="w-4 h-4 text-green-600" />
                    <span className="font-medium">Prix ({formatPrice(property.prix)})</span>
                  </div>
                </div>

                <div 
                  onClick={() => toggleElement('surface')}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    includeElements.surface ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 border-2 rounded ${
                      includeElements.surface ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                    } flex items-center justify-center`}>
                      {includeElements.surface && (
                        <CheckCircle className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <Ruler className="w-4 h-4 text-purple-600" />
                    <span className="font-medium">Superficie ({property.superficie} m²)</span>
                  </div>
                </div>


                <div 
                  onClick={() => toggleElement('description')}
                  className={`p-3 rounded-lg border cursor-pointer transition-all col-span-full ${
                    includeElements.description ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 border-2 rounded ${
                      includeElements.description ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                    } flex items-center justify-center`}>
                      {includeElements.description && (
                        <CheckCircle className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="font-medium">Description</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sélection des photos */}
            {availablePhotos.length > 0 && (
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Photos à inclure (max 4)
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {availablePhotos.map((media, index) => {
                    const isSelected = selectedPhotos.includes(media.url);
                    const isDisabled = !isSelected && selectedPhotos.length >= 4;
                    
                    return (
                      <div
                        key={media.url}
                        onClick={() => !isDisabled && togglePhoto(media.url)}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-blue-500 ring-2 ring-blue-200' 
                            : isDisabled 
                              ? 'border-gray-200 opacity-50 cursor-not-allowed'
                              : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img 
                          src={media.url} 
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Indicateur de sélection */}
                        <div className={`absolute top-2 right-2 w-6 h-6 border-2 rounded-full flex items-center justify-center transition-all ${
                          isSelected 
                            ? 'bg-blue-500 border-blue-500' 
                            : 'bg-white border-gray-300'
                        }`}>
                          {isSelected && (
                            <CheckCircle className="w-4 h-4 text-white" />
                          )}
                        </div>
                        
                        {/* Numéro d'ordre si sélectionné */}
                        {isSelected && (
                          <div className="absolute top-2 left-2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {selectedPhotos.indexOf(media.url) + 1}
                          </div>
                        )}
                        
                        {/* Overlay pour les photos désactivées */}
                        {isDisabled && (
                          <div className="absolute inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center">
                            <span className="text-white text-xs font-medium">Max atteint</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  {selectedPhotos.length} / 4 photos sélectionnées
                  {selectedPhotos.length >= 4 && (
                    <span className="text-orange-600 ml-2">• Limite atteinte</span>
                  )}
                </div>
              </div>
            )}

            {/* Message personnalisé */}
            <div>
              <Label htmlFor="customMessage" className="text-base font-semibold mb-3 block">
                Message personnalisé (optionnel)
              </Label>
              <Textarea
                id="customMessage"
                placeholder="Ajoutez un message personnel qui apparaîtra en début de publication..."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <div className="text-sm text-gray-500 mt-1">
                {customMessage.length}/500 caractères
              </div>
            </div>

            {/* Prévisualisation */}
            <div>
              <Label className="text-base font-semibold mb-3 block">
                Aperçu de la publication
              </Label>
              <div className="p-4 bg-gray-50 rounded-lg border max-h-48 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                  {generatePreview()}
                </pre>
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {generatePreview().length} caractères
                {selectedPhotos.length > 0 && (
                  <span> • {selectedPhotos.length} photo(s) sélectionnée(s)</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                Annuler
              </Button>
              <Button 
                onClick={handlePublish}
                disabled={isLoading || selectedPlatforms.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Publication en cours...
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 mr-2" />
                    Publier sur {selectedPlatforms.length} plateforme(s)
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          // Résultats de la publication
          <div className="space-y-4">
            <div className="text-center">
              {publishResult.data?.successfulPosts > 0 ? (
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              ) : (
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              )}
              
              <h3 className="text-lg font-semibold mb-2">
                {publishResult.data?.successfulPosts > 0 
                  ? 'Publication réussie !' 
                  : 'Échec de la publication'
                }
              </h3>
              
              <p className="text-gray-600 mb-4">
                {publishResult.message}
              </p>
            </div>

            {/* Détails des publications */}
            {publishResult.data?.postDetails && (
              <div className="space-y-2">
                <Label className="font-semibold">Détails par plateforme :</Label>
                {publishResult.data.postDetails.map((post: any, index: number) => (
                  <div key={index} className={`flex items-center gap-3 p-3 rounded-lg ${
                    post.status === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    {post.status === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600" />
                    )}
                    <div className="flex-1">
                      <div className="font-medium capitalize">{post.platform}</div>
                      {post.postUrl && (
                        <a 
                          href={post.postUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Voir la publication
                        </a>
                      )}
                    </div>
                    <Badge variant={post.status === 'success' ? 'default' : 'destructive'}>
                      {post.status === 'success' ? 'Publié' : 'Échec'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}

            {/* Erreurs */}
            {publishResult.errors && publishResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 mr-3" />
                  <div>
                    <strong className="text-red-800">Erreurs rencontrées :</strong>
                    <ul className="list-disc list-inside mt-1 text-red-700">
                      {publishResult.errors.map((error: string, index: number) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-center pt-4 border-t">
              <Button onClick={handleClose}>
                Fermer
              </Button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}