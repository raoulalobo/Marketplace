// Hook personnalisé pour gérer les favoris d'une propriété
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

const ADD_FAVORITE_ERROR_MESSAGE = "Erreur lors de l'ajout aux favoris";
const REMOVE_FAVORITE_ERROR_MESSAGE = "Erreur lors de la suppression des favoris";
const CHECK_FAVORITE_ERROR_MESSAGE = "Erreur lors de la vérification des favoris";
const AUTH_REQUIRED_MESSAGE = "Vous devez être connecté pour gérer les favoris";
const ADD_AUTH_REQUIRED_MESSAGE = "Vous devez être connecté pour ajouter des favoris";

interface UseFavoriteOptions {
  propertyId: string;
  initialIsFavorite?: boolean;
  onToggle?: (isFavorite: boolean) => void;
  onError?: (error: string) => void;
}

interface UseFavoriteReturn {
  isFavorite: boolean;
  isLoading: boolean;
  toggleFavorite: () => Promise<boolean>;
  addToFavorites: () => Promise<boolean>;
  removeFromFavorites: () => Promise<boolean>;
  checkFavoriteStatus: () => Promise<boolean>;
}

export function useFavorite({
  propertyId,
  initialIsFavorite = false,
  onToggle,
  onError
}: UseFavoriteOptions): UseFavoriteReturn {
  const { data: session, status } = useSession();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isLoading, setIsLoading] = useState(false);

  // Vérifier le statut initial des favoris quand la session est chargée
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.id) {
      checkFavoriteStatus();
    } else if (status === 'unauthenticated') {
      setIsFavorite(false);
    }
  }, [status, session?.user?.id, propertyId]);

  // Fonction pour vérifier si la propriété est en favori
  const checkFavoriteStatus = useCallback(async (): Promise<boolean> => {
    if (!session?.user?.id) {
      return false;
    }

    try {
      const response = await fetch('/api/properties/favorites');
      
      if (!response.ok) {
        throw new Error('Erreur lors de la vérification des favoris');
      }

      const data = await response.json();
      const isPropertyFavorite = data.favorites.some(
        (fav: any) => fav.property.id === propertyId
      );

      setIsFavorite(isPropertyFavorite);
      return isPropertyFavorite;
    } catch (error: any) {
      console.error('Erreur lors de la vérification des favoris:', error);
      if (onError) {
        onError(error.message || 'Erreur lors de la vérification des favoris');
      }
      return false;
    }
  }, [session?.user?.id, propertyId, onError]);

  // Fonction pour ajouter aux favoris
  const addToFavorites = useCallback(async (): Promise<boolean> => {
    if (!session?.user?.id) {
      if (onError) {
        onError('Vous devez être connecté pour ajouter des favoris');
      }
      return false;
    }

    if (isFavorite) {
      return true; // Déjà en favori
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/properties/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ propertyId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\u0027ajout aux favoris');
      }

      setIsFavorite(true);
      if (onToggle) {
        onToggle(true);
      }
      return true;
    } catch (error: any) {
      console.error('Erreur lors de l\'ajout aux favoris:', error);
      if (onError) {
        onError(error.message || ADD_FAVORITE_ERROR_MESSAGE);
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, propertyId, isFavorite, onToggle, onError]);

  // Fonction pour retirer des favoris
  const removeFromFavorites = useCallback(async (): Promise<boolean> => {
    if (!session?.user?.id) {
      if (onError) {
        onError(AUTH_REQUIRED_MESSAGE);
      }
      return false;
    }

    if (!isFavorite) {
      return true; // Déjà retiré
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/properties/favorites?propertyId=${propertyId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la suppression des favoris');
      }

      setIsFavorite(false);
      if (onToggle) {
        onToggle(false);
      }
      return true;
    } catch (error: any) {
      console.error(REMOVE_FAVORITE_ERROR_MESSAGE, error);
      if (onError) {
        onError(error.message || REMOVE_FAVORITE_ERROR_MESSAGE);
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, propertyId, isFavorite, onToggle, onError]);

  // Fonction pour basculer le statut des favoris
  const toggleFavorite = useCallback(async (): Promise<boolean> => {
    if (!session?.user?.id) {
      if (onError) {
        onError(AUTH_REQUIRED_MESSAGE);
      }
      return false;
    }

    // Optimistic update : changer l'état immédiatement pour une meilleure UX
    const previousState = isFavorite;
    setIsFavorite(!isFavorite);

    try {
      let success: boolean;
      if (isFavorite) {
        success = await removeFromFavorites();
      } else {
        success = await addToFavorites();
      }

      // Si l'opération a échoué, revenir à l'état précédent
      if (!success) {
        setIsFavorite(previousState);
      }

      return success;
    } catch (error) {
      // Revenir à l'état précédent en cas d'erreur
      setIsFavorite(previousState);
      return false;
    }
  }, [session?.user?.id, propertyId, isFavorite, addToFavorites, removeFromFavorites, onError]);

  return {
    isFavorite,
    isLoading,
    toggleFavorite,
    addToFavorites,
    removeFromFavorites,
    checkFavoriteStatus
  };
}