// Composant PropertyImage avec fallback intelligent pour les images de propriétés
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { SafeImage } from './safe-image';
import { cn } from '@/lib/utils';

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
  ...props 
}: PropertyImageProps) {
  const [primaryError, setPrimaryError] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);

  // Si l'image principale échoue
  const handlePrimaryError = () => {
    setPrimaryError(true);
  };

  // Si l'image de fallback échoue aussi
  const handleFallbackError = () => {
    setFallbackError(true);
  };

  // Si les deux images échouent, utiliser SafeImage avec watermark
  if ((primaryError && fallbackError) || (!src && !fallbackUrl)) {
    return (
      <SafeImage
        src="" // Forcer l'erreur pour afficher le placeholder
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