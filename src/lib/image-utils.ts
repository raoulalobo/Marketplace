// Utilitaires pour la validation et gestion des images
import { ImageOptions, ImageFallback, ImageError, PropertyType } from '@/types/image';
import { getPlaceholderByType } from '@/components/ui/placeholders';

/**
 * Valide une URL d'image
 */
export const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url || typeof url !== 'string') return false;
  
  // Vérifier si c'est une chaîne vide
  if (url.trim() === '') return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    // Si ce n'est pas une URL absolue, vérifier si c'est un chemin relatif valide
    return /^\/[^\\]*$/.test(url) || /^[^\\]*\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
  }
};

/**
 * Nettoie une URL d'image
 */
export const sanitizeImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  
  const trimmed = url.trim();
  if (trimmed === '') return null;
  
  // Encoder les caractères spéciaux
  try {
    const encoded = encodeURI(trimmed);
    return isValidImageUrl(encoded) ? encoded : null;
  } catch {
    return null;
  }
};

/**
 * Génère une séquence de fallbacks pour une image
 */
export const generateFallbackSequence = (
  originalSrc: string | null | undefined,
  propertyType?: PropertyType,
  customFallbacks?: ImageFallback[]
): ImageFallback[] => {
  const fallbacks: ImageFallback[] = [];

  // Ajouter les fallbacks personnalisés s'ils sont fournis
  if (customFallbacks) {
    fallbacks.push(...customFallbacks);
  }

  // Fallback 1: Version compressée de l'original
  if (originalSrc) {
    fallbacks.push({
      type: 'compressed',
      src: originalSrc.includes('?') 
        ? `${originalSrc}&q=60&w=800` 
        : `${originalSrc}?q=60&w=800`,
      priority: 2,
    });
  }

  // Fallback 2: Version CDN (si applicable)
  if (originalSrc && originalSrc.includes('backblazeb2.com')) {
    fallbacks.push({
      type: 'cdn',
      src: originalSrc.replace('backblazeb2.com', 'cdn.backblazeb2.com'),
      priority: 3,
    });
  }

  // Fallback 3: Placeholder SVG selon le type de propriété
  fallbacks.push({
    type: 'placeholder',
    src: getPlaceholderByType(propertyType),
    priority: 5,
  });

  // Fallback 4: Couleur unie (dernier recours)
  fallbacks.push({
    type: 'color',
    src: null,
    priority: 6,
  });

  // Trier par priorité
  return fallbacks.sort((a, b) => a.priority - b.priority);
};

/**
 * Crée une erreur d'image typée
 */
export const createImageError = (
  type: ImageError['type'],
  message: string,
  src?: string
): ImageError => ({
  type,
  message,
  timestamp: Date.now(),
  src,
});

/**
 * Vérifie si une erreur est une erreur 404
 */
export const is404Error = (event: React.SyntheticEvent<HTMLImageElement, Event>): boolean => {
  const img = event.currentTarget;
  return img.naturalWidth === 0 && img.naturalHeight === 0;
};

/**
 * Extrait le domaine d'une URL
 */
export const extractDomain = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
};

/**
 * Vérifie si une URL est externe
 */
export const isExternalUrl = (url: string): boolean => {
  if (!url) return false;
  
  try {
    const domain = extractDomain(url);
    return domain !== '' && !domain.includes('localhost');
  } catch {
    return false;
  }
};

/**
 * Génère une clé de cache pour une URL
 */
export const generateCacheKey = (src: string): string => {
  return `img_${btoa(src).replace(/[^a-zA-Z0-9]/g, '')}`;
};

/**
 * Détermine si une URL doit être mise en cache
 */
export const shouldCache = (src: string): boolean => {
  return isValidImageUrl(src) && !isExternalUrl(src);
};

/**
 * Crée une data URL pour une couleur de fond
 */
export const createColorDataUrl = (color: string = '#f3f4f6', width = 400, height = 300): string => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="${color}"/>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

/**
 * Formate les métadonnées d'image pour le débogage
 */
export const formatImageMetadata = (src: string, options: ImageOptions): string => {
  return `
Image Metadata:
- Source: ${src || 'null'}
- Alt: ${options.alt}
- Dimensions: ${options.width}x${options.height}
- Quality: ${options.quality || 'default'}
- Priority: ${options.priority ? 'high' : 'normal'}
  `.trim();
};

/**
 * Valide les dimensions d'image
 */
export const validateDimensions = (width?: number, height?: number): boolean => {
  if (width && (width <= 0 || width > 4096)) return false;
  if (height && (height <= 0 || height > 4096)) return false;
  return true;
};

/**
 * Calcule le ratio d'aspect
 */
export const calculateAspectRatio = (width: number, height: number): number => {
  if (height === 0) return 1;
  return width / height;
};

/**
 * Génère des dimensions responsive
 */
export const generateResponsiveDimensions = (
  baseWidth: number,
  baseHeight: number,
  maxWidth: number = 1200
): { width: number; height: number } => {
  const ratio = calculateAspectRatio(baseWidth, baseHeight);
  
  if (baseWidth > maxWidth) {
    return {
      width: maxWidth,
      height: Math.round(maxWidth / ratio),
    };
  }
  
  return { width: baseWidth, height: baseHeight };
};

/**
 * Détermine le type de contenu d'une URL
 */
export const getContentType = (url: string): string => {
  const extension = url.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    default:
      return 'application/octet-stream';
  }
};