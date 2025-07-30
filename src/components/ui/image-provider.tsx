// Image Provider global pour la gestion centralisée des images
'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { ImageContextType, ImageConfig, ImageError, ImageMetrics } from '@/types/image';
import { DEFAULT_IMAGE_CONFIG } from '@/types/image';
import { globalImageCache } from '@/lib/image-cache';

// Action types pour le reducer
type ImageAction =
  | { type: 'REGISTER_ERROR'; payload: ImageError }
  | { type: 'REGISTER_METRICS'; payload: { src: string; metrics: ImageMetrics } }
  | { type: 'CACHE_HIT'; payload: string }
  | { type: 'CACHE_MISS'; payload: string }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'CLEAR_CACHE' }
  | { type: 'UPDATE_CONFIG'; payload: Partial<ImageConfig> };

// État initial du provider
interface ImageState {
  config: ImageConfig;
  metrics: Map<string, ImageMetrics>;
  errors: ImageError[];
  cacheStats: {
    hits: number;
    misses: number;
  };
}

// Action handlers
const imageReducer = (state: ImageState, action: ImageAction): ImageState => {
  switch (action.type) {
    case 'REGISTER_ERROR':
      return {
        ...state,
        errors: [...state.errors, action.payload].slice(-100), // Garder les 100 dernières erreurs
      };

    case 'REGISTER_METRICS':
      return {
        ...state,
        metrics: new Map(state.metrics).set(action.payload.src, action.payload.metrics),
      };

    case 'CACHE_HIT':
      return {
        ...state,
        cacheStats: {
          ...state.cacheStats,
          hits: state.cacheStats.hits + 1,
        },
      };

    case 'CACHE_MISS':
      return {
        ...state,
        cacheStats: {
          ...state.cacheStats,
          misses: state.cacheStats.misses + 1,
        },
      };

    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: [],
      };

    case 'CLEAR_CACHE':
      return {
        ...state,
        metrics: new Map(),
        cacheStats: {
          hits: 0,
          misses: 0,
        },
      };

    case 'UPDATE_CONFIG':
      return {
        ...state,
        config: { ...state.config, ...action.payload },
      };

    default:
      return state;
  }
};

// Contexte par défaut
const defaultImageContext: ImageContextType = {
  config: DEFAULT_IMAGE_CONFIG,
  metrics: new Map(),
  errors: [],
  cache: globalImageCache,
  registerError: () => {},
  registerMetrics: () => {},
  getFromCache: () => null,
  addToCache: () => {},
  clearCache: () => {},
};

// Création du contexte
const ImageContext = createContext<ImageContextType>(defaultImageContext);

interface ImageProviderProps {
  children: ReactNode;
  config?: Partial<ImageConfig>;
  enableDebugging?: boolean;
}

export function ImageProvider({ children, config = {}, enableDebugging = false }: ImageProviderProps) {
  // État initial
  const [state, dispatch] = useReducer(imageReducer, {
    config: { ...DEFAULT_IMAGE_CONFIG, ...config },
    metrics: new Map(),
    errors: [],
    cacheStats: {
      hits: 0,
      misses: 0,
    },
  });

  // Effet pour le debugging
  useEffect(() => {
    if (enableDebugging || state.config.enableDebugging) {
      console.group('🖼️ Image Provider Debug');
      console.log('Config:', state.config);
      console.log('Cache Stats:', state.cacheStats);
      console.log('Errors:', state.errors.length);
      console.log('Metrics Entries:', state.metrics.size);
      console.groupEnd();
    }
  }, [state, enableDebugging]);

  // Effet pour le monitoring périodique
  useEffect(() => {
    if (!state.config.enableDebugging) return;

    const interval = setInterval(() => {
      const cacheStats = globalImageCache.getStats();
      const hitRate = globalImageCache.getHitRate();
      
      console.log('📊 Image Cache Stats:', {
        ...cacheStats,
        hitRate: `${hitRate.toFixed(2)}%`,
      });
    }, 30000); // Toutes les 30 secondes

    return () => clearInterval(interval);
  }, [state.config.enableDebugging]);

  // Actions du contexte
  const registerError = (error: ImageError) => {
    dispatch({ type: 'REGISTER_ERROR', payload: error });
    
    if (state.config.enableDebugging) {
      console.warn('🖼️ Image Error:', error);
    }
  };

  const registerMetrics = (src: string, metrics: ImageMetrics) => {
    dispatch({ type: 'REGISTER_METRICS', payload: { src, metrics } });
    
    if (state.config.enableDebugging) {
      console.log('📊 Image Metrics:', { src, ...metrics });
    }
  };

  const getFromCache = (src: string): string | null => {
    const cached = globalImageCache.get(src);
    if (cached) {
      dispatch({ type: 'CACHE_HIT', payload: src });
      return cached;
    } else {
      dispatch({ type: 'CACHE_MISS', payload: src });
      return null;
    }
  };

  const addToCache = (originalSrc: string, fallbackSrc: string) => {
    globalImageCache.set(originalSrc, fallbackSrc);
    
    if (state.config.enableDebugging) {
      console.log('💾 Image Cached:', { original: originalSrc, fallback: fallbackSrc });
    }
  };

  const clearCache = () => {
    globalImageCache.clear();
    dispatch({ type: 'CLEAR_CACHE' });
    
    if (state.config.enableDebugging) {
      console.log('🧹 Image Cache Cleared');
    }
  };

  // Valeur du contexte
  const contextValue: ImageContextType = {
    config: state.config,
    metrics: state.metrics,
    errors: state.errors,
    cache: globalImageCache,
    registerError,
    registerMetrics,
    getFromCache,
    addToCache,
    clearCache,
  };

  return (
    <ImageContext.Provider value={contextValue}>
      {children}
    </ImageContext.Provider>
  );
}

// Hook pour utiliser le contexte
export function useImageContext() {
  const context = useContext(ImageContext);
  
  if (context === defaultImageContext) {
    throw new Error('useImageContext must be used within an ImageProvider');
  }
  
  return context;
}

// Hook de monitoring pour les composants image
export function useImageMonitoring(src: string | null) {
  const { registerError, registerMetrics, config } = useImageContext();

  const handleError = useCallback((error: ImageError) => {
    registerError(error);
  }, [registerError]);

  const handleLoad = useCallback((metrics: ImageMetrics) => {
    if (src) {
      registerMetrics(src, metrics);
    }
  }, [src, registerMetrics]);

  return {
    handleError,
    handleLoad,
    enableDebugging: config.enableDebugging,
  };
}

// Composant de débogage pour le développement
export function ImageDebugger() {
  const { config, metrics, errors, cacheStats, cache } = useImageContext();
  
  if (!config.enableDebugging) {
    return null;
  }

  const cacheDebug = cache.exportDebug();
  const hitRate = cacheStats.hits + cacheStats.misses > 0 
    ? (cacheStats.hits / (cacheStats.hits + cacheStats.misses) * 100).toFixed(2)
    : '0';

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono max-w-sm z-50">
      <div className="font-bold mb-2">🖼️ Image Debugger</div>
      <div>Cache Hit Rate: {hitRate}%</div>
      <div>Cache Entries: {cacheDebug.entries.length}</div>
      <div>Errors: {errors.length}</div>
      <div>Metrics: {metrics.size}</div>
      <button
        onClick={() => cache.clear()}
        className="mt-2 px-2 py-1 bg-red-600 rounded text-xs"
      >
        Clear Cache
      </button>
    </div>
  );
}