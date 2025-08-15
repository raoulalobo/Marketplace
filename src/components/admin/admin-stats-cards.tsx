// Cartes de statistiques pour le dashboard admin
'use client';

import { 
  Users, 
  Building2, 
  Eye, 
  Calendar,
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Star
} from 'lucide-react';

interface AdminStatsCardsProps {
  stats: {
    totalUsers: number;
    totalAgents: number;
    totalAcheteurs: number;
    newUsersThisMonth: number;
    totalProperties: number;
    activeProperties: number;
    pendingProperties: number;
    propertiesAddedThisMonth: number;
    totalVisitRequests: number;
    pendingVisitRequests: number;
    totalViews: number;
    totalReports: number;
    avgPropertyPrice: number;
    isEmpty: {
      users: boolean;
      properties: boolean;
      activities: boolean;
      agents: boolean;
    };
    emptyStateMessages: {
      users?: string;
      properties?: string;
      activities?: string;
      agents?: string;
    };
  };
}

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function StatCard({ title, value, subtitle, icon: Icon, color, trend }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-500 text-blue-600 bg-blue-50',
    green: 'bg-green-500 text-green-600 bg-green-50',
    yellow: 'bg-yellow-500 text-yellow-600 bg-yellow-50',
    red: 'bg-red-500 text-red-600 bg-red-50',
    purple: 'bg-purple-500 text-purple-600 bg-purple-50',
    indigo: 'bg-indigo-500 text-indigo-600 bg-indigo-50',
  };

  const [bgColor, textColor, cardBg] = colorClasses[color].split(' ');

  return (
    <div className={`${cardBg} rounded-xl p-6 border border-gray-200`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subtitle && (
            <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp className={`w-4 h-4 mr-1 ${
                trend.isPositive ? '' : 'rotate-180'
              }`} />
              <span>{trend.value}% ce mois</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export function AdminStatsCards({ stats }: AdminStatsCardsProps) {
  // Calcul des pourcentages de croissance (éviter division par zéro)
  const userGrowthPercent = stats.totalUsers > 0 
    ? Math.round((stats.newUsersThisMonth / stats.totalUsers) * 100) 
    : 0;
  const propertyGrowthPercent = stats.totalProperties > 0 
    ? Math.round((stats.propertiesAddedThisMonth / stats.totalProperties) * 100) 
    : 0;
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Message d'information si pas de données */}
      {stats.isEmpty.users && stats.isEmpty.properties && (
        <div className="col-span-full bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <div className="text-blue-600 mb-2">
            <Users className="w-8 h-8 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-blue-900 mb-1">
            Bienvenue dans le dashboard administrateur
          </h3>
          <p className="text-blue-700 text-sm">
            Les statistiques apparaîtront dès que les premiers utilisateurs et propriétés seront ajoutés à la plateforme.
          </p>
        </div>
      )}
      {/* Utilisateurs totaux */}
      <StatCard
        title="Utilisateurs totaux"
        value={stats.totalUsers}
        subtitle={`${stats.newUsersThisMonth} nouveaux ce mois`}
        icon={Users}
        color="blue"
        trend={{
          value: userGrowthPercent,
          isPositive: true
        }}
      />

      {/* Propriétés actives */}
      <StatCard
        title="Propriétés actives"
        value={stats.activeProperties}
        subtitle={`${stats.totalProperties} au total`}
        icon={Building2}
        color="green"
        trend={{
          value: propertyGrowthPercent,
          isPositive: true
        }}
      />

      {/* Vues totales */}
      <StatCard
        title="Vues totales"
        value={stats.totalViews}
        subtitle="Toutes les propriétés"
        icon={Eye}
        color="purple"
      />

      {/* Demandes de visite */}
      <StatCard
        title="Demandes de visite"
        value={stats.totalVisitRequests}
        subtitle={`${stats.pendingVisitRequests} en attente`}
        icon={Calendar}
        color="yellow"
      />

      {/* Signalements */}
      <StatCard
        title="Signalements"
        value={stats.totalReports}
        subtitle="Propriétés signalées"
        icon={AlertTriangle}
        color="red"
      />

      {/* Prix moyen */}
      <StatCard
        title="Prix moyen"
        value={`${Math.round(stats.avgPropertyPrice / 1000000)}M FCFA`}
        subtitle="Par propriété"
        icon={Star}
        color="green"
      />

      {/* Agents */}
      <StatCard
        title="Agents actifs"
        value={stats.totalAgents}
        subtitle={`${stats.totalAcheteurs} acheteurs`}
        icon={Users}
        color="blue"
      />

      {/* Propriétés en attente */}
      <StatCard
        title="En attente"
        value={stats.pendingProperties}
        subtitle="Propriétés à valider"
        icon={AlertTriangle}
        color="red"
      />
    </div>
  );
}