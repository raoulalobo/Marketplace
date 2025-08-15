// Tableau des utilisateurs pour l'admin
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { 
  Eye, 
  Edit, 
  UserCheck, 
  UserX,
  ChevronUp,
  ChevronDown,
  Shield,
  User,
  Building2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { UserRole } from '@prisma/client';

// Interface pour un utilisateur avec ses statistiques
interface UserWithStats {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  telephone: string | null;
  role: UserRole;
  isActive: boolean;
  emailVerified: Date | null;
  createdAt: Date;
  lastLoginAt: Date | null;
  stats: {
    propertiesCount: number;
    favoritesCount: number;
    reportsCount: number;
    visitRequestsCount: number;
  };
}

interface UsersTableProps {
  users: UserWithStats[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  onPageChange: (page: number) => void;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onUserUpdate: (userId: string, updates: { role?: UserRole; isActive?: boolean }) => void;
  currentSort: {
    sortBy: string;
    sortOrder: string;
  };
  loading: boolean;
}

export function UsersTable({ 
  users, 
  pagination, 
  onPageChange, 
  onSortChange,
  onUserUpdate,
  currentSort,
  loading 
}: UsersTableProps) {
  const [updatingUsers, setUpdatingUsers] = useState<Set<string>>(new Set());

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'Jamais';
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return <Shield className="w-4 h-4 text-red-500" />;
      case UserRole.AGENT:
        return <Building2 className="w-4 h-4 text-blue-500" />;
      case UserRole.ACHETEUR:
        return <User className="w-4 h-4 text-green-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'Administrateur';
      case UserRole.AGENT:
        return 'Agent';
      case UserRole.ACHETEUR:
        return 'Acheteur';
      default:
        return role;
    }
  };

  const getSortIcon = (column: string) => {
    if (currentSort.sortBy !== column) return null;
    return currentSort.sortOrder === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  const handleSort = (column: string) => {
    const newOrder = currentSort.sortBy === column && currentSort.sortOrder === 'asc' ? 'desc' : 'asc';
    onSortChange(column, newOrder);
  };

  const handleUserAction = async (userId: string, updates: { role?: UserRole; isActive?: boolean }) => {
    setUpdatingUsers(prev => new Set(prev).add(userId));
    try {
      await onUserUpdate(userId, updates);
    } finally {
      setUpdatingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  if (users.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="text-gray-400 mb-4">
            <User className="w-16 h-16 mx-auto" />
          </div>
          <p className="text-gray-500">Aucun utilisateur trouvé avec ces filtres</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tableau */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left p-4">
                    <button
                      onClick={() => handleSort('email')}
                      className="flex items-center space-x-1 font-medium text-gray-900 hover:text-blue-600"
                    >
                      <span>Utilisateur</span>
                      {getSortIcon('email')}
                    </button>
                  </th>
                  <th className="text-left p-4">
                    <button
                      onClick={() => handleSort('role')}
                      className="flex items-center space-x-1 font-medium text-gray-900 hover:text-blue-600"
                    >
                      <span>Rôle</span>
                      {getSortIcon('role')}
                    </button>
                  </th>
                  <th className="text-center p-4">
                    <span className="font-medium text-gray-900">Statut</span>
                  </th>
                  <th className="text-center p-4">
                    <span className="font-medium text-gray-900">Statistiques</span>
                  </th>
                  <th className="text-left p-4">
                    <button
                      onClick={() => handleSort('createdAt')}
                      className="flex items-center space-x-1 font-medium text-gray-900 hover:text-blue-600"
                    >
                      <span>Inscription</span>
                      {getSortIcon('createdAt')}
                    </button>
                  </th>
                  <th className="text-center p-4">
                    <span className="font-medium text-gray-900">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                    {/* Utilisateur */}
                    <td className="p-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900">
                            {user.prenom} {user.nom}
                          </span>
                          {!user.emailVerified && (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                              Non vérifié
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">{user.email}</p>
                        {user.telephone && (
                          <p className="text-xs text-gray-400">{user.telephone}</p>
                        )}
                      </div>
                    </td>

                    {/* Rôle */}
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(user.role)}
                        <span className="font-medium">{getRoleLabel(user.role)}</span>
                      </div>
                    </td>

                    {/* Statut */}
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </td>

                    {/* Statistiques */}
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2 justify-center">
                        {user.role === UserRole.AGENT && (
                          <div className="text-center">
                            <div className="text-sm font-medium text-blue-600">
                              {user.stats.propertiesCount}
                            </div>
                            <div className="text-xs text-gray-500">Propriétés</div>
                          </div>
                        )}
                        <div className="text-center">
                          <div className="text-sm font-medium text-green-600">
                            {user.stats.favoritesCount}
                          </div>
                          <div className="text-xs text-gray-500">Favoris</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-purple-600">
                            {user.stats.visitRequestsCount}
                          </div>
                          <div className="text-xs text-gray-500">Visites</div>
                        </div>
                        {user.stats.reportsCount > 0 && (
                          <div className="text-center">
                            <div className="text-sm font-medium text-red-600">
                              {user.stats.reportsCount}
                            </div>
                            <div className="text-xs text-gray-500">Signalements</div>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Dates */}
                    <td className="p-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {formatDate(user.createdAt)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Dernière connexion: {formatDate(user.lastLoginAt)}
                        </div>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        
                        <button
                          onClick={() => handleUserAction(user.id, { 
                            isActive: !user.isActive 
                          })}
                          disabled={updatingUsers.has(user.id)}
                          className={`p-2 rounded ${
                            user.isActive 
                              ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' 
                              : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                          } disabled:opacity-50`}
                          title={user.isActive ? 'Désactiver' : 'Activer'}
                        >
                          {user.isActive ? (
                            <UserX className="w-4 h-4" />
                          ) : (
                            <UserCheck className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {pagination.page} sur {pagination.totalPages} 
                ({pagination.totalCount} utilisateurs au total)
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage || loading}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                
                {/* Pages */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const page = Math.max(1, pagination.page - 2) + i;
                    if (page > pagination.totalPages) return null;
                    
                    return (
                      <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`px-3 py-1 text-sm rounded ${
                          page === pagination.page
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                        disabled={loading}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={!pagination.hasNextPage || loading}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}