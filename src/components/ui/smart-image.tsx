// Composant SmartImage - Remplacement intelligent de Next.Image avec fallbacks automatiques
'use client';

import React, { forwardRef } from 'react';
import NextImage from 'next/image';
import { cn } from '@/lib/utils';
import { useImage } from '@/hooks/use-image';
import { useImageContext, useImageMonitoring } from '@/components/ui/image-provider';
import { SmartImageProps, PropertyType, PlaceholderType } from '@/types/image';

// Mapping des types de propriétés vers les types de placeholders
const PROPERTY_TYPE_TO_PLACEHOLDER: Record<PropertyType, PlaceholderType> = {
  MAISON: 'property',
  TERRAIN: 'property',
  BUREAU: 'property',
  HANGAR: 'property',
  AUTRE: 'property',
};

// Détecter automatiquement le type de placeholder selon le contexte
const detectPlaceholderType = (
  alt: string,
  className?: string,
  propertyType?: PropertyType
): PlaceholderType => {
  // Détecter selon les classes CSS
  if (className) {
    if (className.includes('avatar')) return 'avatar';
    if (className.includes('banner')) return 'banner';
    if (className.includes('thumbnail')) return 'thumbnail';
    if (className.includes('gallery')) return 'gallery';
  }

  // Détecter selon le texte alternatif
  const altLower = alt.toLowerCase();
  if (altLower.includes('avatar') || altLower.includes('profile')) return 'avatar';
  if (altLower.includes('banner') || altLower.includes('cover')) return 'banner';
  if (altLower.includes('thumbnail')) return 'thumbnail';

  // Utiliser le type de propriété si fourni
  if (propertyType) {
    return PROPERTY_TYPE_TO_PLACEHOLDER[propertyType];
  }

  // Par défaut, utiliser le type property
  return 'property';
};

