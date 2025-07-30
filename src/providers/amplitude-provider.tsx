// Provider Amplitude pour l'analytics immobilier avancé
'use client';

import { useEffect, createContext, useContext } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';

// Variable pour suivre si Amplitude est correctement initialisé
let amplitudeInitialized = false;
let amplitudeAvailable = false;

// Types pour les événements immobiliers
export interface PropertyEventProperties {
  property_id?: string;
  property_type?: 'MAISON' | 'TERRAIN' | 'BUREAU' | 'HANGAR';
  property_price?: number;
  property_surface?: number;
  agent_id?: string;
  user_role?: 'CLIENT' | 'AGENT';
  session_duration?: number;
  page_section?: string;
  engagement_type?: string;
  intent_level?: 'low' | 'medium' | 'high';
  share_method?: string;
  scroll_percentage?: number;
}

// Interface du contexte Amplitude
interface AmplitudeContextType {
  trackPropertyEvent: (eventName: string, properties?: PropertyEventProperties) => void;
  identify: (userId: string, userProperties?: Record<string, any>) => void;
  setUserProperties: (properties: Record<string, any>) => void;
}

const AmplitudeContext = createContext<AmplitudeContextType | null>(null);

// Hook pour utiliser Amplitude
export function useAmplitude() {
  const context = useContext(AmplitudeContext);
  if (!context) {
    throw new Error('useAmplitude doit être utilisé dans AmplitudeProvider');
  }
  return context;
}

// Initialisation d'Amplitude avec gestion d'erreurs
async function initializeAmplitude() {
  const apiKey = process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY;
  
  if (!apiKey) {
    console.warn('⚠️ Clé API Amplitude manquante - mode démo activé');
    amplitudeAvailable = false;
    return false;
  }

  // Vérifier si la clé est valide avant d'initialiser
  try {
    // Import dynamique pour éviter les erreurs au build
    const amplitude = await import('@amplitude/analytics-browser');
    
    // Test rapide pour voir si la clé est valide
    const testResponse = await fetch('https://api.amplitude.com/2/httpapi', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        events: [{
          user_id: 'test',
          event_type: 'test_key_validation',
          time: Date.now(),
        }]
      })
    });

    if (!testResponse.ok && testResponse.status !== 200) {
      console.warn('⚠️ Clé API Amplitude invalide - mode démo activé');
      amplitudeAvailable = false;
      return false;
    }

    // Si la clé est valide, initialiser Amplitude
    amplitude.default.init(apiKey, undefined, {
      // Configuration pour l'immobilier
      defaultTracking: {
        pageViews: false, // Nous gérerons manuellement
        sessions: false, // Désactiver pour éviter les erreurs
        formInteractions: false,
        fileDownloads: false,
      },
      
      // Configuration de la session
      sessionTimeout: 30 * 60 * 1000,
      
      // Configuration des événements
      flushQueueSize: 10,
      flushIntervalMillis: 5000,
      
      // Configuration pour l'Europe (GDPR)
      serverZone: 'EU',
      
      // Configuration avancée
      trackingOptions: {
        ipAddress: false, // Respect de la vie privée
        language: true,
        platform: true,
      },
    });

    console.log('🚀 Amplitude initialisé pour l\'analytics immobilier');
    amplitudeAvailable = true;
    return true;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    console.warn('⚠️ Erreur initialisation Amplitude - mode démo activé:', errorMessage);
    amplitudeAvailable = false;
    return false;
  }
}

// Fonction wrapper pour les appels Amplitude
async function trackAmplitudeEvent(eventType: string, properties: any = {}) {
  if (!amplitudeAvailable) {
    // Mode démo - logger les événements sans les envoyer
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 [Demo] Amplitude Event:', { eventType, properties });
    }
    return;
  }

  try {
    const amplitude = await import('@amplitude/analytics-browser');
    amplitude.default.track(eventType, {
      ...properties,
      timestamp: Date.now(),
    });
  } catch (error) {
    console.warn('⚠️ Erreur tracking Amplitude:', error);
  }
}

// Fonction wrapper pour setUserId
async function setAmplitudeUserId(userId: string) {
  if (!amplitudeAvailable) return;
  
  try {
    const amplitude = await import('@amplitude/analytics-browser');
    amplitude.default.setUserId(userId);
  } catch (error) {
    console.warn('⚠️ Erreur setUserId Amplitude:', error);
  }
}

