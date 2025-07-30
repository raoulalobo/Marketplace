// Système de cache pour les images avec invalidation automatique
import { generateCacheKey, shouldCache, isValidImageUrl } from './image-utils';

interface CacheEntry {
  fallbackSrc: string;
  timestamp: number;
  accessCount: number;
  errorCount: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
}

export class ImageCache {
  private cache: Map<string, CacheEntry>;
  private stats: CacheStats;
  private ttl: number; // Time to live en secondes
  private maxSize: number; // Nombre maximum d'entrées

  constructor(ttl: number = 3600, maxSize: number = 1000) {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
    };
    this.ttl = ttl;
    this.maxSize = maxSize;
  }

  /**
   * Récupère une entrée du cache
   */
  get(originalSrc: string): string | null {
    const key = generateCacheKey(originalSrc);
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Vérifier si l'entrée est expirée
    if (Date.now() - entry.timestamp > this.ttl * 1000) {
      this.cache.delete(key);
      this.stats.evictions++;
      this.stats.size--;
      this.stats.misses++;
      return null;
    }

    // Mettre à jour les statistiques d'accès
    entry.accessCount++;
    entry.timestamp = Date.now();
    this.stats.hits++;

    return entry.fallbackSrc;
  }

  /**
   * Ajoute une entrée au cache
   */
  set(originalSrc: string, fallbackSrc: string): void {
    // Ne pas mettre en cache les URLs invalides
    if (!shouldCache(originalSrc) || !isValidImageUrl(fallbackSrc)) {
      return;
    }

    const key = generateCacheKey(originalSrc);
    
    // Si le cache est plein, supprimer l'entrée la moins utilisée
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed();
    }

    this.cache.set(key, {
      fallbackSrc,
      timestamp: Date.now(),
      accessCount: 1,
      errorCount: 0,
    });

    this.stats.size++;
  }

  /**
   * Met à jour le compteur d'erreurs pour une entrée
   */
  incrementError(originalSrc: string): void {
    const key = generateCacheKey(originalSrc);
    const entry = this.cache.get(key);
    
    if (entry) {
      entry.errorCount++;
      
      // Si trop d'erreurs, supprimer l'entrée
      if (entry.errorCount >= 3) {
        this.cache.delete(key);
        this.stats.size--;
        this.stats.evictions++;
      }
    }
  }

  /**
   * Supprime l'entrée la moins utilisée
   */
  private evictLeastUsed(): void {
    let leastUsedKey: string | null = null;
    let leastUsedAccess = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount < leastUsedAccess) {
        leastUsedAccess = entry.accessCount;
        leastUsedKey = key;
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey);
      this.stats.evictions++;
      this.stats.size--;
    }
  }

  /**
   * Nettoie les entrées expirées
   */
  cleanup(): number {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl * 1000) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => {
      this.cache.delete(key);
      this.stats.evictions++;
    });

    this.stats.size = this.cache.size;
    return expiredKeys.length;
  }

  /**
   * Vide complètement le cache
   */
  clear(): void {
    this.cache.clear();
    this.stats.size = 0;
  }

  /**
   * Récupère les statistiques du cache
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Récupère toutes les entrées du cache
   */
  getEntries(): Array<[string, CacheEntry]> {
    return Array.from(this.cache.entries());
  }

  /**
   * Calcule le taux de réussite du cache
   */
  getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    return total === 0 ? 0 : (this.stats.hits / total) * 100;
  }

  /**
   * Exporte l'état du cache pour le débogage
   */
  exportDebug(): {
    stats: CacheStats;
    hitRate: number;
    entries: Array<{
      key: string;
      fallbackSrc: string;
      age: number;
      accessCount: number;
      errorCount: number;
    }>;
  } {
    const now = Date.now();
    
    return {
      stats: this.stats,
      hitRate: this.getHitRate(),
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        fallbackSrc: entry.fallbackSrc,
        age: now - entry.timestamp,
        accessCount: entry.accessCount,
        errorCount: entry.errorCount,
      })),
    };
  }
}

// Instance globale du cache
export const globalImageCache = new ImageCache();

// Nettoyage périodique du cache (toutes les 5 minutes)
if (typeof window !== 'undefined') {
  setInterval(() => {
    const cleaned = globalImageCache.cleanup();
    if (cleaned > 0 && process.env.NODE_ENV === 'development') {
      console.log(`🧹 Image cache cleaned: ${cleaned} expired entries`);
    }
  }, 5 * 60 * 1000);
}