// Provider PostHog pour l'analytics avancé
'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';

if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    // Configuration spécifique pour le real estate
    capture_pageview: false, // Nous gérerons manuellement les page views
    capture_pageleave: true, // Tracker la durée des sessions
    session_recording: {
      maskAllInputs: true, // Masquer les inputs sensibles par défaut
      maskInputOptions: {
        password: true,
        email: true,
      },
    },
    autocapture: {
      // Activer l'autocapture pour les clics sur les boutons importants
      dom_event_allowlist: ['click'],
      element_allowlist: ['a', 'button'],
    },
    // Optimisation pour les propriétés immobilières
    opt_out_capturing_by_default: false,
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 PostHog initialisé pour l\'analytics immobilier');
      }
    },
  });
}

// Interface pour les propriétés des événements immobiliers
export interface PropertyEventProperties {
  property_id?: string;
  property_type?: 'MAISON' | 'TERRAIN' | 'BUREAU' | 'HANGAR';
  property_price?: number;
  property_surface?: number;
  agent_id?: string;
  user_role?: 'CLIENT' | 'AGENT';
  session_duration?: number;
  page_section?: string;
}

// Hook pour tracker les événements spécifiques au real estate
export function usePostHogRealEstate() {
  const { data: session } = useSession();

  useEffect(() => {
    if (session?.user) {
      // Identifier l'utilisateur avec ses données
      posthog.identify(session.user.id, {
        email: session.user.email,
        name: session.user.name,
        role: session.user.role || 'CLIENT',
        // Ajouter d'autres propriétés utilisateur si nécessaire
      });
    }
  }, [session]);

  // Fonction pour tracker les événements de propriété
  const trackPropertyEvent = (
    eventName: string, 
    properties?: PropertyEventProperties
  ) => {
    posthog.capture(eventName, {
      ...properties,
      timestamp: Date.now(),
      user_id: session?.user?.id,
      user_role: session?.user?.role || 'ANONYMOUS',
    });
  };

  return {
    trackPropertyEvent,
    posthog,
  };
}

// Composant pour tracker automatiquement la navigation
function PostHogPageTracker() {
  const pathname = usePathname();
  const { data: session } = useSession();

  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname;
      // Récupérer les search params directement depuis window.location
      if (typeof window !== 'undefined' && window.location.search) {
        url = url + window.location.search;
      }

      // Propriétés de page spécifiques au real estate
      const pageProperties: Record<string, any> = {
        $current_url: url,
        user_role: session?.user?.role || 'ANONYMOUS',
      };

      // Extraire l'ID de propriété si nous sommes sur une page de propriété
      if (pathname.includes('/properties/')) {
        const propertyId = pathname.split('/properties/')[1]?.split('/')[0];
        if (propertyId) {
          pageProperties.property_id = propertyId;
          pageProperties.page_type = 'property_detail';
        }
      } else if (pathname.includes('/dashboard')) {
        pageProperties.page_type = 'dashboard';
        if (session?.user?.role === 'AGENT') {
          pageProperties.dashboard_type = 'agent';
        } else {
          pageProperties.dashboard_type = 'client';
        }
      } else if (pathname === '/') {
        pageProperties.page_type = 'homepage';
      } else if (pathname.includes('/properties')) {
        pageProperties.page_type = 'property_list';
      }

      posthog.capture('$pageview', pageProperties);
    }
  }, [pathname, session]);

  return null;
}

// Provider principal
export function PostHogProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider client={posthog}>
      <PostHogPageTracker />
      {children}
    </PostHogProvider>
  );
}

export default PostHogProviderWrapper;