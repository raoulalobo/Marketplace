// Composant Breadcrumb universel et auto-adaptatif
'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { Fragment } from 'react';

// Configuration centralisée des labels pour chaque route
const BREADCRUMB_MAP: Record<string, string> = {
  // Dashboard principal
  '/dashboard': 'Tableau de bord',
  
  // Gestion des propriétés
  '/dashboard/properties': 'Mes propriétés',
  '/properties/add': 'Ajouter une propriété',
  '/properties/edit': 'Modifier propriété',
  
  // Demandes de visite
  '/dashboard/visits': 'Demandes de visite',
  
  // Pages générales
  '/properties': 'Propriétés',
  '/about': 'À propos',
  '/contact': 'Contact',
  '/comment-ca-marche': 'Comment ça marche',
  
  // Authentification
  '/auth/login': 'Connexion',
  '/auth/register': 'Inscription',
};

// Interface pour un élément de breadcrumb
interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrent: boolean;
}

/**
 * Génère automatiquement les éléments de breadcrumb basés sur l'URL actuelle
 */
function generateBreadcrumbItems(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  const items: BreadcrumbItem[] = [];
  
  // Toujours commencer par l'accueil pour les pages dashboard
  if (pathname.startsWith('/dashboard')) {
    items.push({
      label: 'Accueil',
      href: '/',
      isCurrent: false,
    });
  }
  
  // Construire les éléments basés sur les segments
  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;
    
    // Récupérer le label du mapping ou formater le segment
    let label = BREADCRUMB_MAP[currentPath];
    if (!label) {
      // Formater automatiquement le segment si pas dans le mapping
      label = segment
        .replace(/-/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    
    items.push({
      label,
      href: currentPath,
      isCurrent: isLast,
    });
  });
  
  return items;
}

/**
 * Composant Breadcrumb auto-adaptatif
 */
export function Breadcrumb() {
  const pathname = usePathname();
  
  // Ne pas afficher le breadcrumb sur la page d'accueil
  if (pathname === '/') {
    return null;
  }
  
  const items = generateBreadcrumbItems(pathname);
  
  // Ne pas afficher si un seul élément (éviter la redondance)
  if (items.length <= 1) {
    return null;
  }
  
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6" aria-label="Fil d'Ariane">
      <Home className="w-4 h-4 text-gray-400" />
      
      {items.map((item, index) => (
        <Fragment key={item.href}>
          {index > 0 && (
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          )}
          
          {item.isCurrent ? (
            <span className="font-medium text-gray-900 truncate">
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href}
              className="hover:text-blue-600 transition-colors truncate"
              title={item.label}
            >
              {item.label}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  );
}

/**
 * Hook pour obtenir les informations de breadcrumb de la page courante
 */
export function useBreadcrumb() {
  const pathname = usePathname();
  const items = generateBreadcrumbItems(pathname);
  
  return {
    items,
    currentPage: items[items.length - 1]?.label || '',
    parentPage: items[items.length - 2]?.label || '',
  };
}