// Composant PropertyImage avec fallback intelligent pour les images de propriétés
'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { SafeImage } from './safe-image';
import { cn } from '@/lib/utils';
import { getPlaceholderByType } from './placeholders';

interface PropertyImageProps {
  src: string | null | undefined;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
  fallbackUrl?: string; // URL de fallback personnalisée (ex: Unsplash)
  propertyType?: string; // Type de propriété pour le placeholder approprié
  showPlaceholderOnError?: boolean; // Afficher le placeholder SVG en cas d'erreur
}

export function PropertyImage({ 
  src, 
  alt, 
  fill = false, 
  width, 
  height, 
  className,
  priority = false,
  sizes,
  quality = 75,
  fallbackUrl = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80',
  propertyType,
  showPlaceholderOnError = true,
  ...props 
}: PropertyImageProps) {
  const [primaryError, setPrimaryError] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);
  const [is404, setIs404] = useState(false);

  // Calculer le placeholder SVG selon le type de propriété
  const placeholderSvg = useMemo(() => {
    return getPlaceholderByType(propertyType);
  }, [propertyType]);

  // Détecter si une erreur est un 404
  const checkIf404 = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = event.currentTarget;
    // Essayer de déterminer si c'est une erreur 404
    if (img.naturalWidth === 0 && img.naturalHeight === 0) {
      setIs404(true);
      console.warn('Image 404 détectée:', src || fallbackUrl);
    }
  };

  // Si l'image principale échoue
  const handlePrimaryError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    checkIf404(event);
    setPrimaryError(true);
  };

  // Si l'image de fallback échoue aussi
  const handleFallbackError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    checkIf404(event);
    setFallbackError(true);
  };

  // Si les deux images échouent ou si aucune image n'est disponible
  if ((primaryError && fallbackError) || (!src && !fallbackUrl)) {
    if (showPlaceholderOnError) {
      // Utiliser le placeholder SVG directement
      return (
        <div 
          className={cn(
            "flex items-center justify-center bg-gray-100 border border-gray-200 rounded-lg overflow-hidden",
            fill ? "absolute inset-0" : "relative",
            className
          )}
          style={!fill ? { width, height } : undefined}
          {...props}
        >
          <img
            src={placeholderSvg}
            alt={`${alt} (placeholder)`}
            className="max-w-full max-h-full object-contain"
            style={!fill ? { width, height } : undefined}
          />
        </div>
      );
    } else {
      // Fallback sur SafeImage si le placeholder n'est pas souhaité
      return (
        <SafeImage
          src={null}
          alt={alt}
          fill={fill}
          width={!fill ? width : undefined}
          height={!fill ? height : undefined}
          className={className}
          priority={priority}
          sizes={sizes}
          quality={quality}
          {...props}
        />
      );
    }
  }

  // Si l'image principale a échoué mais pas encore testé le fallback
  if (primaryError && !fallbackError) {
    return (
      <Image
        src={fallbackUrl}
        alt={`${alt} (image de remplacement)`}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        className={className}
        onError={handleFallbackError}
        priority={priority}
        sizes={sizes}
        quality={quality}
        {...props}
      />
    );
  }

  // Utiliser l'image principale si elle existe
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        className={className}
        onError={handlePrimaryError}
        priority={priority}
        sizes={sizes}
        quality={quality}
        {...props}
      />
    );
  }

  // Si pas d'image principale, utiliser directement le fallback
  return (
    <Image
      src={fallbackUrl}
      alt={`${alt} (image par défaut)`}
      fill={fill}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      className={className}
      onError={handleFallbackError}
      priority={priority}
      sizes={sizes}
      quality={quality}
      {...props}
    />
  );
}