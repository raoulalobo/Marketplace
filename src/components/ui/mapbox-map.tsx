// Composant de carte Mapbox avec marqueur pour afficher la localisation d'une propriété
'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Interface pour les props du composant
interface MapboxMapProps {
  longitude: number; // Coordonnée longitude
  latitude: number; // Coordonnée latitude
  className?: string; // Classes CSS additionnelles
}

// Configuration du token d'accès Mapbox
if (typeof window !== 'undefined') {
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';
}

export function MapboxMap({ longitude, latitude, className = '' }: MapboxMapProps) {
  // Référence au conteneur de la carte
  const mapContainer = useRef<HTMLDivElement>(null);
  // Référence à l'instance de la carte
  const map = useRef<mapboxgl.Map | null>(null);
  // Référence au marqueur
  const marker = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    // Vérifier que le conteneur est disponible et qu'on a un token
    if (!mapContainer.current || !mapboxgl.accessToken) return;

    // Initialiser la carte
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12', // Style de carte moderne
      center: [longitude, latitude], // Centrer sur les coordonnées de la propriété
      zoom: 15, // Niveau de zoom approprié pour une propriété
      attributionControl: false // Masquer les attributions pour un affichage plus propre
    });

    // Ajouter un marqueur sur la localisation de la propriété
    marker.current = new mapboxgl.Marker({
      color: '#3B82F6' // Couleur bleue pour correspondre au design de l'app
    })
      .setLngLat([longitude, latitude])
      .addTo(map.current);

    // Ajouter les contrôles de navigation (zoom/rotation)
    map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    // Fonction de nettoyage
    return () => {
      // Supprimer le marqueur
      if (marker.current) {
        marker.current.remove();
        marker.current = null;
      }
      // Supprimer la carte
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [longitude, latitude]);

  // Afficher un message d'erreur si le token n'est pas configuré
  if (!mapboxgl.accessToken) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-center p-4">
          <p className="text-gray-500 text-sm">
            Configuration Mapbox requise
          </p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={mapContainer} 
      className={className}
      style={{ minHeight: '250px' }} // Hauteur minimale pour assurer la visibilité
    />
  );
}