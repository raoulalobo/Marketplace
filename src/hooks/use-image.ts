// Hook intelligent pour la gestion des images avec fallbacks automatiques
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ImageOptions, 
  ImageFallback, 
  ImageMetrics, 
  ImageError, 
  UseImageOptions,
  DEFAULT_IMAGE_CONFIG 
} from '@/types/image';
import { 
  isValidImageUrl, 
  sanitizeImageUrl, 
  generateFallbackSequence, 
  createImageError,
  is404Error,
  createColorDataUrl,
  formatImageMetadata
} from '@/lib/image-utils';
import { globalImageCache } from '@/lib/image-cache';
import { getPlaceholderByType } from '@/components/ui/placeholders';

interface UseImageState {
  currentSrc: string | null;
  isLoading: boolean;
  hasError: boolean;
  currentFallbackIndex: number;
  metrics: ImageMetrics | null;
  error: ImageError | null;
}

export function useImage(
  initialSrc: string | null | undefined,
  options: UseImageOptions = {}
) {
  const {
    fallbacks,
    placeholderType = 'property',
    propertyType,
    enableCache = true,
    retryCount = 2,
    onError,
    onLoad
  } = options;

  // État du hook
  const [state, setState] = useState<UseImageState>({
    currentSrc: null,
    isLoading: true,
    hasError: false,
    currentFallbackIndex: -1,
    metrics: null,
    error: null,
  });

  // Références pour éviter les fuites de mémoire
  const loadStartTimeRef = useRef<number>(0);
  const attemptRef = useRef<number>(0);
  const fallbackSequenceRef = useRef<ImageFallback[]>([]);
  const originalSrcRef = useRef<string | null>(null);

  // Générer la séquence de fallbacks
  const generateFallbacks = useCallback((src: string | null | undefined) => {
    if (!src) return [];
    
    const sequence = generateFallbackSequence(src, propertyType, fallbacks);
    fallbackSequenceRef.current = sequence;
    return sequence;
  }, [propertyType, fallbacks]);

  // Charger une image avec métriques
  const loadImageWithMetrics = useCallback(async (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      loadStartTimeRef.current = performance.now();

      img.onload = () => {
        const loadTime = performance.now() - loadStartTimeRef.current;
        const metrics: ImageMetrics = {
          loadTime,
          cacheHit: false, // TODO: Implémenter la détection de cache
          fallbackUsed: state.currentFallbackIndex > 0,
          fallbackType: state.currentFallbackIndex > 0 
            ? fallbackSequenceRef.current[state.currentFallbackIndex - 1]?.type 
            : undefined,
        };

        setState(prev => ({
          ...prev,
          isLoading: false,
          hasError: false,
          metrics,
        }));

        // Mettre en cache si c'est un fallback réussi
        if (enableCache && state.currentFallbackIndex > 0 && originalSrcRef.current) {
          globalImageCache.set(originalSrcRef.current, src);
        }

        onLoad?.(metrics);
        resolve();
      };

      img.onerror = (event) => {
        const loadTime = performance.now() - loadStartTimeRef.current;
        const errorType = is404Error(event as any) ? 'not_found' : 'network_error';
        const error = createImageError(errorType, `Failed to load image: ${src}`, src);

        setState(prev => ({
          ...prev,
          hasError: true,
          error,
        }));

        // Mettre à jour le compteur d'erreurs dans le cache
        if (enableCache && originalSrcRef.current) {
          globalImageCache.incrementError(originalSrcRef.current);
        }

        onError?.(error);
        reject(error);
      };

      img.src = src;
    });
  }, [enableCache, onLoad, onError, state.currentFallbackIndex]);

  // Essayer le prochain fallback
  const tryNextFallback = useCallback(async () => {
    const nextIndex = state.currentFallbackIndex + 1;
    
    if (nextIndex >= fallbackSequenceRef.current.length) {
      // Dernier recours : utiliser une couleur unie
      const colorUrl = createColorDataUrl();
      setState(prev => ({
        ...prev,
        currentSrc: colorUrl,
        isLoading: false,
        hasError: true,
        currentFallbackIndex: nextIndex,
      }));
      return;
    }

    const fallback = fallbackSequenceRef.current[nextIndex];
    
    setState(prev => ({
      ...prev,
      currentFallbackIndex: nextIndex,
      isLoading: true,
    }));

    if (fallback.src) {
      await loadImageWithMetrics(fallback.src);
    } else {
      // Utiliser le placeholder SVG
      const placeholder = getPlaceholderByType(propertyType);
      setState(prev => ({
        ...prev,
        currentSrc: placeholder,
        isLoading: false,
        currentFallbackIndex: nextIndex,
      }));
    }
  }, [state.currentFallbackIndex, loadImageWithMetrics, propertyType]);

  // Réinitialiser et charger une nouvelle image
  const load = useCallback(async (src: string | null | undefined) => {
    const sanitizedSrc = sanitizeImageUrl(src);
    
    setState({
      currentSrc: null,
      isLoading: true,
      hasError: false,
      currentFallbackIndex: -1,
      metrics: null,
      error: null,
    });

    attemptRef.current = 0;

    if (!sanitizedSrc) {
      // Si pas de source valide, utiliser directement le placeholder
      const placeholder = getPlaceholderByType(propertyType);
      setState(prev => ({
        ...prev,
        currentSrc: placeholder,
        isLoading: false,
        currentFallbackIndex: 0,
      }));
      return;
    }

    originalSrcRef.current = sanitizedSrc;

    // Vérifier d'abord le cache
    if (enableCache) {
      const cached = globalImageCache.get(sanitizedSrc);
      if (cached) {
        setState(prev => ({
          ...prev,
          currentSrc: cached,
          isLoading: false,
          currentFallbackIndex: 1, // Indiquer qu'on utilise un fallback
          metrics: {
            loadTime: 0,
            cacheHit: true,
            fallbackUsed: true,
            fallbackType: 'cached',
          },
        }));
        return;
      }
    }

    // Générer la séquence de fallbacks
    generateFallbacks(sanitizedSrc);

    // Essayer de charger l'image originale
    try {
      await loadImageWithMetrics(sanitizedSrc);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Image load failed, trying fallbacks:', error);
      }
      await tryNextFallback();
    }
  }, [enableCache, generateFallbacks, loadImageWithMetrics, tryNextFallback, propertyType]);

  // Réessayer de charger l'image
  const retry = useCallback(async () => {
    attemptRef.current++;
    
    if (attemptRef.current > retryCount) {
      const error = createImageError('network_error', 'Max retry attempts exceeded');
      setState(prev => ({ ...prev, error }));
      onError?.(error);
      return;
    }

    setState(prev => ({
      ...prev,
      isLoading: true,
      hasError: false,
      error: null,
    }));

    const src = originalSrcRef.current || state.currentSrc;
    if (src) {
      try {
        await loadImageWithMetrics(src);
      } catch {
        await tryNextFallback();
      }
    }
  }, [retryCount, loadImageWithMetrics, tryNextFallback, onError, state.currentSrc]);

  // Réinitialiser l'état
  const reset = useCallback(() => {
    setState({
      currentSrc: null,
      isLoading: true,
      hasError: false,
      currentFallbackIndex: -1,
      metrics: null,
      error: null,
    });
    attemptRef.current = 0;
  }, []);

  // Charger l'image initiale
  useEffect(() => {
    load(initialSrc);
  }, [initialSrc, load]);

  // Debug mode
  useEffect(() => {
    if (DEFAULT_IMAGE_CONFIG.enableDebugging && state.metrics) {
      console.log('📊 Image Metrics:', {
        src: initialSrc,
        ...state.metrics,
        fallbackIndex: state.currentFallbackIndex,
      });
    }
  }, [state.metrics, state.currentFallbackIndex, initialSrc]);

  return {
    // État
    src: state.currentSrc,
    isLoading: state.isLoading,
    hasError: state.hasError,
    error: state.error,
    metrics: state.metrics,
    
    // Actions
    load,
    retry,
    reset,
    
    // Informations utiles
    isFallback: state.currentFallbackIndex > 0,
    fallbackType: fallbackSequenceRef.current[state.currentFallbackIndex - 1]?.type,
    attempt: attemptRef.current,
  };
}