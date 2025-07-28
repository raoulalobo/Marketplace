// Dashboard pour les administrateurs
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Home, AlertTriangle, TrendingUp, Shield, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AdminDashboardProps {
  user: User;
}

export function AdminDashboard({ user }: AdminDashboardProps) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    pendingReports: 0,
    activeAgents: 0,
    totalViews: 0,
    newUsersThisMonth: 0,
  });

  // Charger les statistiques depuis l'API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/admin-stats');
        if (response.ok) {
          const data = await response.json();
          setStats({
            totalUsers: data.totalUsers,
            totalProperties: data.totalProperties,
            pendingReports: data.pendingVisitRequests, // Utiliser les demandes en attente comme proxy
            activeAgents: data.totalAgents,
            totalViews: data.totalViews,
            newUsersThisMonth: data.newUsersThisMonth,
          });
        } else {
          console.error('Erreur lors du chargement des statistiques');
        }
      } catch (error) {
        console.error('Erreur API:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard Administrateur
        </h1>
        <p className="text-gray-600">
          Bonjour {user.name}, gérez votre plateforme et surveillez les performances.
        </p>
      </div>

      {/* Actions rapides */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions administrateur</h2>
          <div className="flex flex-wrap gap-4">
            <Button asChild>
              <Link href="/admin/users">
                <Users className="w-4 h-4 mr-2" />
                Gérer les utilisateurs
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/properties">
                <Home className="w-4 h-4 mr-2" />
                Modérer les propriétés
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/reports">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Signalements
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/admin/analytics">
                <TrendingUp className="w-4 h-4 mr-2" />
                Analyses
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              <p className="text-gray-600">Utilisateurs totaux</p>
              <p className="text-xs text-green-600">+{stats.newUsersThisMonth} ce mois</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Home className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats.totalProperties}</p>
              <p className="text-gray-600">Propriétés totales</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats.pendingReports}</p>
              <p className="text-gray-600">Signalements en attente</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats.activeAgents}</p>
              <p className="text-gray-600">Agents actifs</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">{stats.totalViews}</p>
              <p className="text-gray-600">Vues totales</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Database className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900">98.5%</p>
              <p className="text-gray-600">Disponibilité système</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sections détaillées */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Activité récente */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Activité récente</h3>
            <Link href="/admin/activity" className="text-blue-600 hover:text-blue-500 text-sm">
              Voir tout
            </Link>
          </div>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 border-l-4 border-green-400 bg-green-50">
              <div className="text-sm">
                <p className="font-medium text-gray-900">Nouvel utilisateur inscrit</p>
                <p className="text-gray-600">Jean Dupont (Agent) - il y a 2h</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 border-l-4 border-blue-400 bg-blue-50">
              <div className="text-sm">
                <p className="font-medium text-gray-900">Nouvelle propriété ajoutée</p>
                <p className="text-gray-600">Villa à Douala - il y a 4h</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 border-l-4 border-red-400 bg-red-50">
              <div className="text-sm">
                <p className="font-medium text-gray-900">Signalement reçu</p>
                <p className="text-gray-600">Contenu inapproprié - il y a 6h</p>
              </div>
            </div>
          </div>
        </div>

        {/* Signalements en attente */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Signalements en attente</h3>
            <Link href="/admin/reports" className="text-blue-600 hover:text-blue-500 text-sm">
              Voir tout
            </Link>
          </div>
          <div className="space-y-3">
            {stats.pendingReports > 0 ? (
              <>
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Photos inappropriées</h4>
                    <p className="text-sm text-gray-600">Propriété #123 - Signalé par Marie K.</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Examiner
                  </Button>
                </div>
                <div className="flex items-center space-x-3 p-3 border rounded-lg">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Prix suspect</h4>
                    <p className="text-sm text-gray-600">Propriété #156 - Signalé par Paul D.</p>
                  </div>
                  <Button size="sm" variant="outline">
                    Examiner
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-center py-4">Aucun signalement en attente</p>
            )}
          </div>
        </div>
      </div>

      {/* Performance système */}
      <div className="mt-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance du système</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-sm text-gray-600">Temps de réponse moyen</p>
              <p className="text-lg font-semibold text-gray-900">245ms</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Database className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600">Utilisation base de données</p>
              <p className="text-lg font-semibold text-gray-900">67%</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <p className="text-sm text-gray-600">Utilisateurs connectés</p>
              <p className="text-lg font-semibold text-gray-900">34</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}