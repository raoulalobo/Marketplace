// Composant de chargement réutilisable
'use client';

import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
  center?: boolean;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

export const LoadingSpinner = ({
  size = 'md',
  className = '',
  text,
  center = false,
}) => {
  const spinner = (
    <Loader2 
      className={`animate-spin ${sizeClasses[size]} ${className}`} 
    />
  );

  if (center) {
    return (
      <div className="flex flex-col items-center justify-center space-y-2">
        {spinner}
        {text && (
          <p className="text-sm text-gray-600">{text}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {spinner}
      {text && (
        <span className="text-sm text-gray-600">{text}</span>
      )}
    </div>
  );
};

// Composant de chargement pour les pages complètes
export const PageLoading = ({ 
  text = 'Chargement...'
}) => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <LoadingSpinner size="lg" text={text} />
        </div>
      </div>
    </div>
  );
};

// Composant de chargement pour les cartes
export const CardLoading = () => {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
      <div className="h-8 bg-gray-200 rounded w-full"></div>
    </div>
  );
};

// Composant de chargement pour les listes
export const ListLoading = ({ count = 3 }: { count?: number }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingSpinner;