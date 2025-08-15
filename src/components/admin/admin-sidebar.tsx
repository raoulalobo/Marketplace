// Barre latérale de navigation pour l'administration
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Home, 
  Users, 
  Flag, 
  BarChart3, 
  Settings,
  LogOut,
  Building2
} from 'lucide-react';
import { signOut } from 'next-auth/react';

const adminNavItems = [
  {
    label: 'Vue d\'ensemble',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Propriétés',
    href: '/admin/properties',
    icon: Building2,
  },
  {
    label: 'Utilisateurs',
    href: '/admin/users',
    icon: Users,
  },
  {
    label: 'Signalements',
    href: '/admin/reports',
    icon: Flag,
  },
  {
    label: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
  },
  {
    label: 'Paramètres',
    href: '/admin/settings',
    icon: Settings,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0">
      {/* En-tête */}
      <div className="flex items-center justify-center h-16 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Home className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold">Admin Panel</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-8">
        <div className="px-4 space-y-2">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Actions du bas */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
        <Link
          href="/dashboard"
          className="flex items-center space-x-3 px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors mb-2"
        >
          <Home className="w-5 h-5" />
          <span>Retour au site</span>
        </Link>
        
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center space-x-3 px-4 py-2 text-gray-300 hover:bg-red-600 hover:text-white rounded-lg transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );
}