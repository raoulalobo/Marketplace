// Context personnalisé pour la gestion centralisée de la session
'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useSession, SessionContextValue } from 'next-auth/react';

// Type pour notre context personnalisé
interface CustomSessionContextType extends SessionContextValue {
  // On peut ajouter des propriétés personnalisées ici si besoin
}

// Création du context
const SessionContext = createContext<CustomSessionContextType | null>(null);

// Props pour le provider
interface SessionContextProviderProps {
  children: ReactNode;
}

// Provider qui centralise l'appel à useSession
export function SessionContextProvider({ children }: SessionContextProviderProps) {
  const sessionValue = useSession();

  return (
    <SessionContext.Provider value={sessionValue}>
      {children}
    </SessionContext.Provider>
  );
}

// Hook personnalisé pour utiliser notre context
export function useAppSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useAppSession must be used within a SessionContextProvider');
  }
  return context;
}