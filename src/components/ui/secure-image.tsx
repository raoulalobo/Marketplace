// Composant SecureImage - Composant universel pour éviter les erreurs src=""
// Utilise ce composant pour toutes les images dans l'application
'use client';

import React from 'react';
import { SmartImage } from './smart-image';
import { PropertyImage } from './property-image';
import { SafeImage } from './safe-image';

interface SecureImageProps {
  // Source de l'image (peut être null, undefined, ou chaîne vide)
  src: string | null | undefined;
  // Texte alternatif
  alt: string;
  // Type de composant à utiliser
  componentType?: 'smart' | 'property' | 'safe';
  // Pour PropertyImage
  propertyType?: string;
  fallbackUrl?: string;
  showPlaceholderOnError?: boolean;
  // Props standard d'image
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
}

/**
 * Composant SecureImage - Solution universelle pour éviter les erreurs src=""
 * 
 * Ce composant garantit qu'aucune chaîne vide n'est passée à l'attribut src,
 * ce qui évite l'erreur: "An empty string ("") was passed to the src attribute"
 * 
 * @param src - Source de l'image (string | null | undefined)
 * @param alt - Texte alternatif obligatoire
 * @param componentType - Type de composant à utiliser ('smart', 'property', 'safe')
 * @param props - Autres props d'image standard
 */
export function SecureImage({
  src,
  alt,
  componentType = 'smart',
  propertyType,
  fallbackUrl,
  showPlaceholderOnError,
  fill,
  width,
  height,
  className,
  priority,
  sizes,
  quality,
  ...props
}: SecureImageProps) {
  // Normaliser la source: convertir les chaînes vides en null
  const normalizedSrc = src && src.trim() !== '' ? src : null;

  // Choisir le composant approprié
  switch (componentType) {
    case 'property':
      return (
        <PropertyImage
          src={normalizedSrc}
          alt={alt}
          fill={fill}
          width={width}
          height={height}
          className={className}
          priority={priority}
          sizes={sizes}
          quality={quality}
          propertyType={propertyType}
          fallbackUrl={fallbackUrl}
          showPlaceholderOnError={showPlaceholderOnError}
          {...props}
        />
      );

    case 'safe':
      return (
        <SafeImage
          src={normalizedSrc}
          alt={alt}
          fill={fill}
          width={width}
          height={height}
          className={className}
          priority={priority}
          sizes={sizes}
          quality={quality}
          {...props}
        />
      );

    case 'smart':
    default:
      return (
        <SmartImage
          src={normalizedSrc}
          alt={alt}
          fill={fill}
          width={width}
          height={height}
          className={className}
          priority={priority}
          sizes={sizes}
          quality={quality}
          propertyType={propertyType as any}
          {...props}
        />
      );
  }
}

// Composants spécialisés pour faciliter l'utilisation
export const SecurePropertyImage = (props: Omit<SecureImageProps, 'componentType'>) => (
  <SecureImage {...props} componentType="property" />
);

export const SecureSmartImage = (props: Omit<SecureImageProps, 'componentType'>) => (
  <SecureImage {...props} componentType="smart" />
);

export const SecureSafeImage = (props: Omit<SecureImageProps, 'componentType'>) => (
  <SecureImage {...props} componentType="safe" />
);