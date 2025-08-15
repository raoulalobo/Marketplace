// Composant de fil d'ariane pour l'administration
'use client';

import Link from 'next/link';
import { ChevronRight, Home, Shield } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface AdminBreadcrumbProps {
  items: BreadcrumbItem[];
}

export function AdminBreadcrumb({ items }: AdminBreadcrumbProps) {
  // Toujours inclure l'accueil comme premier élément
  const fullItems: BreadcrumbItem[] = [
    {
      label: 'Accueil',
      href: '/dashboard',
      icon: <Home className="w-4 h-4" />
    },
    {
      label: 'Administration',
      href: '/admin/dashboard',
      icon: <Shield className="w-4 h-4" />
    },
    ...items
  ];

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
      {fullItems.map((item, index) => (
        <div key={index} className="flex items-center space-x-2">
          {index > 0 && (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
          
          {item.href ? (
            <Link
              href={item.href}
              className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ) : (
            <div className="flex items-center space-x-1 text-gray-900 font-medium">
              {item.icon}
              <span>{item.label}</span>
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}