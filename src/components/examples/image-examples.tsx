// Exemple de configuration et utilisation du système d'images intelligent
'use client';

import React from 'react';
import { ImageProvider, ImageDebugger } from '@/components/ui/image-provider';
import { 
  SmartImage, 
  SmartAvatar, 
  SmartBanner, 
  SmartThumbnail, 
  SmartGallery 
} from '@/components/ui/smart-image';

// Exemple de composant utilisant le nouveau système d'images
export default function ImageExample() {
  return (
    <ImageProvider enableDebugging={true}>
      <div className="container mx-auto p-8 space-y-8">
        <h1 className="text-3xl font-bold mb-8">Exemples d'Images Intelligentes</h1>
        
        {/* Exemple 1: Image de propriété avec fallback */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Image de Propriété</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* URL valide */}
            <SmartImage
              src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
              alt="Belle maison moderne"
              width={400}
              height={300}
              className="rounded-lg shadow-lg"
              propertyType="MAISON"
            />
            
            {/* URL invalide - montrera le fallback */}
            <SmartImage
              src={null}
              alt="Image manquante"
              width={400}
              height={300}
              className="rounded-lg shadow-lg"
              propertyType="MAISON"
            />
          </div>
        </div>

        {/* Exemple 2: Avatars */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Avatars</h2>
          <div className="flex space-x-4">
            <SmartAvatar
              src="https://ui-avatars.com/api/?name=John+Doe&background=random"
              alt="John Doe"
              width={60}
              height={60}
            />
            
            <SmartAvatar
              src={null}
              alt="Avatar par défaut"
              width={60}
              height={60}
            />
            
            <SmartAvatar
              src="https://invalid-url.com/avatar.jpg"
              alt="Avatar invalide"
              width={60}
              height={60}
            />
          </div>
        </div>

        {/* Exemple 3: Bannière */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Bannière</h2>
          <SmartBanner
            src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
            alt="Bannière principale"
            width={1200}
            height={400}
            className="w-full rounded-lg"
          />
        </div>

        {/* Exemple 4: Miniatures */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Miniatures</h2>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {Array.from({ length: 6 }, (_, i) => (
              <SmartThumbnail
                key={i}
                src={i % 2 === 0 ? "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80" : ""}
                alt={`Miniature ${i + 1}`}
                width={200}
                height={150}
              />
            ))}
          </div>
        </div>

        {/* Exemple 5: Galerie */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Galerie</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }, (_, i) => (
              <SmartGallery
                key={i}
                src={i % 3 === 0 ? "https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" : ""}
                alt={`Photo de galerie ${i + 1}`}
                width={300}
                height={200}
              />
            ))}
          </div>
        </div>

        {/* Exemple 6: Différents types de propriétés */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Types de Propriétés</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SmartImage
              src={null}
              alt="Maison"
              width={250}
              height={200}
              propertyType="MAISON"
              className="rounded-lg"
            />
            
            <SmartImage
              src={null}
              alt="Terrain"
              width={250}
              height={200}
              propertyType="TERRAIN"
              className="rounded-lg"
            />
            
            <SmartImage
              src={null}
              alt="Bureau"
              width={250}
              height={200}
              propertyType="BUREAU"
              className="rounded-lg"
            />
            
            <SmartImage
              src={null}
              alt="Hangar"
              width={250}
              height={200}
              propertyType="HANGAR"
              className="rounded-lg"
            />
          </div>
        </div>

        {/* Exemple 7: Avec événements */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Avec Événements</h2>
          <SmartImage
            src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80"
            alt="Image avec événements"
            width={400}
            height={300}
            className="rounded-lg cursor-pointer"
            propertyType="MAISON"
            onLoad={() => console.log('Image chargée avec succès!')}
            onError={() => console.log('Erreur de chargement de l\'image')}
          />
        </div>

        {/* Exemple 8: Performance options */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Options de Performance</h2>
          <SmartImage
            src="https://images.unsplash.com/photo-1560518883-ce09059eeffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
            alt="Image optimisée"
            width={400}
            height={300}
            quality={85}
            priority={true}
            loading="eager"
            placeholder="blur"
            className="rounded-lg"
            propertyType="MAISON"
          />
        </div>

        {/* Le debugger s'affiche en mode développement */}
        <ImageDebugger />
      </div>
    </ImageProvider>
  );
}

// Exemple d'utilisation dans une vraie page
export function PropertyCard({ property }: { property: any }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Image principale avec fallback intelligent */}
      <SmartImage
        src={property.imageUrl}
        alt={property.titre}
        width={400}
        height={250}
        className="w-full h-64 object-cover"
        propertyType={property.type}
        priority={true}
      />
      
      <div className="p-4">
        <h3 className="text-lg font-semibold">{property.titre}</h3>
        <p className="text-gray-600">{property.description}</p>
        
        {/* Galerie de miniatures */}
        <div className="mt-4 flex space-x-2 overflow-x-auto">
          {property.medias?.slice(0, 4).map((media: any, index: number) => (
            <SmartThumbnail
              key={media.id}
              src={media.url}
              alt={`${property.titre} - ${index + 1}`}
              width={80}
              height={60}
              className="flex-shrink-0 rounded"
            />
          ))}
        </div>
        
        {/* Avatar de l'agent */}
        <div className="mt-4 flex items-center space-x-2">
          <SmartAvatar
            src={property.agent?.avatar}
            alt={property.agent?.name}
            width={32}
            height={32}
          />
          <span className="text-sm text-gray-600">{property.agent?.name}</span>
        </div>
      </div>
    </div>);
}