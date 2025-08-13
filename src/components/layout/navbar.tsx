// Barre de navigation principale avec gestion des rôles
'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Home, Search, Heart, User, LogIn, LogOut, Settings, Plus } from 'lucide-react';
import { UserRole } from '@prisma/client';

export function Navbar() {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Navigation conditionnelle selon le rôle
  const getNavigationItems = () => {
    const baseItems = [
      { href: '/', label: 'Accueil', icon: Home },
      { href: '/properties', label: 'Propriétés', icon: Search },
    ];

    if (!session) {
      return [
        ...baseItems,
        { href: '/auth/login', label: 'Connexion', icon: LogIn },
        { href: '/auth/register', label: 'Inscription', icon: User },
      ];
    }

    const userItems = [
      ...baseItems,
      { href: '/dashboard', label: 'Tableau de bord', icon: Settings },
    ];

    // Ajout d'éléments spécifiques selon le rôle
    if (session.user.role === UserRole.ACHETEUR) {
      userItems.splice(2, 0, { href: '/dashboard/favorites', label: 'Favoris', icon: Heart });
    }

    if (session.user.role === UserRole.AGENT) {
      userItems.splice(2, 0, { href: '/properties/add', label: 'Ajouter bien', icon: Plus });
    }

    return userItems;
  };

  const navigationItems = getNavigationItems();

  return (
    <nav className="bg-white shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Marketplace Immo
              </span>
            </Link>
          </div>

          {/* Navigation desktop */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center space-x-1 text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              
              {/* Informations utilisateur connecté */}
              {session && (
                <div className="flex items-center space-x-4 ml-6 border-l pl-6">
                  <div className="text-sm">
                    <p className="text-gray-900 font-medium">{session.user.name}</p>
                    <p className="text-gray-500 text-xs capitalize">{session.user.role.toLowerCase()}</p>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="flex items-center space-x-1 text-gray-700 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Déconnexion</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Menu burger mobile */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-700 hover:text-blue-600 p-2"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-t">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 block px-3 py-2 rounded-md text-base font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            
            {/* Informations utilisateur mobile */}
            {session && (
              <div className="border-t pt-4 mt-4">
                <div className="px-3 py-2">
                  <p className="text-gray-900 font-medium">{session.user.name}</p>
                  <p className="text-gray-500 text-sm capitalize">{session.user.role.toLowerCase()}</p>
                </div>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    signOut({ callbackUrl: '/' });
                  }}
                  className="flex items-center space-x-2 text-gray-700 hover:text-red-600 w-full text-left px-3 py-2 rounded-md text-base font-medium"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Déconnexion</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}