export const SmartImage = forwardRef<HTMLImageElement, SmartImageProps>(
  ({
    src,
    alt,
    width,
    height,
    quality = 75,
    priority = false,
    sizes,
    placeholder = 'empty',
    blurDataURL,
    className,
    style,
    fill = false,
    loading = 'lazy',
    fetchPriority = 'auto',
    decoding = 'async',
    onLoad: onLoadProp,
    onError: onErrorProp,
    propertyType,
    ...props
  }, ref) => {
    // Détecter le type de placeholder automatiquement
    const placeholderType = detectPlaceholderType(alt, className, propertyType);

    // Utiliser le hook useImage pour la gestion intelligente des images
    const {
      src: currentSrc,
      isLoading,
      hasError,
      error,
      metrics,
      isFallback,
      fallbackType,
      load,
      retry,
    } = useImage(src, {
      placeholderType,
      propertyType,
      enableCache: true,
      onError: (error) => {
        if (onErrorProp) {
          // Créer un événement synthétique pour compatibilité
          const event = new Event('error') as any;
          event.currentTarget = { naturalWidth: 0, naturalHeight: 0 };
          onErrorProp(event);
        }
      },
      onLoad: (metrics) => {
        if (onLoadProp) {
          // Créer un événement synthétique pour compatibilité
          const event = new Event('load') as any;
          onLoadProp(event);
        }
      },
    });

    // Utiliser le monitoring du contexte
    const { handleError: handleMonitoringError, handleLoad: handleMonitoringLoad, enableDebugging } = useImageMonitoring(src);

    // Gérer les événements
    const handleLoad = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
      handleMonitoringLoad(metrics || { 
        loadTime: 0, 
        cacheHit: false, 
        fallbackUsed: isFallback,
        fallbackType 
      });
      onLoadProp?.(event);
    };

    const handleError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
      if (error) {
        handleMonitoringError(error);
      }
      onErrorProp?.(event);
    };

    // État de chargement pour l'UI
    const showSkeleton = isLoading && !currentSrc;
    const showImage = !showSkeleton && currentSrc;

    // Classes CSS conditionnelles
    const imageClasses = cn(
      'transition-opacity duration-300',
      isLoading ? 'opacity-0' : 'opacity-100',
      hasError ? 'grayscale' : '',
      className
    );

    // Logging pour le débogage
    React.useEffect(() => {
      if (enableDebugging) {
        console.group('🖼️ SmartImage Debug');
        console.log('Props:', { src, alt, width, height, propertyType });
        console.log('State:', { currentSrc, isLoading, hasError, isFallback });
        console.log('Metrics:', metrics);
        console.log('Error:', error);
        console.groupEnd();
      }
    }, [src, alt, currentSrc, isLoading, hasError, isFallback, metrics, error, enableDebugging, propertyType]);

    // Si aucune source n'est disponible, ne rien rendre
    if (!currentSrc && !isLoading) {
      return null;
    }

    return (
      <div 
        className={cn(
          'relative overflow-hidden',
          fill ? 'absolute inset-0' : 'inline-block',
          className
        )}
        style={!fill ? { width, height, ...style } : style}
        {...props}
      >
        {/* Skeleton pendant le chargement */}
        {showSkeleton && (
          <div 
            className={cn(
              'absolute inset-0 bg-gray-200 animate-pulse',
              fill ? 'absolute inset-0' : 'inline-block'
            )}
            style={!fill ? { width, height } : undefined}
          />
        )}

        {/* Image principale */}
        {showImage && (
          <NextImage
            ref={ref}
            src={currentSrc}
            alt={alt}
            width={!fill ? width : undefined}
            height={!fill ? height : undefined}
            quality={quality}
            priority={priority}
            sizes={sizes}
            placeholder={placeholder}
            blurDataURL={blurDataURL}
            fill={fill}
            loading={loading}
            fetchPriority={fetchPriority}
            decoding={decoding}
            onLoad={handleLoad}
            onError={handleError}
            className={imageClasses}
            style={{
              objectFit: 'cover',
              ...style,
            }}
          />
        )}

        {/* Indicateur de fallback en mode débogage */}
        {enableDebugging && isFallback && (
          <div className="absolute top-1 right-1 bg-yellow-400 text-black text-xs px-1 rounded">
            {fallbackType}
          </div>
        )}

        {/* Indicateur d'erreur en mode débogage */}
        {enableDebugging && hasError && (
          <div className="absolute top-1 left-1 bg-red-400 text-white text-xs px-1 rounded">
            ERROR
          </div>
        )}

        {/* Overlay pour les images en erreur */}
        {hasError && (
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
            <div className="text-white text-xs bg-black/50 px-2 py-1 rounded">
              Image indisponible
            </div>
          </div>
        )}
      </div>
    );
  }
);

SmartImage.displayName = 'SmartImage';

// Composant simplifié pour les avatars
export const SmartAvatar = forwardRef<HTMLImageElement, Omit<SmartImageProps, 'propertyType'>>(
  (props, ref) => {
    return (
      <SmartImage
        {...props}
        ref={ref}
        placeholderType="avatar"
        className={cn(
          'rounded-full object-cover',
          props.className
        )}
      />
    );
  }
);

SmartAvatar.displayName = 'SmartAvatar';

// Composant simplifié pour les bannières
export const SmartBanner = forwardRef<HTMLImageElement, Omit<SmartImageProps, 'propertyType'>>(
  (props, ref) => {
    return (
      <SmartImage
        {...props}
        ref={ref}
        placeholderType="banner"
        className={cn(
          'w-full object-cover',
          props.className
        )}
      />
    );
  }
);

SmartBanner.displayName = 'SmartBanner';

// Composant simplifié pour les thumbnails
export const SmartThumbnail = forwardRef<HTMLImageElement, Omit<SmartImageProps, 'propertyType'>>(
  (props, ref) => {
    return (
      <SmartImage
        {...props}
        ref={ref}
        placeholderType="thumbnail"
        className={cn(
          'rounded object-cover',
          props.className
        )}
      />
    );
  }
);

SmartThumbnail.displayName = 'SmartThumbnail';

// Composant simplifié pour les galeries
export const SmartGallery = forwardRef<HTMLImageElement, Omit<SmartImageProps, 'propertyType'>>(
  (props, ref) => {
    return (
      <SmartImage
        {...props}
        ref={ref}
        placeholderType="gallery"
        className={cn(
          'rounded-lg object-cover',
          props.className
        )}
      />
    );
  }
);

SmartGallery.displayName = 'SmartGallery';