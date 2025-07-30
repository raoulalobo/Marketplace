// Types et interfaces pour la gestion des images
export interface ImageOptions {
  src: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  priority?: boolean;
  sizes?: string;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

export interface ImageFallback {
  type: 'original' | 'compressed' | 'cdn' | 'local' | 'placeholder' | 'color';
  src: string | null;
  priority: number;
}

export interface ImageConfig {
  enableCache: boolean;
  enableDebugging: boolean;
  defaultQuality: number;
  fallbackStrategy: 'sequential' | 'parallel';
  maxFallbackAttempts: number;
  cacheTTL: number; // en secondes
}

export interface ImageError {
  type: 'empty_src' | 'invalid_url' | 'network_error' | 'not_found' | 'cors_error';
  message: string;
  timestamp: number;
  src?: string;
}

export interface ImageMetrics {
  loadTime: number;
  cacheHit: boolean;
  fallbackUsed: boolean;
  fallbackType?: string;
  error?: ImageError;
}

// Contexte pour le Image Provider
export interface ImageContextType {
  config: ImageConfig;
  metrics: Map<string, ImageMetrics>;
  errors: ImageError[];
  cache: Map<string, { src: string; timestamp: number }>;
  
  // Actions
  registerError: (error: ImageError) => void;
  registerMetrics: (src: string, metrics: ImageMetrics) => void;
  getFromCache: (src: string) => string | null;
  addToCache: (originalSrc: string, fallbackSrc: string) => void;
  clearCache: () => void;
}

// Types de placeholders
export type PlaceholderType = 'property' | 'avatar' | 'banner' | 'thumbnail' | 'gallery';
export type PropertyType = 'MAISON' | 'TERRAIN' | 'BUREAU' | 'HANGAR' | 'AUTRE';

// Interface pour le hook useImage
export interface UseImageOptions {
  fallbacks?: ImageFallback[];
  placeholderType?: PlaceholderType;
  propertyType?: PropertyType;
  enableCache?: boolean;
  retryCount?: number;
  onError?: (error: ImageError) => void;
  onLoad?: (metrics: ImageMetrics) => void;
}

// Interface pour le composant SmartImage
export interface SmartImageProps extends Omit<ImageOptions, 'src'> {
  src: string | null | undefined;
  className?: string;
  style?: React.CSSProperties;
  fill?: boolean;
  loading?: 'lazy' | 'eager';
  fetchPriority?: 'high' | 'low' | 'auto';
  decoding?: 'async' | 'sync';
  onLoad?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  onError?: (event: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

// Configuration par défaut
export const DEFAULT_IMAGE_CONFIG: ImageConfig = {
  enableCache: true,
  enableDebugging: process.env.NODE_ENV === 'development',
  defaultQuality: 75,
  fallbackStrategy: 'sequential',
  maxFallbackAttempts: 3,
  cacheTTL: 3600, // 1 heure
};

// Priorités des fallbacks
export const FALLBACK_PRIORITIES = {
  original: 1,
  compressed: 2,
  cdn: 3,
  local: 4,
  placeholder: 5,
  color: 6,
} as const;

// Messages d'erreur localisés
export const ERROR_MESSAGES = {
  empty_src: 'L\'URL de l\'image est vide',
  invalid_url: 'L\'URL de l\'image est invalide',
  network_error: 'Erreur réseau lors du chargement de l\'image',
  not_found: 'Image non trouvée (404)',
  cors_error: 'Erreur CORS lors du chargement de l\'image',
} as const;