// Hook PostHog pour tracker le temps et les interactions sur une propriété
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { usePostHog } from 'posthog-js/react';
import { useSession } from 'next-auth/react';

interface UsePostHogPropertyTrackingOptions {
  propertyId: string;
  enabled?: boolean; // Permettre de désactiver le tracking
  heartbeatInterval?: number; // Intervalle en secondes (défaut: 15s)
  onError?: (error: Error) => void;
}

interface PropertyTrackingState {
  isTracking: boolean;
  timeSpent: number; // en secondes
  activeTime: number; // temps avec onglet actif
  scrollDepth: number; // profondeur de scroll (0-100%)
  sessionId: string | null;
}

export function usePostHogPropertyTracking({
  propertyId,
  enabled = true,
  heartbeatInterval = 15,
  onError
}: UsePostHogPropertyTrackingOptions) {
  const posthog = usePostHog();
  const { data: session } = useSession();
  
  // État du tracking
  const [state, setState] = useState<PropertyTrackingState>({
    isTracking: false,
    timeSpent: 0,
    activeTime: 0,
    scrollDepth: 0,
    sessionId: null
  });

  // Références pour les timers et état interne
  const startTimeRef = useRef<number>(0);
  const lastActiveTimeRef = useRef<number>(0);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPageVisibleRef = useRef<boolean>(true);
  const maxScrollRef = useRef<number>(0);
  const sessionIdRef = useRef<string | null>(null);

  // Générer un ID de session unique
  const generateSessionId = useCallback(() => {
    return `posthog_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Fonction pour calculer la profondeur de scroll
  const calculateScrollDepth = useCallback(() => {
    const scrollTop = window.pageYOffset;
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = documentHeight > 0 ? Math.round((scrollTop / documentHeight) * 100) : 0;
    
    maxScrollRef.current = Math.max(maxScrollRef.current, scrollPercent);
    return maxScrollRef.current;
  }, []);

  // Fonction pour démarrer le tracking
  const startTracking = useCallback(async () => {
    if (!enabled || state.isTracking || !posthog) return;

    try {
      const sessionId = generateSessionId();
      sessionIdRef.current = sessionId;
      startTimeRef.current = Date.now();
      lastActiveTimeRef.current = Date.now();
      
      // Événement PostHog de début de session
      posthog.capture('property_session_start', {
        property_id: propertyId,
        session_id: sessionId,
        user_agent: navigator.userAgent,
        user_id: session?.user?.id,
        user_role: session?.user?.role || 'ANONYMOUS',
        timestamp: startTimeRef.current,
      });

      setState(prev => ({
        ...prev,
        isTracking: true,
        sessionId
      }));

    } catch (error) {
      console.error('Erreur lors du démarrage du tracking PostHog:', error);
      onError?.(error as Error);
    }
  }, [enabled, state.isTracking, posthog, propertyId, generateSessionId, session, onError]);

  // Fonction pour envoyer un heartbeat
  const sendHeartbeat = useCallback(async () => {
    if (!sessionIdRef.current || !state.isTracking || !posthog) return;

    try {
      const now = Date.now();
      const currentActiveTime = isPageVisibleRef.current ? 
        Math.round((now - lastActiveTimeRef.current) / 1000) : 0;
      
      const scrollDepth = calculateScrollDepth();
      const totalActiveTime = state.activeTime + currentActiveTime;

      // Événement PostHog de heartbeat
      posthog.capture('property_session_heartbeat', {
        property_id: propertyId,
        session_id: sessionIdRef.current,
        active_time: totalActiveTime,
        scroll_depth: scrollDepth,
        user_id: session?.user?.id,
        timestamp: now,
      });

      // Mettre à jour l'état local
      setState(prev => ({
        ...prev,
        activeTime: totalActiveTime,
        scrollDepth
      }));

      lastActiveTimeRef.current = now;
    } catch (error) {
      console.error('Erreur lors du heartbeat PostHog:', error);
    }
  }, [sessionIdRef.current, state.isTracking, state.activeTime, propertyId, calculateScrollDepth, posthog, session]);

  // Fonction pour terminer le tracking
  const endTracking = useCallback(async () => {
    if (!sessionIdRef.current || !state.isTracking || !posthog) return;

    try {
      const now = Date.now();
      const totalTime = Math.round((now - startTimeRef.current) / 1000);
      const finalActiveTime = state.activeTime + (isPageVisibleRef.current ? 
        Math.round((now - lastActiveTimeRef.current) / 1000) : 0);
      const finalScrollDepth = calculateScrollDepth();

      // Arrêter le heartbeat
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }

      // Événement PostHog de fin de session
      posthog.capture('property_session_end', {
        property_id: propertyId,
        session_id: sessionIdRef.current,
        total_time: totalTime,
        active_time: finalActiveTime,
        scroll_depth: finalScrollDepth,
        user_id: session?.user?.id,
        timestamp: now,
      });

      setState(prev => ({
        ...prev,
        isTracking: false,
        timeSpent: totalTime,
        activeTime: finalActiveTime,
        scrollDepth: finalScrollDepth
      }));

      sessionIdRef.current = null;
    } catch (error) {
      console.error('Erreur lors de la fin du tracking PostHog:', error);
      onError?.(error as Error);
    }
  }, [sessionIdRef.current, state.isTracking, state.activeTime, propertyId, calculateScrollDepth, posthog, session, onError]);

  // Gestionnaire de visibilité de la page
  const handleVisibilityChange = useCallback(() => {
    const isVisible = !document.hidden;
    const now = Date.now();

    if (isVisible && !isPageVisibleRef.current) {
      // Page redevient visible
      lastActiveTimeRef.current = now;
      posthog?.capture('property_page_visible', {
        property_id: propertyId,
        session_id: sessionIdRef.current,
        timestamp: now,
      });
    } else if (!isVisible && isPageVisibleRef.current) {
      // Page devient cachée
      const activeTime = Math.round((now - lastActiveTimeRef.current) / 1000);
      setState(prev => ({
        ...prev,
        activeTime: prev.activeTime + activeTime
      }));
      posthog?.capture('property_page_hidden', {
        property_id: propertyId,
        session_id: sessionIdRef.current,
        active_time_added: activeTime,
        timestamp: now,
      });
    }

    isPageVisibleRef.current = isVisible;
  }, [propertyId, posthog]);

  // Gestionnaire de scroll avancé avec métriques enrichies
  const handleScroll = useCallback(() => {
    const scrollDepth = calculateScrollDepth();
    const now = Date.now();
    
    // Capturer des événements de scroll significatifs
    if (scrollDepth > 25 && !sessionStorage.getItem(`scroll_25_${sessionIdRef.current}`)) {
      sessionStorage.setItem(`scroll_25_${sessionIdRef.current}`, 'true');
      posthog?.capture('property_scroll_milestone', {
        property_id: propertyId,
        session_id: sessionIdRef.current,
        milestone: '25%',
        time_to_milestone: Math.round((now - startTimeRef.current) / 1000),
        timestamp: now,
      });
    }
    
    if (scrollDepth > 50 && !sessionStorage.getItem(`scroll_50_${sessionIdRef.current}`)) {
      sessionStorage.setItem(`scroll_50_${sessionIdRef.current}`, 'true');
      posthog?.capture('property_scroll_milestone', {
        property_id: propertyId,
        session_id: sessionIdRef.current,
        milestone: '50%',
        time_to_milestone: Math.round((now - startTimeRef.current) / 1000),
        timestamp: now,
      });
    }
    
    if (scrollDepth > 75 && !sessionStorage.getItem(`scroll_75_${sessionIdRef.current}`)) {
      sessionStorage.setItem(`scroll_75_${sessionIdRef.current}`, 'true');
      posthog?.capture('property_scroll_milestone', {
        property_id: propertyId,
        session_id: sessionIdRef.current,
        milestone: '75%',
        time_to_milestone: Math.round((now - startTimeRef.current) / 1000),
        timestamp: now,
      });
    }
    
    if (scrollDepth > 90 && !sessionStorage.getItem(`scroll_90_${sessionIdRef.current}`)) {
      sessionStorage.setItem(`scroll_90_${sessionIdRef.current}`, 'true');
      posthog?.capture('property_scroll_complete', {
        property_id: propertyId,
        session_id: sessionIdRef.current,
        completion_time: Math.round((now - startTimeRef.current) / 1000),
        final_scroll_depth: scrollDepth,
        timestamp: now,
      });
    }

    setState(prev => ({
      ...prev,
      scrollDepth
    }));
  }, [calculateScrollDepth, propertyId, posthog]);

  // Gestionnaire de beforeunload (fermeture de page)
  const handleBeforeUnload = useCallback(() => {
    if (state.isTracking && posthog && sessionIdRef.current) {
      const now = Date.now();
      const totalTime = Math.round((now - startTimeRef.current) / 1000);
      const finalActiveTime = state.activeTime + (isPageVisibleRef.current ? 
        Math.round((now - lastActiveTimeRef.current) / 1000) : 0);
      
      // Utiliser sendBeacon pour un envoi fiable même à la fermeture
      // PostHog gère automatiquement le sendBeacon en interne
      posthog.capture('property_session_end', {
        property_id: propertyId,
        session_id: sessionIdRef.current,
        total_time: totalTime,
        active_time: finalActiveTime,
        scroll_depth: maxScrollRef.current,
        timestamp: now,
        ended_by: 'page_unload'
      });
    }
  }, [state.isTracking, state.activeTime, propertyId, posthog]);

  // Effet principal pour démarrer/arrêter le tracking
  useEffect(() => {
    if (enabled && posthog) {
      startTracking();
    }

    return () => {
      if (state.isTracking) {
        endTracking();
      }
    };
  }, [enabled, posthog]);

  // Effet pour configurer les event listeners
  useEffect(() => {
    if (!state.isTracking) return;

    // Démarrer le heartbeat
    heartbeatIntervalRef.current = setInterval(sendHeartbeat, heartbeatInterval * 1000);

    // Event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Nettoyage
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [state.isTracking, sendHeartbeat, heartbeatInterval, handleVisibilityChange, handleScroll, handleBeforeUnload]);

  // Fonction pour ajouter des événements personnalisés enrichis
  const trackEvent = useCallback((type: string, data?: any) => {
    if (!posthog) return;
    
    const enrichedData = {
      property_id: propertyId,
      session_id: sessionIdRef.current,
      user_id: session?.user?.id,
      user_role: session?.user?.role || 'ANONYMOUS',
      session_duration: Math.round((Date.now() - startTimeRef.current) / 1000),
      current_scroll_depth: maxScrollRef.current,
      timestamp: Date.now(),
      ...data
    };
    
    posthog.capture(`property_${type}`, enrichedData);
  }, [posthog, propertyId, session]);

  // Fonctions d'engagement spécialisées
  const trackEngagement = useCallback((engagementType: string, elementData?: any) => {
    if (!posthog) return;
    
    const engagementData = {
      property_id: propertyId,
      session_id: sessionIdRef.current,
      engagement_type: engagementType,
      time_before_engagement: Math.round((Date.now() - startTimeRef.current) / 1000),
      scroll_depth_at_engagement: calculateScrollDepth(),
      device_type: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop',
      timestamp: Date.now(),
      ...elementData
    };
    
    posthog.capture('property_engagement', engagementData);
  }, [posthog, propertyId, calculateScrollDepth]);

  // Tracking des éléments clés de la page
  const trackElementInteraction = useCallback((element: string, action: string, additionalData?: any) => {
    trackEngagement('element_interaction', {
      element,
      action,
      ...additionalData
    });
  }, [trackEngagement]);

  // Tracking des intentions d'achat
  const trackPurchaseIntent = useCallback((intentLevel: 'low' | 'medium' | 'high', trigger: string) => {
    posthog?.capture('property_purchase_intent', {
      property_id: propertyId,
      session_id: sessionIdRef.current,
      intent_level: intentLevel,
      trigger,
      session_duration_at_intent: Math.round((Date.now() - startTimeRef.current) / 1000),
      scroll_depth_at_intent: calculateScrollDepth(),
      timestamp: Date.now(),
    });
  }, [posthog, propertyId, calculateScrollDepth]);

  return {
    ...state,
    trackEvent,
    trackEngagement,
    trackElementInteraction,
    trackPurchaseIntent,
    startTracking,
    endTracking
  };
}