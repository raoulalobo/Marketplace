// Page de liste des propriétés avec recherche et filtres
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Search, Filter, MapPin, Home, Briefcase, Grid, ArrowLeftRight, Clock } from 'lucide-react';
import { PropertyImage } from '@/components/ui/property-image';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Types pour les propriétés
interface Property {
  id: string;
  titre: string;
  description: string;
  type: 'MAISON' | 'TERRAIN' | 'BUREAU' | 'HANGAR';
  prix: number;
  superficie: number;
  adresse: string;
  fraisVisite: number;
  troc: boolean; // Accepte le troc/échange
  payer_apres: boolean; // Accepte le paiement différé
  medias: Array<{
    url: string;
    type: 'PHOTO' | 'VIDEO';
    order: number;
  }>;
  agent: {
    id: string;
    nom: string;
    prenom: string;
  };
  createdAt: string;
}

// Villes camerounaises
const villes = [
  'Toutes les villes',
  'Douala', 'Yaoundé', 'Bafoussam', 'Bamenda', 'Garoua',
  'Maroua', 'Ngaoundéré', 'Bertoua', 'Ebolowa', 'Kribi'
];

// Types de propriétés avec icônes
const typesProps = [
  { value: 'TOUS', label: 'Tous les types', icon: Grid },
  { value: 'MAISON', label: 'Maisons', icon: Home },
  { value: 'TERRAIN', label: 'Terrains', icon: MapPin },
  { value: 'BUREAU', label: 'Bureaux', icon: Briefcase },
  { value: 'HANGAR', label: 'Hangars', icon: Grid }
];

