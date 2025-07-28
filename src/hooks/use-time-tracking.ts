// Hook React pour tracker le temps passé sur une propriété
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface TimeTrackingEvent {
  type: string;
  timestamp: number;
  data?: any;
}

interface UseTimeTrackingOptions {
  propertyId: string;
  enabled?: boolean; // Permettre de désactiver le tracking
  heartbeatInterval?: number; // Intervalle en secondes (défaut: 15s)
  onError?: (error: Error) => void;
}

interface TimeTrackingState {
  isTracking: boolean;
  timeSpent: number; // en secondes
  activeTime: number; // temps avec onglet actif
  scrollDepth: number; // profondeur de scroll (0-100%)
  sessionId: string | null;
}

export function useTimeTracking({
  propertyId,
  enabled = true,
  heartbeatInterval = 15,
  onError
}: UseTimeTrackingOptions) {
  const router = useRouter();
  
  // État du tracking
  const [state, setState] = useState<TimeTrackingState>({
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
  const eventsRef = useRef<TimeTrackingEvent[]>([]);
  const isPageVisibleRef = useRef<boolean>(true);
  const maxScrollRef = useRef<number>(0);

  // Générer un ID de session unique
  const generateSessionId = useCallback(() => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Fonction pour calculer la profondeur de scroll
  const calculateScrollDepth = useCallback(() => {
    const scrollTop = window.pageYOffset;
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = documentHeight > 0 ? Math.round((scrollTop / documentHeight) * 100) : 0;
    
    maxScrollRef.current = Math.max(maxScrollRef.current, scrollPercent);
    return maxScrollRef.current;
  }, []);

  // Ajouter un événement de tracking
  const addEvent = useCallback((type: string, data?: any) => {
    eventsRef.current.push({
      type,
      timestamp: Date.now(),
      data
    });
  }, []);

  // Fonction pour démarrer le tracking
  const startTracking = useCallback(async () => {
    if (!enabled || state.isTracking) return;

    try {
      const sessionId = generateSessionId();
      startTimeRef.current = Date.now();
      lastActiveTimeRef.current = Date.now();
      
      // Appel API pour démarrer la session
      const response = await fetch(`/api/properties/${propertyId}/track-time`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          userAgent: navigator.userAgent
        })
      });

      if (response.ok) {
        setState(prev => ({
          ...prev,
          isTracking: true,
          sessionId
        }));
        
        addEvent('session_start');
      }
    } catch (error) {
      console.error('Erreur lors du démarrage du tracking:', error);
      onError?.(error as Error);
    }
  }, [enabled, state.isTracking, generateSessionId, propertyId, addEvent, onError]);

  // Fonction pour envoyer un heartbeat
  const sendHeartbeat = useCallback(async () => {
    if (!state.sessionId || !state.isTracking) return;

    try {
      const now = Date.now();
      const currentActiveTime = isPageVisibleRef.current ? 
        Math.round((now - lastActiveTimeRef.current) / 1000) : 0;
      
      const scrollDepth = calculateScrollDepth();

      await fetch(`/api/properties/${propertyId}/track-time`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: state.sessionId,
          activeTime: state.activeTime + currentActiveTime,
          scrollDepth,
          events: eventsRef.current.slice(-10) // Envoyer seulement les 10 derniers événements
        })
      });

      // Mettre à jour l'état local
      setState(prev => ({
        ...prev,
        activeTime: prev.activeTime + currentActiveTime,
        scrollDepth
      }));

      lastActiveTimeRef.current = now;
      eventsRef.current = []; // Vider les événements après envoi
    } catch (error) {
      console.error('Erreur lors du heartbeat:', error);
    }
  }, [state.sessionId, state.isTracking, state.activeTime, propertyId, calculateScrollDepth]);

  // Fonction pour terminer le tracking
  const endTracking = useCallback(async () => {
    if (!state.sessionId || !state.isTracking) return;

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

      // Appel API pour terminer la session
      await fetch(
        `/api/properties/${propertyId}/track-time?sessionId=${state.sessionId}&timeSpent=${totalTime}&activeTime=${finalActiveTime}&scrollDepth=${finalScrollDepth}`,
        {
          method: 'DELETE'
        }
      );

      setState(prev => ({
        ...prev,
        isTracking: false,
        timeSpent: totalTime,
        activeTime: finalActiveTime,
        scrollDepth: finalScrollDepth
      }));

      addEvent('session_end', { totalTime, activeTime: finalActiveTime, scrollDepth: finalScrollDepth });
    } catch (error) {
      console.error('Erreur lors de la fin du tracking:', error);
      onError?.(error as Error);
    }
  }, [state.sessionId, state.isTracking, state.activeTime, propertyId, calculateScrollDepth, addEvent, onError]);

  // Gestionnaire de visibilité de la page
  const handleVisibilityChange = useCallback(() => {
    const isVisible = !document.hidden;
    const now = Date.now();

    if (isVisible && !isPageVisibleRef.current) {
      // Page redevient visible
      lastActiveTimeRef.current = now;
      addEvent('page_visible');
    } else if (!isVisible && isPageVisibleRef.current) {
      // Page devient cachée
      const activeTime = Math.round((now - lastActiveTimeRef.current) / 1000);
      setState(prev => ({
        ...prev,
        activeTime: prev.activeTime + activeTime
      }));
      addEvent('page_hidden', { activeTimeAdded: activeTime });
    }

    isPageVisibleRef.current = isVisible;
  }, [addEvent]);

  // Gestionnaire de scroll
  const handleScroll = useCallback(() => {
    const scrollDepth = calculateScrollDepth();
    setState(prev => ({
      ...prev,
      scrollDepth
    }));
    addEvent('scroll', { depth: scrollDepth });
  }, [calculateScrollDepth, addEvent]);

  // Gestionnaire de beforeunload (fermeture de page)
  const handleBeforeUnload = useCallback(() => {
    if (state.isTracking) {
      // Utiliser sendBeacon pour un envoi fiable même à la fermeture
      const now = Date.now();
      const totalTime = Math.round((now - startTimeRef.current) / 1000);
      const finalActiveTime = state.activeTime + (isPageVisibleRef.current ? 
        Math.round((now - lastActiveTimeRef.current) / 1000) : 0);
      
      navigator.sendBeacon(
        `/api/properties/${propertyId}/track-time?sessionId=${state.sessionId}&timeSpent=${totalTime}&activeTime=${finalActiveTime}&scrollDepth=${maxScrollRef.current}`,
        new Blob([], { type: 'application/json' })
      );
    }
  }, [state.isTracking, state.sessionId, state.activeTime, propertyId]);

  // Effet principal pour démarrer/arrêter le tracking
  useEffect(() => {
    if (enabled) {
      startTracking();
    }

    return () => {
      if (state.isTracking) {
        endTracking();
      }
    };
  }, [enabled]);

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

  // Fonction pour ajouter des événements personnalisés
  const trackEvent = useCallback((type: string, data?: any) => {
    addEvent(type, data);
  }, [addEvent]);

  return {
    ...state,
    trackEvent,
    startTracking,
    endTracking
  };
}