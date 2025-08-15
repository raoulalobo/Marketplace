// Section des meilleurs agents pour le dashboard admin
'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Star, Building2, Eye, DollarSign } from 'lucide-react';

interface TopAgentsSectionProps {
  agents: Array<{
    id: string;
    name: string;
    propertiesCount: number;
    totalViews: number;
  }>;
  isEmpty?: boolean;
  emptyMessage?: string;
}

export function TopAgentsSection({ agents, isEmpty, emptyMessage }: TopAgentsSectionProps) {
  if (!agents || agents.length === 0 || isEmpty) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              {emptyMessage || "Aucun agent trouvé pour le moment"}
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
          <Star className="w-5 h-5 text-yellow-500" />
          <span>Top Agents</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {agents.map((agent, index) => (
            <div
              key={agent.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                {/* Rang */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-yellow-500 text-white' :
                  index === 1 ? 'bg-gray-400 text-white' :
                  index === 2 ? 'bg-orange-500 text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                
                {/* Informations agent */}
                <div>
                  <h4 className="font-medium text-gray-900">{agent.name}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                    <div className="flex items-center space-x-1">
                      <Building2 className="w-4 h-4" />
                      <span>{agent.propertiesCount} biens</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{agent.totalViews.toLocaleString()} vues</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}