// Composant pour tracker automatiquement la navigation
function AmplitudePageTracker() {
  const pathname = usePathname();
  const { data: session } = useSession();

  useEffect(() => {
    if (!pathname) return;

    // Propriétés de page spécifiques au real estate
    const pageProperties: Record<string, any> = {
      page_url: pathname,
      user_role: session?.user?.role || 'ANONYMOUS',
      timestamp: Date.now(),
    };

    // Extraire l'ID de propriété si nous sommes sur une page de propriété
    if (pathname.includes('/properties/')) {
      const propertyId = pathname.split('/properties/')[1]?.split('/')[0];
      if (propertyId && propertyId !== 'add') {
        pageProperties.property_id = propertyId;
        pageProperties.page_type = 'property_detail';
        
        // Tracker l'événement de vue de propriété
        trackAmplitudeEvent('Property Viewed', {
          property_id: propertyId,
          user_role: session?.user?.role || 'ANONYMOUS',
          page_url: pathname,
        });
      }
    } else if (pathname.includes('/dashboard')) {
      pageProperties.page_type = 'dashboard';
      if (session?.user?.role === 'AGENT') {
        pageProperties.dashboard_type = 'agent';
      }
    } else if (pathname === '/') {
      pageProperties.page_type = 'homepage';
    } else if (pathname.includes('/properties')) {
      pageProperties.page_type = 'property_list';
    }

    // Tracker la page vue
    trackAmplitudeEvent('Page Viewed', pageProperties);

  }, [pathname, session]);

  return null;
}

// Provider principal
export function AmplitudeProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  // Initialiser Amplitude au montage
  useEffect(() => {
    if (!amplitudeInitialized) {
      initializeAmplitude().then(() => {
        amplitudeInitialized = true;
      });
    }
    
    if (amplitudeAvailable && session?.user) {
      // Identifier l'utilisateur
      setAmplitudeUserId(session.user.id);
    }
  }, [session]);

  // Fonctions du contexte
  const trackPropertyEvent = (eventName: string, properties?: PropertyEventProperties) => {
    trackAmplitudeEvent(eventName, {
      ...properties,
      user_id: session?.user?.id,
      user_role: session?.user?.role || 'ANONYMOUS',
    });
  };

  const identify = (userId: string, userProperties?: Record<string, any>) => {
    setAmplitudeUserId(userId);
  };

  const setUserProperties = (properties: Record<string, any>) => {
    // En mode démo, logger les propriétés
    if (!amplitudeAvailable && process.env.NODE_ENV === 'development') {
      console.log('📊 [Demo] Setting user properties:', properties);
    }
  };

  const contextValue: AmplitudeContextType = {
    trackPropertyEvent,
    identify,
    setUserProperties,
  };

  return (
    <AmplitudeContext.Provider value={contextValue}>
      <AmplitudePageTracker />
      {children}
    </AmplitudeContext.Provider>
  );
}

// Hook spécialisé pour les événements immobiliers
export function useRealEstateTracking() {
  const { trackPropertyEvent } = useAmplitude();
  const { data: session } = useSession();

  return {
    // Événements de session
    trackPropertySessionStart: (propertyId: string, properties?: Partial<PropertyEventProperties>) => {
      trackPropertyEvent('Property Session Started', {
        property_id: propertyId,
        ...properties,
      });
    },

    trackPropertySessionEnd: (propertyId: string, duration: number, properties?: Partial<PropertyEventProperties>) => {
      trackPropertyEvent('Property Session Ended', {
        property_id: propertyId,
        session_duration: duration,
        ...properties,
      });
    },

    // Événements d'engagement
    trackPropertyEngagement: (propertyId: string, engagementType: string, properties?: Partial<PropertyEventProperties>) => {
      trackPropertyEvent('Property Engagement', {
        property_id: propertyId,
        engagement_type: engagementType,
        ...properties,
      });
    },

    // Événements d'intention d'achat
    trackPurchaseIntent: (propertyId: string, intentLevel: 'low' | 'medium' | 'high', properties?: Partial<PropertyEventProperties>) => {
      trackPropertyEvent('Purchase Intent Signal', {
        property_id: propertyId,
        intent_level: intentLevel,
        ...properties,
      });
    },

    // Événements de conversion
    trackVisitRequest: (propertyId: string, properties?: Partial<PropertyEventProperties>) => {
      trackPropertyEvent('Visit Request Submitted', {
        property_id: propertyId,
        ...properties,
      });
    },

    trackPropertyFavorited: (propertyId: string, properties?: Partial<PropertyEventProperties>) => {
      trackPropertyEvent('Property Favorited', {
        property_id: propertyId,
        ...properties,
      });
    },

    // Événements de partage
    trackPropertyShared: (propertyId: string, shareMethod: string, properties?: Partial<PropertyEventProperties>) => {
      trackPropertyEvent('Property Shared', {
        property_id: propertyId,
        share_method: shareMethod,
        ...properties,
      });
    },

    // Événements de scroll
    trackScrollMilestone: (propertyId: string, scrollPercentage: number, properties?: Partial<PropertyEventProperties>) => {
      trackPropertyEvent('Scroll Milestone', {
        property_id: propertyId,
        scroll_percentage: scrollPercentage,
        ...properties,
      });
    },
  };
}

export default AmplitudeProvider;