// Section de recherche moderne pour la marketplace immobilière
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Home, DollarSign, Loader2, History, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useSearchHistory } from '@/hooks/useSearchHistory';

export function SearchSection() {
  const router = useRouter();
  const { searchHistory, addToHistory, removeFromHistory } = useSearchHistory();
  const [searchFilters, setSearchFilters] = useState({
    location: '',
    propertyType: '',
    budget: '',
    keywords: '' // Nouveau champ pour la recherche textuelle
  });
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPopularSearch, setSelectedPopularSearch] = useState<string | null>(null);

  const villes = [
    'Douala', 'Yaoundé', 'Bafoussam', 'Bamenda', 'Garoua', 
    'Maroua', 'Ngaoundéré', 'Bertoua', 'Ebolowa', 'Kribi'
  ];

  const typesProperties = [
    { value: 'MAISON', label: 'Maison familiale' },
    { value: 'TERRAIN', label: 'Terrain titré' },
    { value: 'BUREAU', label: 'Bureau/Commerce' },
    { value: 'HANGAR', label: 'Hangar/Entrepôt' }
  ];

  const budgetRanges = [
    { value: '0-15000000', label: 'Moins de 15M FCFA' },
    { value: '15000000-50000000', label: '15M - 50M FCFA' },
    { value: '50000000-100000000', label: '50M - 100M FCFA' },
    { value: '100000000-200000000', label: '100M - 200M FCFA' },
    { value: '200000000+', label: 'Plus de 200M FCFA' }
  ];

  // Fonction pour construire l'URL de recherche avec les paramètres
  const buildSearchUrl = (filters: typeof searchFilters) => {
    const params = new URLSearchParams();
    
    // Ajouter la recherche par mots-clés si présente
    if (filters.keywords) {
      params.set('search', filters.keywords);
    }
    
    // Ajouter la ville si sélectionnée
    if (filters.location) {
      params.set('ville', filters.location);
    }
    
    // Ajouter le type de propriété si sélectionné
    if (filters.propertyType) {
      params.set('type', filters.propertyType);
    }
    
    // Ajouter la gamme de prix si sélectionnée
    if (filters.budget) {
      if (filters.budget.includes('-')) {
        const [min, max] = filters.budget.split('-');
        if (min && min !== '0') params.set('prixMin', min);
        if (max) params.set('prixMax', max);
      } else if (filters.budget.endsWith('+')) {
        const min = filters.budget.replace('+', '');
        params.set('prixMin', min);
      }
    }
    
    return `/properties${params.toString() ? '?' + params.toString() : ''}`;
  };

  // Validation simple des filtres
  const validateSearchFilters = () => {
    // Au moins un filtre doit être sélectionné pour une recherche optimale
    if (!searchFilters.location && !searchFilters.propertyType && !searchFilters.budget) {
      return {
        isValid: true, // Autoriser la recherche sans filtres (affichera toutes les propriétés)
        message: 'Recherche dans toutes les propriétés disponibles'
      };
    }
    return { isValid: true, message: '' };
  };

  // Fonction de recherche principale
  const handleSearch = async () => {
    const validation = validateSearchFilters();
    
    if (!validation.isValid) {
      console.warn(validation.message);
      return;
    }

    setIsSearching(true);
    
    try {
      // Ajouter à l'historique si au moins un filtre est sélectionné
      if (searchFilters.location || searchFilters.propertyType || searchFilters.budget || searchFilters.keywords) {
        addToHistory(searchFilters);
      }
      
      // Simuler un délai pour l'UX (optionnel)
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Construire l'URL avec les filtres
      const searchUrl = buildSearchUrl(searchFilters);
      
      // Naviguer vers la page de propriétés
      router.push(searchUrl);
      
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Fonction pour gérer les recherches populaires
  const handlePopularSearch = async (searchType: string) => {
    const searchMap: Record<string, typeof searchFilters> = {
      'Villa Douala': { location: 'douala', propertyType: 'MAISON', budget: '50000000-200000000', keywords: 'villa' },
      'Maison Yaoundé': { location: 'yaoundé', propertyType: 'MAISON', budget: '15000000-100000000', keywords: 'maison' },
      'Terrain Bafoussam': { location: 'bafoussam', propertyType: 'TERRAIN', budget: '0-50000000', keywords: 'terrain' },
      'Bureau Bonanjo': { location: 'douala', propertyType: 'BUREAU', budget: '15000000-100000000', keywords: 'bureau' },
      'Appartement Bastos': { location: 'yaoundé', propertyType: 'MAISON', budget: '30000000-150000000', keywords: 'appartement' }
    };
    
    const filters = searchMap[searchType];
    if (filters) {
      setSelectedPopularSearch(searchType);
      setSearchFilters(filters);
      
      // Navigation automatique après 800ms pour permettre à l'utilisateur de voir les filtres se remplir
      setTimeout(async () => {
        setIsSearching(true);
        
        try {
          await new Promise(resolve => setTimeout(resolve, 200));
          const searchUrl = buildSearchUrl(filters);
          router.push(searchUrl);
        } catch (error) {
          console.error('Erreur lors de la recherche populaire:', error);
        } finally {
          setIsSearching(false);
          setSelectedPopularSearch(null);
        }
      }, 800);
    }
  };

  return (
    <section className="bg-white py-16 relative">
      {/* Conteneur principal */}
      <div className="container mx-auto px-4">
        {/* En-tête de section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Recherchez votre propriété idéale
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Utilisez nos filtres avancés pour trouver exactement ce que vous cherchez 
            dans les meilleures villes du Cameroun.
          </p>
        </div>

        {/* Formulaire de recherche */}
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-8">
            {/* Recherche textuelle */}
            <div className="mb-6">
              <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Search className="w-4 h-4 mr-2 text-gray-600" />
                Recherche par mots-clés
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchFilters.keywords}
                  onChange={(e) => setSearchFilters({...searchFilters, keywords: e.target.value})}
                  placeholder="Ex: villa avec piscine, terrain titré, bureau climatisé..."
                  className="w-full h-12 pl-4 pr-12 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-6">
              {/* Localisation */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-4 h-4 mr-2 text-blue-600" />
                  Localisation
                </label>
                <Select 
                  value={searchFilters.location} 
                  onValueChange={(value) => setSearchFilters({...searchFilters, location: value})}
                >
                  <SelectTrigger className="h-12 border-gray-200 focus:border-blue-500">
                    <SelectValue placeholder="Choisir une ville" />
                  </SelectTrigger>
                  <SelectContent>
                    {villes.map((ville) => (
                      <SelectItem key={ville} value={ville.toLowerCase()}>
                        {ville}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type de propriété */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <Home className="w-4 h-4 mr-2 text-green-600" />
                  Type de propriété
                </label>
                <Select 
                  value={searchFilters.propertyType} 
                  onValueChange={(value) => setSearchFilters({...searchFilters, propertyType: value})}
                >
                  <SelectTrigger className="h-12 border-gray-200 focus:border-blue-500">
                    <SelectValue placeholder="Type de bien" />
                  </SelectTrigger>
                  <SelectContent>
                    {typesProperties.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Budget */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="w-4 h-4 mr-2 text-yellow-600" />
                  Budget
                </label>
                <Select 
                  value={searchFilters.budget} 
                  onValueChange={(value) => setSearchFilters({...searchFilters, budget: value})}
                >
                  <SelectTrigger className="h-12 border-gray-200 focus:border-blue-500">
                    <SelectValue placeholder="Gamme de prix" />
                  </SelectTrigger>
                  <SelectContent>
                    {budgetRanges.map((range) => (
                      <SelectItem key={range.value} value={range.value}>
                        {range.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Bouton de recherche */}
              <div className="flex items-end">
                <Button 
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold disabled:opacity-70"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Recherche...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      Rechercher
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Recherches populaires */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-3">Recherches populaires :</p>
              <div className="flex flex-wrap gap-2">
                {[
                  'Villa Douala', 
                  'Maison Yaoundé', 
                  'Terrain Bafoussam', 
                  'Bureau Bonanjo',
                  'Appartement Bastos'
                ].map((search) => {
                  const isSelected = selectedPopularSearch === search;
                  return (
                    <button
                      key={search}
                      onClick={() => handlePopularSearch(search)}
                      disabled={isSearching}
                      className={`px-4 py-2 rounded-full text-sm transition-all duration-300 disabled:cursor-not-allowed ${
                        isSelected 
                          ? 'bg-blue-600 text-white shadow-lg transform scale-105' 
                          : 'bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-600 disabled:opacity-50'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin inline" />
                          {search}
                        </>
                      ) : (
                        search
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Historique des recherches récentes */}
            {searchHistory.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-gray-500 flex items-center">
                    <History className="w-4 h-4 mr-1" />
                    Recherches récentes :
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {searchHistory.map((historyItem) => (
                    <div
                      key={historyItem.id}
                      className="flex items-center bg-blue-50 border border-blue-200 rounded-full px-3 py-1.5 text-sm"
                    >
                      <button
                        onClick={() => {
                          setSearchFilters({
                            location: historyItem.location,
                            propertyType: historyItem.propertyType,
                            budget: historyItem.budget,
                            keywords: historyItem.keywords
                          });
                        }}
                        className="text-blue-700 hover:text-blue-900 transition-colors mr-2"
                      >
                        {historyItem.label}
                      </button>
                      <button
                        onClick={() => removeFromHistory(historyItem.id)}
                        className="text-blue-400 hover:text-blue-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Statistiques en bas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-600 mb-2">500+</div>
            <div className="text-gray-600">Biens disponibles</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-600 mb-2">15+</div>
            <div className="text-gray-600">Villes couvertes</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-yellow-600 mb-2">200+</div>
            <div className="text-gray-600">Clients satisfaits</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600 mb-2">50+</div>
            <div className="text-gray-600">Agents partenaires</div>
          </div>
        </div>
      </div>
    </section>
  );
}