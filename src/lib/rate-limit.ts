// Configuration du rate limiting pour l'API
import { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Initialiser Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Différentes stratégies de rate limiting
export const rateLimits = {
  // Limite générale: 100 requêtes par 15 minutes
  general: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '15 m'),
    analytics: true,
    prefix: 'ratelimit:general',
  }),
  
  // Limite stricte pour l'authentification: 5 requêtes par minute
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    analytics: true,
    prefix: 'ratelimit:auth',
  }),
  
  // Limite pour les uploads: 10 requêtes par heure
  upload: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 h'),
    analytics: true,
    prefix: 'ratelimit:upload',
  }),
  
  // Limite pour les API analytics: 60 requêtes par minute
  analytics: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'),
    analytics: true,
    prefix: 'ratelimit:analytics',
  }),
  
  // Limite pour les dashboards: 30 requêtes par minute
  dashboard: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'),
    analytics: true,
    prefix: 'ratelimit:dashboard',
  }),
};

// Types pour le rate limiting
export type RateLimitType = keyof typeof rateLimits;

// Interface pour le résultat du rate limiting
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  pending: Promise<void>;
}

// Fonction pour vérifier le rate limiting
export async function checkRateLimit(
  request: NextRequest,
  type: RateLimitType = 'general'
): Promise<RateLimitResult> {
  // Obtenir l'IP du client
  const ip = getClientIP(request);
  
  // Utiliser la stratégie appropriée
  const ratelimit = rateLimits[type];
  
  // Vérifier la limite
  const result = await ratelimit.limit(ip);
  
  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
    pending: result.pending as Promise<void>,
  };
}

// Fonction pour obtenir l'IP du client
function getClientIP(request: NextRequest): string {
  // Essayer différentes sources d'IP
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  const cf = request.headers.get('cf-connecting-ip');
  
  // Priorité: Cloudflare > X-Forwarded-For > X-Real-IP > Remote Address
  if (cf) return cf;
  if (forwarded) {
    // X-Forwarded-For peut contenir plusieurs IPs, prendre la première
    return forwarded.split(',')[0].trim();
  }
  if (real) return real;
  
  // Fallback sur l'adresse distante
  return 'unknown';
}

// Middleware pour appliquer le rate limiting
export async function applyRateLimit(
  request: NextRequest,
  type: RateLimitType = 'general'
): Promise<{ success: boolean; response?: Response; headers?: Record<string, string> }> {
  try {
    const result = await checkRateLimit(request, type);
    
    // Préparer les headers pour la réponse
    const headers: Record<string, string> = {
      'X-RateLimit-Limit': result.limit.toString(),
      'X-RateLimit-Remaining': result.remaining.toString(),
      'X-RateLimit-Reset': result.reset.toString(),
    };
    
    if (!result.success) {
      // Retourner une réponse 429 Too Many Requests
      const response = new Response(
        JSON.stringify({
          error: 'Trop de requêtes',
          message: 'Vous avez dépassé la limite de requêtes autorisées. Veuillez réessayer plus tard.',
          retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
            ...headers,
          },
        }
      );
      
      return { success: false, response, headers };
    }
    
    return { success: true, headers };
  } catch (error) {
    // En cas d'erreur avec Redis, autoriser la requête mais logger l'erreur
    console.error('Rate limiting error:', error);
    return { success: true };
  }
}

// Fonction pour créer un middleware de route avec rate limiting
export function withRateLimit(
  handler: (request: NextRequest, context?: any) => Promise<Response>,
  type: RateLimitType = 'general'
) {
  return async (request: NextRequest, context?: any): Promise<Response> => {
    const rateLimitResult = await applyRateLimit(request, type);
    
    if (!rateLimitResult.success && rateLimitResult.response) {
      return rateLimitResult.response;
    }
    
    const response = await handler(request, context);
    
    // Ajouter les headers de rate limiting à la réponse
    if (rateLimitResult.headers) {
      Object.entries(rateLimitResult.headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }
    
    return response;
  };
}

// Fonctions utilitaires pour différents types de routes
export const rateLimitMiddleware = {
  // Pour les routes d'authentification
  auth: (handler: (request: NextRequest, context?: any) => Promise<Response>) =>
    withRateLimit(handler, 'auth'),
  
  // Pour les routes d'upload
  upload: (handler: (request: NextRequest, context?: any) => Promise<Response>) =>
    withRateLimit(handler, 'upload'),
  
  // Pour les routes analytics
  analytics: (handler: (request: NextRequest, context?: any) => Promise<Response>) =>
    withRateLimit(handler, 'analytics'),
  
  // Pour les routes dashboard
  dashboard: (handler: (request: NextRequest, context?: any) => Promise<Response>) =>
    withRateLimit(handler, 'dashboard'),
  
  // Pour les routes générales
  general: (handler: (request: NextRequest, context?: any) => Promise<Response>) =>
    withRateLimit(handler, 'general'),
};

// Export par défaut pour faciliter l'import
export default rateLimitMiddleware;