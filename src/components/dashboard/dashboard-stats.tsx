// Composants de statistiques pour le dashboard
'use client';

import React, { useMemo } from 'react';
import { 
  Home, 
  Eye, 
  MessageSquare, 
  TrendingUp, 
  DollarSign, 
  MapPin,
  Building
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  description,
  trend,
  className = '',
}) => {
  const formattedValue = useMemo(() => {
    if (typeof value === 'number') {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
      }
      return value.toLocaleString('fr-FR');
    }
    return value;
  }, [value]);

  return (
    <Card className={`group hover:shadow-lg transition-all duration-200 hover:-translate-y-1 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
              {formattedValue}
            </p>
            {description && (
              <p className="text-xs text-gray-500 mt-1">
                {description}
              </p>
            )}
            {trend && (
              <div className="flex items-center mt-2">
                <TrendingUp 
                  className={`w-4 h-4 mr-1 transition-transform group-hover:scale-110 ${
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}
                />
                <span className={`text-sm font-medium ${
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                }`}>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
              </div>
            )}
          </div>
          <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-200">
            <div className="group-hover:scale-110 transition-transform duration-200">
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface QuickActionsProps {
  onAddProperty?: () => void;
  onViewProperties?: () => void;
  onViewVisits?: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onAddProperty,
  onViewProperties,
  onViewVisits,
}) => {
  const actions = useMemo(() => [
    {
      label: 'Ajouter une propriété',
      icon: <Building className="w-4 h-4" />,
      onClick: onAddProperty,
      variant: 'default' as const,
      href: '/properties/add',
    },
    {
      label: 'Mes propriétés',
      icon: <Home className="w-4 h-4" />,
      onClick: onViewProperties,
      variant: 'outline' as const,
      href: '/dashboard/properties',
    },
    {
      label: 'Demandes de visite',
      icon: <MessageSquare className="w-4 h-4" />,
      onClick: onViewVisits,
      variant: 'outline' as const,
      href: '/dashboard/visits',
    },
  ], [onAddProperty, onViewProperties, onViewVisits]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Actions rapides</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {actions.map((action, index) => (
            <a
              key={index}
              href={action.href}
              onClick={action.onClick}
              className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                action.variant === 'default'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {action.icon}
              <span className="ml-2">{action.label}</span>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

interface PerformanceMetricsProps {
  stats: {
    avgPrice: number;
  };
}

export const PerformanceMetrics: React.FC<PerformanceMetricsProps> = ({ stats }) => {
  const metrics = useMemo(() => [
    {
      title: 'Prix moyen',
      value: formatCurrency(stats.avgPrice),
      icon: <DollarSign className="w-5 h-5 text-blue-600" />,
      description: 'De vos propriétés',
    },
  ], [stats]);

  return (
    <div className="grid grid-cols-1 gap-4">
      {metrics.map((metric, index) => (
        <StatsCard
          key={index}
          title={metric.title}
          value={metric.value}
          icon={metric.icon}
          description={metric.description}
        />
      ))}
    </div>
  );
};

interface PropertyDistributionProps {
  propertiesByCity: Array<{ city: string; count: number }>;
  propertiesByType: Array<{ type: string; count: number; avgPrice: number }>;
}

export const PropertyDistribution: React.FC<PropertyDistributionProps> = ({
  propertiesByCity,
  propertiesByType,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Distribution par ville */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Par ville
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {propertiesByCity.slice(0, 5).map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{item.city}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(item.count / Math.max(...propertiesByCity.map(p => p.count))) * 100}%`
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Distribution par type */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building className="w-5 h-5" />
            Par type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {propertiesByType.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-700">{item.type}</span>
                  <p className="text-xs text-gray-500">
                    {formatCurrency(item.avgPrice)}
                  </p>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Utilitaire de formatage
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};