// Composant modal pour partager une propriété
'use client';

import { useState, useEffect } from 'react';
import { Share2, X, Copy, Facebook, Twitter, Mail, MessageCircle, Link, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Property {
  id: string;
  titre: string;
  prix: number;
  adresse: string;
  type: string;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
}

export function ShareModal({ isOpen, onClose, property }: ShareModalProps) {
  const [currentUrl, setCurrentUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isWebShareSupported, setIsWebShareSupported] = useState(false);

  // Vérifier si Web Share API est supportée
  useEffect(() => {
    setIsWebShareSupported('share' in navigator);
  }, []);

  // Obtenir l'URL actuelle
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, []);

  // Fonction pour formater le prix
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  // Fonction pour extraire la ville de l'adresse
  const getCity = (address: string) => {
    const parts = address.split(',');
    return parts[parts.length - 1]?.trim() || 'Cameroun';
  };

  // Texte de partage par défaut
  const shareText = `Découvrez cette propriété : ${property.titre} à ${getCity(property.adresse)} pour ${formatPrice(property.prix)} - Marketplace Immo Cameroun`;

  // Fonction pour copier l'URL dans le presse-papier
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
      // Fallback pour les navigateurs qui ne supportent pas clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = currentUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Fonction pour utiliser Web Share API
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: property.titre,
          text: shareText,
          url: currentUrl
        });
      } catch (err) {
        console.error('Erreur lors du partage:', err);
      }
    }
  };

  // Fonctions de partage pour différentes plateformes
  const shareOnFacebook = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}&quote=${encodeURIComponent(shareText)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const shareOnTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(currentUrl)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const shareByEmail = () => {
    const subject = encodeURIComponent(`Propriété intéressante : ${property.titre}`);
    const body = encodeURIComponent(`
Bonjour,

Je pense que cette propriété pourrait vous intéresser :

${property.titre}
📍 ${property.adresse}
💰 Prix : ${formatPrice(property.prix)}

Voir les détails : ${currentUrl}

Cordialement
    `);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const shareOnWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + currentUrl)}`;
    window.open(whatsappUrl, '_blank');
  };

  // Ne pas rendre le composant si le modal n'est pas ouvert
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Share2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Partager cette propriété
              </h3>
              <p className="text-sm text-gray-600">
                {property.titre}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6">
          {/* Informations de la propriété */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-sm">
              <p className="font-medium text-gray-900 mb-1">{property.titre}</p>
              <p className="text-gray-600 mb-1">{property.adresse}</p>
              <p className="text-blue-600 font-semibold">{formatPrice(property.prix)}</p>
            </div>
          </div>

          {/* Partage natif (si supporté) */}
          {isWebShareSupported && (
            <div className="mb-6">
              <Button
                onClick={handleNativeShare}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Partager
              </Button>
            </div>
          )}

          {/* Copie du lien */}
          <div className="mb-6">
            <Label className="text-sm font-medium text-gray-700 mb-2 block">
              Lien de la propriété
            </Label>
            <div className="flex gap-2">
              <Input
                value={currentUrl}
                readOnly
                className="flex-1 text-sm bg-gray-50"
              />
              <Button
                onClick={copyToClipboard}
                variant="outline"
                size="sm"
                className={copied ? 'text-green-600 border-green-200' : ''}
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
            {copied && (
              <p className="text-xs text-green-600 mt-1">Lien copié !</p>
            )}
          </div>

          {/* Options de partage */}
          <div>
            <Label className="text-sm font-medium text-gray-700 mb-3 block">
              Partager sur
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {/* Facebook */}
              <Button
                onClick={shareOnFacebook}
                variant="outline"
                className="flex items-center gap-2 p-3 h-auto"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Facebook className="w-4 h-4 text-white fill-current" />
                </div>
                <span className="text-sm font-medium">Facebook</span>
              </Button>

              {/* Twitter */}
              <Button
                onClick={shareOnTwitter}
                variant="outline"
                className="flex items-center gap-2 p-3 h-auto"
              >
                <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center">
                  <Twitter className="w-4 h-4 text-white fill-current" />
                </div>
                <span className="text-sm font-medium">Twitter</span>
              </Button>

              {/* WhatsApp */}
              <Button
                onClick={shareOnWhatsApp}
                variant="outline"
                className="flex items-center gap-2 p-3 h-auto"
              >
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium">WhatsApp</span>
              </Button>

              {/* Email */}
              <Button
                onClick={shareByEmail}
                variant="outline"
                className="flex items-center gap-2 p-3 h-auto"
              >
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium">Email</span>
              </Button>
            </div>
          </div>

          {/* Note */}
          <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Link className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Partage sécurisé</p>
                <p className="text-xs leading-relaxed">
                  Le lien partagé est permanent et permettra à vos contacts de voir cette propriété 
                  même si elle n'est plus disponible.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}