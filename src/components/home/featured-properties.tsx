// Section des propriétés en vedette au Cameroun
'use client';

import { useState, useEffect } from 'react';
import { PropertyImage } from '@/components/ui/property-image';
import Link from 'next/link';
import { MapPin, Home, Briefcase, Grid, Eye, Heart, ArrowRight, ArrowLeftRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Interface pour les propriétés
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

// Types de propriétés avec icônes
const typeIcons = {
  MAISON: Home,
  TERRAIN: MapPin,
  BUREAU: Briefcase,
  HANGAR: Grid
};

const typeLabels = {
  MAISON: 'Maison',
  TERRAIN: 'Terrain',
  BUREAU: 'Bureau',
  HANGAR: 'Hangar'
};

// Fonction pour récupérer les propriétés depuis l'API avec affichage aléatoire
const fetchFeaturedProperties = async (): Promise<Property[]> => {
  try {
    // Récupérer plus de propriétés pour avoir du choix pour l'aléatoire
    const response = await fetch('/api/properties?limit=12');
    
    if (!response.ok) {
      console.error('Erreur lors du chargement des propriétés');
      return [];
    }
    
    const data = await response.json();
    const properties = data.properties || [];
    
    // Mélanger aléatoirement et prendre les 6 premières
    const shuffledProperties = properties
      .sort(() => Math.random() - 0.5)
      .slice(0, 6);
    
    return shuffledProperties;
  } catch (error) {
    console.error('Erreur API:', error);
    return [];
  }
};

export function FeaturedProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les propriétés au montage
  useEffect(() => {
    const loadProperties = async () => {
      try {
        const data = await fetchFeaturedProperties();
        setProperties(data);
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProperties();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* En-tête de section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Découvrez nos propriétés
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Une sélection variée de biens immobiliers de qualité dans les meilleurs 
            quartiers du Cameroun, vérifiés par nos experts.
          </p>
        </div>

        {/* Grille des propriétés */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden animate-pulse">
                <div className="h-64 bg-gray-200"></div>
                <div className="p-6 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Home className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune propriété disponible</h3>
            <p className="text-gray-600">
              Aucune propriété n'est disponible pour le moment.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {properties.map((property) => {
              // Extraire la première photo des médias
              const firstPhoto = property.medias.find(m => m.type === 'PHOTO')?.url;
              
              // Extraire la ville de l'adresse
              const adresseParts = property.adresse.split(',');
              const ville = adresseParts[adresseParts.length - 1]?.trim() || 'Cameroun';
              
              const TypeIcon = typeIcons[property.type];
              
              return (
                <div 
                  key={property.id}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden group"
                >
                  {/* Image de la propriété */}
                  <div className="relative h-64 overflow-hidden">
                    <PropertyImage
                      src={firstPhoto}
                      alt={property.titre}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    
                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2">
                      <span className="bg-blue-600 text-white px-2 py-1 rounded-md text-xs font-semibold flex items-center gap-1">
                        <TypeIcon className="w-3 h-3" />
                        {typeLabels[property.type]}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                      <button className="w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors">
                        <Heart className="w-4 h-4 text-gray-600" />
                      </button>
                      <button className="w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors">
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>

                    {/* Prix */}
                    <div className="absolute bottom-4 left-4">
                      <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2">
                        <span className="text-lg font-bold text-blue-600">
                          {formatPrice(property.prix)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contenu de la carte */}
                  <div className="p-6">
                    {/* Titre */}
                    <div className="mb-3">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                        {property.titre}
                      </h3>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span className="text-sm">{property.adresse}</span>
                      </div>
                    </div>

                    {/* Détails de la propriété */}
                    <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Grid className="w-4 h-4 mr-1" />
                        <span>{property.superficie} m²</span>
                      </div>
                      {property.fraisVisite > 0 && (
                        <div className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          <span>Visite: {formatPrice(property.fraisVisite)}</span>
                        </div>
                      )}
                    </div>

                    {/* Options spéciales */}
                    {(property.troc || property.payer_apres) && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {property.troc && (
                          <div className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                            <ArrowLeftRight className="w-3 h-3" />
                            Troc
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

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 border-blue-600 text-blue-600 hover:bg-blue-50"
                        asChild
                      >
                        <Link href={`/properties/${property.id}`}>
                          Voir détails
                        </Link>
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Contacter
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bouton pour voir plus */}
        <div className="text-center mt-12">
          <Button size="lg" variant="outline" className="group">
            <Link href="/properties" className="flex items-center gap-2">
              Voir toutes les propriétés
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}