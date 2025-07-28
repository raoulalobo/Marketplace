// Hook pour gérer l'historique des recherches
'use client';

import { useState, useEffect } from 'react';

export interface SearchHistoryItem {
  id: string;
  location: string;
  propertyType: string;
  budget: string;
  keywords: string;
  timestamp: number;
  label: string; // Description lisible de la recherche
}

const STORAGE_KEY = 'property_search_history';
const MAX_HISTORY_ITEMS = 5;

export function useSearchHistory() {
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);

  // Charger l'historique depuis localStorage au montage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setSearchHistory(parsed);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'historique des recherches:', error);
      }
    }
  }, []);

  // Fonction pour générer un label lisible à partir des filtres
  const generateSearchLabel = (filters: {
    location: string;
    propertyType: string;
    budget: string;
    keywords: string;
  }): string => {
    const parts = [];
    
    // Prioriser les mots-clés s'ils existent
    if (filters.keywords) {
      parts.push(`"${filters.keywords}"`);
    }
    
    if (filters.propertyType) {
      const typeLabels: Record<string, string> = {
        'MAISON': 'Maison',
        'TERRAIN': 'Terrain',
        'BUREAU': 'Bureau',
        'HANGAR': 'Hangar'
      };
      parts.push(typeLabels[filters.propertyType] || filters.propertyType);
    }
    
    if (filters.location) {
      parts.push(`à ${filters.location.charAt(0).toUpperCase() + filters.location.slice(1)}`);
    }
    
    if (filters.budget) {
      if (filters.budget.includes('-')) {
        const [min, max] = filters.budget.split('-');
        const minM = Math.round(parseInt(min) / 1000000);
        const maxM = Math.round(parseInt(max) / 1000000);
        parts.push(`${minM}M-${maxM}M FCFA`);
      } else if (filters.budget.endsWith('+')) {
        const min = Math.round(parseInt(filters.budget.replace('+', '')) / 1000000);
        parts.push(`${min}M+ FCFA`);
      }
    }
    
    return parts.length > 0 ? parts.join(' ') : 'Recherche générale';
  };

  // Ajouter une recherche à l'historique
  const addToHistory = (filters: {
    location: string;
    propertyType: string;
    budget: string;
    keywords: string;
  }) => {
    if (typeof window === 'undefined') return;

    const newItem: SearchHistoryItem = {
      id: Date.now().toString(),
      ...filters,
      timestamp: Date.now(),
      label: generateSearchLabel(filters)
    };

    // Éviter les doublons en comparant les filtres
    const isDuplicate = searchHistory.some(item => 
      item.location === filters.location &&
      item.propertyType === filters.propertyType &&
      item.budget === filters.budget &&
      item.keywords === filters.keywords
    );

    if (!isDuplicate) {
      const updatedHistory = [newItem, ...searchHistory]
        .slice(0, MAX_HISTORY_ITEMS); // Garder seulement les 5 derniers
      
      setSearchHistory(updatedHistory);
      
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
      } catch (error) {
        console.error('Erreur lors de la sauvegarde de l\'historique:', error);
      }
    }
  };

  // Supprimer un élément de l'historique
  const removeFromHistory = (id: string) => {
    const updatedHistory = searchHistory.filter(item => item.id !== id);
    setSearchHistory(updatedHistory);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'historique:', error);
    }
  };

  // Vider tout l'historique
  const clearHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'historique:', error);
    }
  };

  return {
    searchHistory,
    addToHistory,
    removeFromHistory,
    clearHistory
  };
}