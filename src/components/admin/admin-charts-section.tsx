// Section des graphiques pour le dashboard admin
'use client';

import { Card } from '@/components/ui/card';

interface AdminChartsSectionProps {
  stats: {
    usersGrowth: Array<{ date: string; users: number }>;
    propertiesGrowth: Array<{ date: string; properties: number }>;
    propertiesByCity: Array<{ city: string; count: number; avgPrice: number }>;
    propertiesByType: Array<{ type: string; count: number; avgPrice: number }>;
    // Pas de usersByCity car c'était des données simulées
  };
}

// Composant de graphique simple avec barres CSS
function SimpleBarChart({ 
  data, 
  title, 
  valueKey, 
  labelKey 
}: { 
  data: any[]; 
  title: string; 
  valueKey: string; 
  labelKey: string;
}) {
  // Vérification défensive
  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="text-gray-500 text-center py-8">Aucune donnée disponible</div>
      </Card>
    );
  }

  const maxValue = Math.max(...data.map(item => item[valueKey] || 0));
  
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="w-20 text-sm text-gray-600 truncate">
              {item[labelKey]}
            </div>
            <div className="flex-1 bg-gray-200 rounded-full h-3 relative">
              <div
                className="bg-blue-500 h-3 rounded-full transition-all duration-500"
                style={{
                  width: `${(item[valueKey] / maxValue) * 100}%`
                }}
              />
            </div>
            <div className="w-16 text-sm font-medium text-gray-900 text-right">
              {item[valueKey].toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// Graphique linéaire simple avec CSS
function SimpleLineChart({ 
  data, 
  title, 
  valueKey, 
  labelKey 
}: { 
  data: any[]; 
  title: string; 
  valueKey: string; 
  labelKey: string;
}) {
  // Vérification défensive
  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <div className="text-gray-500 text-center py-8">Aucune donnée disponible</div>
      </Card>
    );
  }

  const maxValue = Math.max(...data.map(item => item[valueKey] || 0));
  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - (item[valueKey] / maxValue) * 80; // 80% de la hauteur pour laisser de la marge
    return `${x},${y}`;
  }).join(' ');

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="h-64 relative">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Lignes de grille */}
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e5e7eb" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
          
          {/* Ligne de données */}
          <polyline
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            points={points}
          />
          
          {/* Points */}
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - (item[valueKey] / maxValue) * 80;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="1.5"
                fill="#3b82f6"
              />
            );
          })}
        </svg>
        
        {/* Valeurs sur les axes */}
        <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 mt-2">
          <span>{data[0]?.[labelKey]}</span>
          <span>{data[Math.floor(data.length / 2)]?.[labelKey]}</span>
          <span>{data[data.length - 1]?.[labelKey]}</span>
        </div>
      </div>
    </Card>
  );
}

export function AdminChartsSection({ stats }: AdminChartsSectionProps) {
  // Vérifications défensives pour éviter les erreurs
  if (!stats) {
    return <div className="text-gray-500 text-center py-8">Aucune donnée disponible pour les graphiques</div>;
  }

  // Préparer les données pour les graphiques avec vérifications
  const last7DaysUsers = (stats.usersGrowth || []).slice(-7).map(item => ({
    date: new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    users: item.users
  }));

  const last7DaysProperties = (stats.propertiesGrowth || []).slice(-7).map(item => ({
    date: new Date(item.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    properties: item.properties
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Croissance des utilisateurs */}
      <SimpleLineChart
        data={last7DaysUsers}
        title="Évolution des utilisateurs (7 derniers jours)"
        valueKey="users"
        labelKey="date"
      />

      {/* Croissance des propriétés */}
      <SimpleLineChart
        data={last7DaysProperties}
        title="Évolution des propriétés (7 derniers jours)"
        valueKey="properties"
        labelKey="date"
      />

      {/* Propriétés par ville */}
      <SimpleBarChart
        data={(stats.propertiesByCity || []).slice(0, 5)}
        title="Propriétés par ville"
        valueKey="count"
        labelKey="city"
      />

      {/* Propriétés par type */}
      <SimpleBarChart
        data={stats.propertiesByType || []}
        title="Propriétés par type"
        valueKey="count"
        labelKey="type"
      />
    </div>
  );
}