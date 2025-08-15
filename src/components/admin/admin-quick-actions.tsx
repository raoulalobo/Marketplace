// Actions rapides pour l'administration - Design simple identique Agent/Client
'use client';

import Link from 'next/link';
import { 
  Users, 
  Flag, 
  BarChart3, 
  Settings,
  Home,
  UserCheck
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const adminActions = [
  {
    label: 'Utilisateurs',
    href: '/admin/users',
    icon: <Users className="w-4 h-4" />,
    variant: 'default' as const,
  },
  {
    label: 'Signalements',
    href: '/admin/reports',
    icon: <Flag className="w-4 h-4" />,
    variant: 'outline' as const,
  },
  {
    label: 'Analytics',
    href: '/admin/analytics',
    icon: <BarChart3 className="w-4 h-4" />,
    variant: 'outline' as const,
  },
  {
    label: 'Système',
    href: '/admin/settings',
    icon: <Settings className="w-4 h-4" />,
    variant: 'outline' as const,
  },
  {
    label: 'Propriétés',
    href: '/admin/properties',
    icon: <Home className="w-4 h-4" />,
    variant: 'outline' as const,
  },
  {
    label: 'Agents',
    href: '/admin/users?filter=agents',
    icon: <UserCheck className="w-4 h-4" />,
    variant: 'outline' as const,
  }
];

export function AdminQuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Actions rapides</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {adminActions.map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                action.variant === 'default'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {action.icon}
              <span className="ml-2">{action.label}</span>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}