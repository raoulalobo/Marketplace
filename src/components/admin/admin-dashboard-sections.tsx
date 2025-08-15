// Sections intégrées pour le dashboard administrateur
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Flag, 
  BarChart3, 
  Home,
  Eye,
  Heart,
  MessageSquare,
  AlertTriangle,
  Check,
  X,
  TrendingUp,
  ArrowRight,
  Clock,
  Shield,
  Database
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ReportStatus } from '@prisma/client';

// Interface pour les données agrégées du dashboard
interface DashboardData {
  users: {
    total: number;
    agents: number;
    acheteurs: number;
    recent: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      createdAt: string;
    }>;
  };
  reports: {
    total: number;
    pending: number;
    resolved: number;
    recent: Array<{
      id: string;
      motif: string;
      status: ReportStatus;
      createdAt: string;
      property: {
        titre: string;
      };
      user: {
        nom: string;
        prenom: string;
      };
    }>;
  };
  properties: {
    total: number;
    active: number;
    views: number;
  };
  analytics: {
    conversionRate: number;
    avgResponseTime: number;
    activeUsers24h: number;
    topProperties: Array<{
      id: string;
      titre: string;
      views: number;
      agent: {
        nom: string;
        prenom: string;
      };
    }>;
  };
}

// Section Utilisateurs
function UsersSection({ users }: { users: DashboardData['users'] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Users className="w-5 h-5 text-blue-600" />
          <span>Gestion Utilisateurs</span>
        </CardTitle>
        <Link
          href="/admin/users"
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
        >
          <span>Voir tout</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistiques rapides */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{users.total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{users.agents}</div>
            <div className="text-xs text-gray-500">Agents</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{users.acheteurs}</div>
            <div className="text-xs text-gray-500">Acheteurs</div>
          </div>
        </div>

        {/* Utilisateurs récents */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Inscriptions récentes</h4>
          {users.recent.length > 0 ? (
            <div className="space-y-2">
              {users.recent.slice(0, 3).map((user) => (
                <div key={user.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{user.name}</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      user.role === 'AGENT' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {user.role}
                    </span>
                  </div>
                  <span className="text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Aucune inscription récente</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Section Signalements
function ReportsSection({ reports }: { reports: DashboardData['reports'] }) {
  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case ReportStatus.PENDING:
        return 'text-yellow-600 bg-yellow-100';
      case ReportStatus.RESOLVED:
        return 'text-green-600 bg-green-100';
      case ReportStatus.REJECTED:
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Flag className="w-5 h-5 text-red-600" />
          <span>Signalements</span>
        </CardTitle>
        <Link
          href="/admin/reports"
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
        >
          <span>Gérer</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistiques rapides */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{reports.total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{reports.pending}</div>
            <div className="text-xs text-gray-500">En attente</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{reports.resolved}</div>
            <div className="text-xs text-gray-500">Résolus</div>
          </div>
        </div>

        {/* Alerte si signalements en attente */}
        {reports.pending > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm text-yellow-800 font-medium">
                {reports.pending} signalement{reports.pending > 1 ? 's' : ''} nécessite{reports.pending > 1 ? 'nt' : ''} votre attention
              </span>
            </div>
          </div>
        )}

        {/* Signalements récents */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Signalements récents</h4>
          {reports.recent.length > 0 ? (
            <div className="space-y-3">
              {reports.recent.slice(0, 3).map((report) => (
                <div key={report.id} className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium">{report.motif}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">
                      Propriété: {report.property.titre}
                    </p>
                    <p className="text-xs text-gray-500">
                      Par: {report.user.prenom} {report.user.nom}
                    </p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(report.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Aucun signalement récent</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Section Analytics
function AnalyticsSection({ analytics, properties }: { 
  analytics: DashboardData['analytics']; 
  properties: DashboardData['properties'];
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-green-600" />
          <span>Analytics</span>
        </CardTitle>
        <Link
          href="/admin/analytics"
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
        >
          <span>Détails</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Métriques clés */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{analytics.conversionRate}%</div>
            <div className="text-xs text-gray-500">Taux conversion</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{analytics.activeUsers24h}</div>
            <div className="text-xs text-gray-500">Actifs 24h</div>
          </div>
        </div>

        {/* Performances système */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">{analytics.avgResponseTime}ms</div>
            <div className="text-xs text-gray-500">Temps réponse</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-600">{properties.views}</div>
            <div className="text-xs text-gray-500">Vues totales</div>
          </div>
        </div>

        {/* Top propriétés */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Propriétés populaires</h4>
          {analytics.topProperties.length > 0 ? (
            <div className="space-y-2">
              {analytics.topProperties.slice(0, 3).map((property, index) => (
                <div key={property.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-500 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                      'bg-orange-500 text-white'
                    }`}>
                      {index + 1}
                    </span>
                    <span className="font-medium truncate">{property.titre}</span>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-500">
                    <Eye className="w-3 h-3" />
                    <span>{property.views}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Aucune donnée disponible</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Section Système
function SystemSection() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Shield className="w-5 h-5 text-purple-600" />
          <span>Système</span>
        </CardTitle>
        <Link
          href="/admin/settings"
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
        >
          <span>Paramètres</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Actions système */}
        <div className="grid grid-cols-1 gap-3">
          <Link
            href="/admin/settings"
            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Database className="w-4 h-4 text-blue-600" />
              <div>
                <span className="text-sm font-medium">Configuration</span>
                <p className="text-xs text-gray-500">Paramètres système</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </Link>
          
          <Link
            href="/admin/analytics"
            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <div>
                <span className="text-sm font-medium">Monitoring</span>
                <p className="text-xs text-gray-500">Performance système</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </Link>
        </div>

        {/* Statut système */}
        <div className="border-t pt-4">
          <h4 className="font-medium text-gray-900 mb-3">Statut</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Système</span>
              <span className="flex items-center space-x-1 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Opérationnel</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Base de données</span>
              <span className="flex items-center space-x-1 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Connectée</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Dernière sauvegarde</span>
              <span className="text-gray-500">Il y a 2h</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Composant principal des sections
export function AdminDashboardSections() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/admin/dashboard-overview');
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Erreur chargement dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-40 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">Impossible de charger les données du dashboard</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <UsersSection users={data.users} />
      <ReportsSection reports={data.reports} />
      <AnalyticsSection analytics={data.analytics} properties={data.properties} />
      <SystemSection />
    </div>
  );
}