// Hook pour les notifications toast
'use client';

import React, { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

// Store global des toasts (simple implémentation)
let toastStore: Toast[] = [];
let listeners: Array<(toasts: Toast[]) => void> = [];

const addToast = (toast: ToastProps) => {
  const id = Math.random().toString(36).substr(2, 9);
  const newToast: Toast = {
    id,
    variant: 'default',
    duration: 5000,
    ...toast,
  };

  toastStore = [...toastStore, newToast];
  listeners.forEach(listener => listener(toastStore));

  // Auto-suppression après la durée spécifiée
  setTimeout(() => {
    toastStore = toastStore.filter(t => t.id !== id);
    listeners.forEach(listener => listener(toastStore));
  }, newToast.duration);
};

const removeToast = (id: string) => {
  toastStore = toastStore.filter(t => t.id !== id);
  listeners.forEach(listener => listener(toastStore));
};

/**
 * Hook pour afficher des notifications toast
 * Compatible avec le système shadcn/ui toast
 */
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(toastStore);

  // S'abonner aux changements du store
  React.useEffect(() => {
    const listener = (newToasts: Toast[]) => setToasts(newToasts);
    listeners.push(listener);

    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  const toast = useCallback((props: ToastProps) => {
    addToast(props);
  }, []);

  const dismiss = useCallback((id: string) => {
    removeToast(id);
  }, []);

  return {
    toast,
    dismiss,
    toasts,
  };
}