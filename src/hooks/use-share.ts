// Hook personnalisé pour gérer le partage de propriétés
'use client';

import { useState, useEffect, useCallback } from 'react';

interface ShareData {
  title: string;
  text: string;
  url: string;
}

interface Property {
  id: string;
  titre: string;
  prix: number;
  adresse: string;
  type: string;
}

interface UseShareOptions {
  property: Property;
  customUrl?: string;
  customText?: string;
}

interface UseShareReturn {
  isWebShareSupported: boolean;
  shareUrl: string;
  shareText: string;
  shareNatively: () => Promise<boolean>;
  copyToClipboard: () => Promise<boolean>;
  shareOnFacebook: () => void;
  shareOnTwitter: () => void;
  shareOnWhatsApp: () => void;
  shareByEmail: () => void;
  generateSocialMediaText: (platform: 'facebook' | 'twitter' | 'whatsapp') => string;
}

export function useShare({ property, customUrl, customText }: UseShareOptions): UseShareReturn {
  const [isWebShareSupported, setIsWebShareSupported] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  // Vérifier le support de Web Share API
  useEffect(() => {
    setIsWebShareSupported('share' in navigator);
  }, []);

  // Obtenir l'URL de partage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = customUrl || window.location.href;
      setShareUrl(url);
    }
  }, [customUrl]);

  // Fonctions utilitaires
  const formatPrice = useCallback((price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  }, []);

  const getCity = useCallback((address: string) => {
    const parts = address.split(',');
    return parts[parts.length - 1]?.trim() || 'Cameroun';
  }, []);

  // Texte de partage par défaut
  const shareText = customText || `Découvrez cette propriété : ${property.titre} à ${getCity(property.adresse)} pour ${formatPrice(property.prix)} - Marketplace Immo Cameroun`;

  // Fonction de partage natif
  const shareNatively = useCallback(async (): Promise<boolean> => {
    if (!navigator.share) {
      return false;
    }

    try {
      const shareData: ShareData = {
        title: property.titre,
        text: shareText,
        url: shareUrl
      };

      await navigator.share(shareData);
      return true;
    } catch (error: any) {
      // L'utilisateur a annulé le partage ou une erreur s'est produite
      console.log('Partage annulé ou erreur:', error);
      return false;
    }
  }, [property.titre, shareText, shareUrl]);

  // Fonction de copie dans le presse-papier
  const copyToClipboard = useCallback(async (): Promise<boolean> => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        return true;
      } else {
        // Fallback pour les navigateurs qui ne supportent pas clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const result = document.execCommand('copy');
        document.body.removeChild(textArea);
        return result;
      }
    } catch (error) {
      console.error('Erreur lors de la copie:', error);
      return false;
    }
  }, [shareUrl]);

  // Fonction de partage Facebook
  const shareOnFacebook = useCallback(() => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
    const windowFeatures = 'width=600,height=400,scrollbars=yes,resizable=yes';
    window.open(facebookUrl, '_blank', windowFeatures);
  }, [shareUrl, shareText]);

  // Fonction de partage Twitter
  const shareOnTwitter = useCallback(() => {
    // Limiter le texte à 240 caractères pour Twitter
    const twitterText = shareText.length > 240 ? shareText.substring(0, 237) + '...' : shareText;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(shareUrl)}`;
    const windowFeatures = 'width=600,height=400,scrollbars=yes,resizable=yes';
    window.open(twitterUrl, '_blank', windowFeatures);
  }, [shareText, shareUrl]);

  // Fonction de partage WhatsApp
  const shareOnWhatsApp = useCallback(() => {
    const whatsappText = `${shareText} ${shareUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
    window.open(whatsappUrl, '_blank');
  }, [shareText, shareUrl]);

  // Fonction de partage par email
  const shareByEmail = useCallback(() => {
    const subject = encodeURIComponent(`Propriété intéressante : ${property.titre}`);
    const city = getCity(property.adresse);
    const body = encodeURIComponent(`
Bonjour,

Je pense que cette propriété pourrait vous intéresser :

🏠 ${property.titre}
📍 ${property.adresse}
💰 Prix : ${formatPrice(property.prix)}
🏷️ Type : ${property.type}

Voir les détails complets : ${shareUrl}

Cette propriété est située à ${city} et semble correspondre à ce que vous recherchez.

Cordialement
    `.trim());
    
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  }, [property, shareUrl, getCity, formatPrice]);

  // Fonction pour générer du texte personnalisé par plateforme
  const generateSocialMediaText = useCallback((platform: 'facebook' | 'twitter' | 'whatsapp'): string => {
    const city = getCity(property.adresse);
    const price = formatPrice(property.prix);
    
    switch (platform) {
      case 'facebook':
        return `🏠 Superbe propriété à découvrir !

${property.titre}
📍 ${city}
💰 ${price}

#ImmobilierCameroun #PropertyForSale #${city.replace(/\s+/g, '')} #MarketplaceImmo`;

      case 'twitter':
        return `🏠 ${property.titre} à ${city} - ${price} #ImmobilierCameroun #PropertyForSale`;

      case 'whatsapp':
        return `🏠 *${property.titre}*

📍 Localisation : ${property.adresse}
💰 Prix : ${price}
🏷️ Type : ${property.type}

Je pense que cette propriété pourrait t'intéresser ! 

Voici le lien pour voir tous les détails :`;

      default:
        return shareText;
    }
  }, [property, shareText, getCity, formatPrice]);

  return {
    isWebShareSupported,
    shareUrl,
    shareText,
    shareNatively,
    copyToClipboard,
    shareOnFacebook,
    shareOnTwitter,
    shareOnWhatsApp,
    shareByEmail,
    generateSocialMediaText
  };
}