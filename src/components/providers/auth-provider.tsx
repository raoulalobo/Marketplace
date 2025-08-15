// Provider d'authentification pour l'application avec chargement global
'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode, useEffect, useState } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Home } from 'lucide-react';
import { SessionContextProvider, useAppSession } from '@/contexts/session-context';

interface AuthProviderProps {
  children: ReactNode;
}

// Composant interne pour gérer le chargement avec session centralisée
function AuthWrapper({ children }: { children: ReactNode }) {
  const { status } = useAppSession();
  const [showTimeoutMessage, setShowTimeoutMessage] = useState(false);

  // Timeout de sécurité pour éviter un chargement infini
  useEffect(() => {
    if (status === 'loading') {
      const timeout = setTimeout(() => {
        setShowTimeoutMessage(true);
      }, 10000); // 10 secondes

      return () => clearTimeout(timeout);
    }
    // Reset du message si on sort du loading
    if (status !== 'loading') {
      setShowTimeoutMessage(false);
    }
  }, [status]);

  // Affichage du loader tant que la session n'est pas chargée
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-6 p-8">
          {/* Logo de l'application */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Home className="w-8 h-8 text-white" />
            </div>
          </div>
          
          {/* Titre */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Marketplace Immo
          </h1>
          
          {/* Spinner de chargement */}
          <div className="flex flex-col items-center space-y-4">
            <LoadingSpinner size="xl" className="text-blue-600" />
            <p className="text-gray-600 text-lg font-medium">
              Chargement de l'application...
            </p>
            
            {showTimeoutMessage && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  Le chargement prend plus de temps que prévu. 
                  Veuillez vérifier votre connexion internet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Une fois la session chargée, afficher l'application
  return <>{children}</>;
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider 
      // Optimisation : réduire la fréquence des vérifications de session
      refetchInterval={5 * 60} // 5 minutes au lieu de 30 secondes par défaut
      refetchOnWindowFocus={false} // Éviter les re-fetch inutiles
    >
      <SessionContextProvider>
        <AuthWrapper>
          {children}
        </AuthWrapper>
      </SessionContextProvider>
    </SessionProvider>
  );
}