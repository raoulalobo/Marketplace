// Section des activités récentes pour le dashboard admin
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Clock, UserPlus, Home, Calendar } from 'lucide-react';

interface RecentActivitiesProps {
  activities: Array<{
    type: 'USER_REGISTERED' | 'PROPERTY_ADDED' | 'VISIT_REQUESTED';
    description: string;
    timestamp: string;
    userId?: string;
    propertyId?: string;
  }>;
  isEmpty?: boolean;
  emptyMessage?: string;
}

export function RecentActivities({ activities, isEmpty, emptyMessage }: RecentActivitiesProps) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'USER_REGISTERED':
        return <UserPlus className="w-4 h-4 text-blue-500" />;
      case 'PROPERTY_ADDED':
        return <Home className="w-4 h-4 text-green-500" />;
      case 'VISIT_REQUESTED':
        return <Calendar className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `Il y a ${diffInMinutes} min`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `Il y a ${hours}h`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `Il y a ${days}j`;
    }
  };

  if (!activities || activities.length === 0 || isEmpty) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Activités récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              {emptyMessage || "Aucune activité récente pour le moment"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center space-x-2">
          <Clock className="w-5 h-5 text-gray-500" />
          <span>Activités récentes</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-start space-x-3">
              {/* Icône de l'activité */}
              <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                {getActivityIcon(activity.type)}
              </div>
              
              {/* Contenu de l'activité */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatTimeAgo(activity.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
        
        {/* Lien pour voir plus */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Voir toutes les activités
          </button>
        </div>
      </CardContent>
    </Card>
  );
}