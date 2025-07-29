// Composant pour afficher les alertes et recommandations immobilières en temps réel
'use client';

import { useState, useEffect } from 'react';
import { 
  AlertTriangle, TrendingUp, Users, Clock, Eye, 
  CheckCircle, Info, ArrowRight, X, Bell,
  Lightbulb, Target, Star, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Alert {
  id: string;
  type: 'opportunity' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  priority: number;
  timestamp: Date;
  actionable: boolean;
  action?: {
    label: string;
    callback: () => void;
  };
}

interface Recommendation {
  id: string;
  type: 'critical' | 'important' | 'suggestion';
  title: string;
  description: string;
  action: string;
  impact: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedImpact: number; // en pourcentage d'amélioration
}

interface RealEstateAlertsProps {
  propertyId: string;
  analytics?: any;
  className?: string;
}

export function RealEstateAlerts({ propertyId, analytics, className = '' }: RealEstateAlertsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'alerts' | 'recommendations'>('alerts');

  useEffect(() => {
    // Générer des alertes basées sur les analytics
    if (analytics) {
      generateRealTimeAlerts(analytics);
      generateRecommendations(analytics);
    } else {
      // Afficher des alertes d'état sans données
      generateInitialAlerts();
      generateInitialRecommendations();
    }
  }, [analytics, propertyId]);

  const generateRealTimeAlerts = (data: any) => {
    const newAlerts: Alert[] = [];

    // Alerte d'opportunité - signaux d'achat élevés
    if (data.intentSignals?.high > 0) {
      newAlerts.push({
        id: 'high-intent-signals',
        type: 'opportunity',
        title: '🔥 Signaux d\'achat détectés !',
        description: `${data.intentSignals.high} visiteurs montrent une forte intention d'achat. Contactez-les rapidement !`,
        priority: 100,
        timestamp: new Date(),
        actionable: true,
        action: {
          label: 'Voir les contacts',
          callback: () => {
            // Redirection vers la liste des contacts intéressés
            window.open(`/dashboard/leads?property=${propertyId}&intent=high`, '_blank');
          }
        }
      });
    }

    // Alerte de performance - taux de rebond élevé
    if (data.bounceRate > 70) {
      newAlerts.push({
        id: 'high-bounce-rate',
        type: 'warning',
        title: '⚠️ Taux de rebond critique',
        description: `${data.bounceRate.toFixed(1)}% des visiteurs quittent immédiatement. Vos photos ou votre prix peuvent rebuter.`,
        priority: 80,
        timestamp: new Date(),
        actionable: true,
        action: {
          label: 'Améliorer l\'annonce',
          callback: () => {
            window.open(`/properties/${propertyId}/edit?focus=photos`, '_blank');
          }
        }
      });
    }

    // Alerte de tendance - engagement inhabituel
    if (data.scrollAnalytics?.completionRate > 50) {
      newAlerts.push({
        id: 'high-engagement',
        type: 'success',
        title: '🎉 Engagement exceptionnel !',
        description: `${data.scrollAnalytics.completionRate.toFixed(1)}% des visiteurs lisent votre annonce en entier. C'est excellent !`,
        priority: 60,
        timestamp: new Date(),
        actionable: false
      });
    }

    // Alerte de conversion - faible performance
    if (data.conversionRate < 2 && data.totalSessions > 10) {
      newAlerts.push({
        id: 'low-conversion',
        type: 'warning',
        title: '📉 Conversion très faible',
        description: `Seulement ${data.conversionRate.toFixed(1)}% de conversion malgré ${data.totalSessions} sessions. Action requise.`,
        priority: 75,
        timestamp: new Date(),
        actionable: true,
        action: {
          label: 'Optimiser la conversion',
          callback: () => {
            // Guide d'optimisation
            window.open(`/dashboard/optimization-guide?property=${propertyId}`, '_blank');
          }
        }
      });
    }

    // Alerte device - optimisation mobile nécessaire
    if (data.engagementMetrics?.deviceBreakdown?.mobile > 70 && data.averageTime < 60) {
      newAlerts.push({
        id: 'mobile-optimization',
        type: 'info',
        title: '📱 Optimisation mobile requise',
        description: '70%+ de votre audience est sur mobile mais l\'engagement est faible. Optimisez pour mobile.',
        priority: 50,
        timestamp: new Date(),
        actionable: true,
        action: {
          label: 'Guide mobile',
          callback: () => {
            window.open('/dashboard/mobile-optimization-guide', '_blank');
          }
        }
      });
    }

    setAlerts(newAlerts);
  };

  const generateInitialAlerts = () => {
    const initialAlerts: Alert[] = [
      {
        id: 'posthog-setup',
        type: 'info',
        title: '📊 Analytics PostHog en cours de configuration',
        description: 'Votre système d\'analytics avancé se met en place. Les premières données apparaîtront après quelques visites.',
        priority: 60,
        timestamp: new Date(),
        actionable: false
      },
      {
        id: 'optimization-ready',
        type: 'success', 
        title: '🚀 Système d\'optimisation prêt !',
        description: 'Votre propriété est équipée d\'un système d\'analytics de niveau entreprise. Les insights détaillés arrivent bientôt.',
        priority: 50,
        timestamp: new Date(),
        actionable: false
      }
    ];
    setAlerts(initialAlerts);
  };

  const generateRecommendations = (data: any) => {
    const newRecommendations: Recommendation[] = [];

    // Recommandation critique - prix
    if (data.bounceRate > 60 && data.averageTime < 30) {
      newRecommendations.push({
        id: 'price-adjustment',
        type: 'critical',
        title: 'Ajustement de prix recommandé',
        description: 'Le taux de rebond élevé et le temps court suggèrent un prix trop élevé pour le marché.',
        action: 'Réduire le prix de 5-10% ou améliorer considérablement les photos',
        impact: 'Peut augmenter l\'engagement de 40-60%',
        difficulty: 'medium',
        estimatedImpact: 45
      });
    }

    // Recommandation importante - photos
    if (data.scrollAnalytics?.milestone25 < data.totalSessions * 0.5) {
      newRecommendations.push({
        id: 'improve-photos',
        type: 'important',
        title: 'Améliorer les photos principales',
        description: 'Moins de 50% des visiteurs scrollent après les premières photos.',
        action: 'Remplacer les 3 premières photos par des images plus attrayantes et professionnelles',
        impact: 'Amélioration de l\'engagement de 25-35%',
        difficulty: 'easy',
        estimatedImpact: 30
      });
    }

    // Recommandation - description
    if (data.scrollAnalytics?.completionRate < 20) {
      newRecommendations.push({
        id: 'optimize-description',
        type: 'important',
        title: 'Raccourcir la description',
        description: 'Peu de visiteurs lisent la description complète.',
        action: 'Mettre les points forts en début et raccourcir à 150-200 mots maximum',
        impact: 'Amélioration de la lecture complète de 15-25%',
        difficulty: 'easy',
        estimatedImpact: 20
      });
    }

    // Recommandation - call-to-action
    if (data.conversionRate < 5 && data.averageTime > 90) {
      newRecommendations.push({
        id: 'improve-cta',
        type: 'suggestion',
        title: 'Renforcer l\'appel à l\'action',
        description: 'Les visiteurs sont engagés mais ne passent pas à l\'action.',
        action: 'Ajouter des boutons de contact plus visibles et urgents ("Visitez avant qu\'il soit trop tard")',
        impact: 'Peut doubler le taux de conversion',
        difficulty: 'easy',
        estimatedImpact: 100
      });
    }

    // Recommandation - timing
    if (data.timeAnalysis?.weeklyTrends) {
      const bestDay = data.timeAnalysis.weeklyTrends.reduce((a: any, b: any) => a.sessions > b.sessions ? a : b);
      if (bestDay.sessions > 5) {
        newRecommendations.push({
          id: 'optimal-timing',
          type: 'suggestion',
          title: 'Optimiser le timing de publication',
          description: `Votre meilleur jour est ${bestDay.day} avec ${bestDay.sessions} sessions.`,
          action: `Publier les mises à jour et relances le ${bestDay.day} pour maximiser la visibilité`,
          impact: 'Augmentation de la visibilité de 20-30%',
          difficulty: 'easy',
          estimatedImpact: 25
        });
      }
    }

    setRecommendations(newRecommendations.sort((a, b) => {
      const priorityOrder = { critical: 3, important: 2, suggestion: 1 };
      return priorityOrder[b.type] - priorityOrder[a.type] || b.estimatedImpact - a.estimatedImpact;
    }));
  };

  const generateInitialRecommendations = () => {
    const initialRecommendations: Recommendation[] = [
      {
        id: 'setup-complete',
        type: 'suggestion',
        title: 'Optimisations automatiques activées',
        description: 'Votre propriété bénéficie maintenant d\'un système d\'analytics avancé avec recommandations automatiques.',
        action: 'Partagez votre annonce pour commencer à collecter des données comportementales précieuses',
        impact: 'Insights détaillés sur le comportement de vos visiteurs',
        difficulty: 'easy',
        estimatedImpact: 50
      },
      {
        id: 'posthog-features',
        type: 'suggestion', 
        title: 'Fonctionnalités analytics disponibles',
        description: 'Session recording, heatmaps, funnels de conversion et signaux d\'achat automatiquement détectés.',
        action: 'Les données apparaîtront dans les onglets Vue d\'ensemble, Comportement, Entonnoir et Temporel',
        impact: 'Vision complète du parcours de vos visiteurs',
        difficulty: 'easy',
        estimatedImpact: 75
      }
    ];
    setRecommendations(initialRecommendations);
  };

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <Star className="w-5 h-5 text-yellow-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'info': return <Info className="w-5 h-5 text-blue-600" />;
      default: return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'critical': return <Zap className="w-5 h-5 text-red-600" />;
      case 'important': return <Target className="w-5 h-5 text-orange-600" />;
      case 'suggestion': return <Lightbulb className="w-5 h-5 text-blue-600" />;
      default: return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const activeAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.id));

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      <div className="p-6 border-b">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-4">
          <Bell className="w-6 h-6 text-blue-600" />
          Alertes & Recommandations Temps Réel
        </h3>
        
        {/* Navigation des onglets */}
        <div className="flex gap-4">
          <Button
            variant={activeTab === 'alerts' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('alerts')}
            className="flex items-center gap-2"
          >
            <Bell className="w-4 h-4" />
            Alertes ({activeAlerts.length})
          </Button>
          <Button
            variant={activeTab === 'recommendations' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('recommendations')}
            className="flex items-center gap-2"
          >
            <Lightbulb className="w-4 h-4" />
            Recommandations ({recommendations.length})
          </Button>
        </div>
      </div>

      <div className="p-6">
        {/* Onglet Alertes */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            {activeAlerts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
                <p className="text-lg font-medium">Aucune alerte !</p>
                <p className="text-sm">Votre propriété performe bien.</p>
              </div>
            ) : (
              activeAlerts.map(alert => (
                <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${
                  alert.type === 'opportunity' ? 'border-yellow-400 bg-yellow-50' :
                  alert.type === 'warning' ? 'border-red-400 bg-red-50' :
                  alert.type === 'success' ? 'border-green-400 bg-green-50' :
                  'border-blue-400 bg-blue-50'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 mb-1">{alert.title}</h4>
                        <p className="text-sm text-gray-700 mb-3">{alert.description}</p>
                        {alert.actionable && alert.action && (
                          <Button
                            size="sm"
                            onClick={alert.action.callback}
                            className="flex items-center gap-2"
                          >
                            {alert.action.label}
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => dismissAlert(alert.id)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Onglet Recommandations */}
        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            {recommendations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Star className="w-12 h-12 mx-auto mb-3 text-yellow-400" />
                <p className="text-lg font-medium">Aucune recommandation !</p>
                <p className="text-sm">Votre annonce est bien optimisée.</p>
              </div>
            ) : (
              recommendations.map(rec => (
                <div key={rec.id} className="p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-start gap-3">
                    {getRecommendationIcon(rec.type)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                        <Badge variant="outline" className={getDifficultyColor(rec.difficulty)}>
                          {rec.difficulty === 'easy' ? 'Facile' : rec.difficulty === 'medium' ? 'Moyen' : 'Difficile'}
                        </Badge>
                        <Badge variant="outline" className="bg-purple-100 text-purple-800">
                          +{rec.estimatedImpact}%
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                      <div className="bg-white p-3 rounded border-l-4 border-blue-400 mb-2">
                        <p className="text-sm font-medium text-gray-900 mb-1">Action recommandée :</p>
                        <p className="text-sm text-gray-700">{rec.action}</p>
                      </div>
                      <p className="text-xs text-green-700 font-medium">💡 Impact attendu : {rec.impact}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}