// Provider PostHog pour le tracking analytics
'use client';

import { PostHogProvider as PHProvider } from 'posthog-js/react';
import posthog from 'posthog-js';
import { useSession, signOut } from 'next-auth/react';
import { useEffect } from 'react';

// Options de configuration PostHog
const posthogOptions = {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
  ui_host: 'https://us.i.posthog.com',
  capture_pageview: false, // Nous gérons les pageviews manuellement
  capture_pageleave: true,
  advanced_disable_decide: false,
  autocapture: {
    dom_event_allowlist: ['click', 'submit'],
    element_allowlist: ['a', 'button', 'form'],
    css_selector_allowlist: ['[data-ph-capture]'],
  },
  disable_session_recording: false,
  enable_recording_console_log: false,
  session_recording: {
    maskAllInputs: true,
    maskInputOptions: {
      password: true,
      email: true,
      tel: true,
    },
  },
};

// Initialiser PostHog
if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, posthogOptions);
}

// Composant Provider pour gérer l'identification des utilisateurs
function PostHogAuthWrapper({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Gérer l'identification des utilisateurs
    if (session?.user && status === 'authenticated') {
      posthog.identify(session.user.id, {
        email: session.user.email,
        name: session.user.name,
        role: session.user.role,
        avatar: session.user.image,
      });
    } else if (status === 'unauthenticated') {
      // Réinitialiser l'identification anonyme
      posthog.reset();
    }
  }, [session, status]);

  return <>{children}</>;
}

// Provider principal PostHog
export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <PostHogAuthWrapper>
        {children}
      </PostHogAuthWrapper>
    </PHProvider>
  );
}

// Hook utilitaire pour le tracking
export function usePostHogCapture() {
  const captureEvent = (event: string, properties?: any) => {
    if (typeof window !== 'undefined') {
      posthog.capture(event, {
        ...properties,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        user_agent: navigator.userAgent,
      });
    }
  };

  const capturePageView = (properties?: any) => {
    if (typeof window !== 'undefined') {
      posthog.capture('$pageview', {
        ...properties,
        path: window.location.pathname,
        title: document.title,
        referrer: document.referrer,
      });
    }
  };

  return { captureEvent, capturePageView };
}