// Composant de carte de propriété
function PropertyCard({ property }: { property: Property }) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const TypeIcon = typesProps.find(t => t.value === property.type)?.icon || Home;
  
  // Extraire la première photo des médias
  const firstPhoto = property.medias.find(m => m.type === 'PHOTO')?.url;

  // Extraire la ville de l'adresse
  const adresseParts = property.adresse.split(',');
  const ville = adresseParts[adresseParts.length - 1]?.trim() || 'Cameroun';

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <PropertyImage 
          src={firstPhoto} 
          alt={property.titre}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute top-3 left-3 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
          <TypeIcon className="w-3 h-3" />
          {typesProps.find(t => t.value === property.type)?.label}
        </div>
        <div className="absolute top-3 right-3 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium">
          {formatPrice(property.prix)}
        </div>
      </div>

      {/* Contenu */}
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900 mb-2 line-clamp-1">
          {property.titre}
        </h3>
        
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {property.description}
        </p>

        {/* Informations */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{property.adresse}</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>{property.superficie} m²</span>
            <span>•</span>
            <span>Visite: {formatPrice(property.fraisVisite || 0)}</span>
          </div>
          
          {/* Badges pour les options spéciales */}
          {(property.troc || property.payer_apres) && (
            <div className="flex flex-wrap gap-2 pt-2">
              {property.troc && (
                <div className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                  <ArrowLeftRight className="w-3 h-3" />
                  Troc accepté
                </div>
              )}
              {property.payer_apres && (
                <div className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                  <Clock className="w-3 h-3" />
                  Paiement différé
                </div>
              )}
            </div>
          )}
        </div>

        {/* Agent */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Agent: {property.agent.prenom} {property.agent.nom}
          </div>
          <Link href={`/properties/${property.id}`}>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              Voir détails
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Composant de contenu principal avec gestion des paramètres URL
function PropertiesContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVille, setSelectedVille] = useState('');
  const [selectedType, setSelectedType] = useState('TOUS');
  const [priceRange, setPriceRange] = useState('TOUS');
  const [trocFilter, setTrocFilter] = useState(false);
  const [payerApresFilter, setPayerApresFilter] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProperties, setTotalProperties] = useState(0);
  const propertiesPerPage = 12;

  // Fonction pour vérifier si des critères de recherche sont définis
  const hasSearchCriteria = (searchQuery: string, ville: string, type: string, prix: string, troc: boolean, payerApres: boolean) => {
    return !!(
      searchQuery ||
      (ville && ville !== 'Toutes les villes') ||
      (type && type !== 'TOUS') ||
      (prix && prix !== 'TOUS') ||
      troc ||
      payerApres
    );
  };

  // Fonction pour sauvegarder une recherche dans l'historique
  const saveSearchToHistory = async (searchData: {
    searchQuery?: string;
    filters: Record<string, any>;
    resultCount: number;
  }) => {
    try {
      // Nettoyer les filtres undefined
      const cleanFilters = Object.fromEntries(
        Object.entries(searchData.filters).filter(([_, value]) => value !== undefined)
      );

      // Ne pas sauvegarder si aucun filtre n'est défini
      if (Object.keys(cleanFilters).length === 0 && !searchData.searchQuery) {
        return;
      }

      await fetch('/api/searches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          searchQuery: searchData.searchQuery,
          filters: cleanFilters,
          resultCount: searchData.resultCount
        }),
      });
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la recherche:', error);
      // Ne pas bloquer l'interface si la sauvegarde échoue
    }
  };

  // Fonction pour récupérer les propriétés depuis l'API avec filtres et pagination
  const fetchProperties = async (
    page: number = currentPage,
    searchQuery: string = searchTerm,
    ville: string = selectedVille,
    type: string = selectedType,
    prix: string = priceRange,
    troc: boolean = trocFilter,
    payerApres: boolean = payerApresFilter
  ) => {
    try {
      setLoading(true);
      setError('');
      
      // Construire les paramètres de requête
      const params = new URLSearchParams({
        page: page.toString(),
        limit: propertiesPerPage.toString()
      });
      
      if (searchQuery) params.append('search', searchQuery);
      if (ville && ville !== 'Toutes les villes') params.append('ville', ville);
      if (type && type !== 'TOUS') params.append('type', type);
      
      // Gérer les filtres de prix
      if (prix && prix !== 'TOUS') {
        const [min, max] = prix.split('-').map(Number);
        if (min) params.append('prixMin', min.toString());
        if (max) params.append('prixMax', max.toString());
      }
      
      // Filtres pour les options spéciales
      if (troc) params.append('troc', 'true');
      if (payerApres) params.append('payer_apres', 'true');
      
      const response = await fetch(`/api/properties?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des propriétés');
      }
      
      const data = await response.json();
      setProperties(data.properties || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalProperties(data.pagination?.total || 0);
      setCurrentPage(data.pagination?.page || 1);
      
      // Sauvegarder la recherche si l'utilisateur est connecté et qu'il y a des critères
      if (session?.user && hasSearchCriteria(searchQuery, ville, type, prix, troc, payerApres)) {
        saveSearchToHistory({
          searchQuery: searchQuery || undefined,
          filters: {
            ville: ville && ville !== 'Toutes les villes' ? ville : undefined,
            type: type && type !== 'TOUS' ? type : undefined,
            priceRange: prix && prix !== 'TOUS' ? prix : undefined,
            troc: troc || undefined,
            payerApres: payerApres || undefined
          },
          resultCount: data.pagination?.total || 0
        });
      }
      
    } catch (err) {
      console.error('Erreur API:', err);
      setError('Impossible de charger les propriétés');
      setProperties([]);
      setTotalPages(1);
      setTotalProperties(0);
    } finally {
      setLoading(false);
    }
  };

  // Charger les propriétés au montage
  useEffect(() => {
    fetchProperties();
  }, []);

  // Initialiser les filtres depuis l'URL
  useEffect(() => {
    const type = searchParams.get('type') || 'TOUS';
    const ville = searchParams.get('ville') || '';
    setSelectedType(type);
    setSelectedVille(ville);
  }, [searchParams]);

  // Recharger les propriétés quand les filtres changent (retour à la page 1)
  useEffect(() => {
    if (currentPage === 1) {
      fetchProperties(1, searchTerm, selectedVille, selectedType, priceRange, trocFilter, payerApresFilter);
    } else {
      setCurrentPage(1);
    }
  }, [searchTerm, selectedVille, selectedType, priceRange, trocFilter, payerApresFilter]);

  // Recharger les propriétés quand la page change
  useEffect(() => {
    fetchProperties(currentPage, searchTerm, selectedVille, selectedType, priceRange, trocFilter, payerApresFilter);
  }, [currentPage]);

  // Fonctions de pagination
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // Scroll vers le haut de la liste
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePreviousPage = () => {
    handlePageChange(currentPage - 1);
  };

  const handleNextPage = () => {
    handlePageChange(currentPage + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Propriétés disponibles</h1>
              <p className="text-gray-600">
                {loading ? 'Chargement...' : (
                  totalProperties > 0 ? (
                    `${totalProperties} biens immobiliers trouvés - Page ${currentPage} sur ${totalPages}`
                  ) : (
                    'Aucune propriété trouvée'
                  )
                )}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filtres
            </Button>
          </div>

          {/* Barre de recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Rechercher par titre, description ou adresse..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-3"
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Filtres sidebar */}
          <div className={`bg-white rounded-lg shadow-lg p-6 h-fit ${showFilters ? 'block' : 'hidden'} md:block md:w-80`}>
            <h3 className="font-semibold text-gray-900 mb-4">Filtres de recherche</h3>
            
            <div className="space-y-4">
              {/* Ville */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
                <Select value={selectedVille} onValueChange={setSelectedVille}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une ville" />
                  </SelectTrigger>
                  <SelectContent>
                    {villes.map(ville => (
                      <SelectItem key={ville} value={ville}>
                        {ville}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type de bien</label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {typesProps.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Prix */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Gamme de prix</label>
                <Select value={priceRange} onValueChange={setPriceRange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un budget" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TOUS">Tous les prix</SelectItem>
                    <SelectItem value="0-30000000">0 - 30M FCFA</SelectItem>
                    <SelectItem value="30000000-60000000">30M - 60M FCFA</SelectItem>
                    <SelectItem value="60000000-100000000">60M - 100M FCFA</SelectItem>
                    <SelectItem value="100000000">100M+ FCFA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Options spéciales */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Options de paiement</label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="troc-filter"
                      checked={trocFilter}
                      onCheckedChange={setTrocFilter}
                    />
                    <label
                      htmlFor="troc-filter"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <ArrowLeftRight className="w-4 h-4 text-green-600" />
                        Accepte le troc
                      </div>
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="payer-apres-filter"
                      checked={payerApresFilter}
                      onCheckedChange={setPayerApresFilter}
                    />
                    <label
                      htmlFor="payer-apres-filter"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        Paiement différé
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Bouton reset */}
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedVille('');
                  setSelectedType('TOUS');
                  setPriceRange('TOUS');
                  setTrocFilter(false);
                  setPayerApresFilter(false);
                  setCurrentPage(1);
                }}
              >
                Réinitialiser les filtres
              </Button>
            </div>
          </div>

          {/* Liste des propriétés */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                    <div className="h-48 bg-gray-200"></div>
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-400 mb-4">
                  <Search className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Erreur de chargement</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={() => fetchProperties()} variant="outline">
                  Réessayer
                </Button>
              </div>
            ) : properties.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune propriété trouvée</h3>
                <p className="text-gray-600">
                  {totalProperties === 0 
                    ? "Aucune propriété disponible pour le moment" 
                    : "Essayez de modifier vos critères de recherche"
                  }
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.map(property => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>

                {/* Composant de pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex flex-col items-center gap-4">
                    <div className="text-sm text-gray-600">
                      Affichage de {((currentPage - 1) * propertiesPerPage) + 1} à {Math.min(currentPage * propertiesPerPage, totalProperties)} sur {totalProperties} propriétés
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Bouton Précédent */}
                      <Button
                        variant="outline"
                        onClick={handlePreviousPage}
                        disabled={currentPage === 1}
                        className="px-3 py-2"
                      >
                        ← Précédent
                      </Button>

                      {/* Numéros de pages */}
                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let pageNumber;
                          if (totalPages <= 5) {
                            pageNumber = i + 1;
                          } else if (currentPage <= 3) {
                            pageNumber = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNumber = totalPages - 4 + i;
                          } else {
                            pageNumber = currentPage - 2 + i;
                          }

                          return (
                            <Button
                              key={pageNumber}
                              variant={currentPage === pageNumber ? "default" : "outline"}
                              onClick={() => handlePageChange(pageNumber)}
                              className="px-3 py-2 min-w-[40px]"
                            >
                              {pageNumber}
                            </Button>
                          );
                        })}
                      </div>

                      {/* Bouton Suivant */}
                      <Button
                        variant="outline"
                        onClick={handleNextPage}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2"
                      >
                        Suivant →
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant principal avec Suspense
export default function PropertiesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <PropertiesContent />
    </Suspense>
  );
}