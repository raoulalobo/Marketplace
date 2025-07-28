// Composant SafeImage avec fallback et watermark
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface SafeImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  sizes?: string;
  quality?: number;
}

// Génère une image SVG placeholder avec watermark
const generatePlaceholderSvg = (width: number = 400, height: number = 300) => {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" stroke-width="0.5"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="#f9fafb"/>
      <rect width="100%" height="100%" fill="url(#grid)"/>
      
      <!-- Logo central -->
      <g transform="translate(${width/2}, ${height/2})">
        <!-- Icône maison -->
        <path d="M-15,-10 L0,-20 L15,-10 L15,10 L-15,10 Z" fill="#3b82f6" stroke="#1d4ed8" stroke-width="1"/>
        <rect x="-5" y="0" width="10" height="10" fill="#1d4ed8"/>
        <circle cx="7" cy="3" r="1.5" fill="#3b82f6"/>
        
        <!-- Texte watermark -->
        <text x="0" y="30" text-anchor="middle" fill="#6b7280" font-family="Arial, sans-serif" font-size="14" font-weight="600">
          Marketplace Immo
        </text>
        <text x="0" y="45" text-anchor="middle" fill="#9ca3af" font-family="Arial, sans-serif" font-size="10">
          Image non disponible
        </text>
      </g>
    </svg>
  `;
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

export function SafeImage({ 
  src, 
  alt, 
  fill = false, 
  width, 
  height, 
  className,
  priority = false,
  sizes,
  quality = 75,
  ...props 
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Gérer les erreurs de chargement d'image
  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  // Si erreur, utiliser le placeholder
  if (hasError) {
    const placeholderSrc = generatePlaceholderSvg(width || 400, height || 300);
    
    return (
      <Image
        src={placeholderSrc}
        alt={`${alt} (image non disponible)`}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        className={cn(
          "object-cover transition-opacity duration-300",
          className
        )}
        priority={priority}
        sizes={sizes}
        quality={quality}
        {...props}
      />
    );
  }

  return (
    <div className="relative">
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        className={cn(
          "object-cover transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        onError={handleError}
        onLoad={handleLoad}
        priority={priority}
        sizes={sizes}
        quality={quality}
        {...props}
      />
      
      {/* Indicateur de chargement */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}
    </div>
  );
}