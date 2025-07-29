// Hook pour générer des insights immobiliers à partir des données PostHog
'use client';

import { useMemo } from 'react';

interface PostHogEvent {
  event: string;
  timestamp: string;
  properties: {
    property_id?: string;
    session_id?: string;
    total_time?: number;
    active_time?: number;
    scroll_depth?: number;
    user_id?: string;
    user_role?: string;
    engagement_type?: string;
    intent_level?: string;
    milestone?: string;
    device_type?: string;
    time_before_engagement?: number;
    [key: string]: any;
  };
}

interface PropertyAnalytics {
  totalViews: number;
  totalSessions: number;
  averageTime: number;
  bounceRate: number;
  conversionRate: number;
  dailyTrends: Array<{
    date: string;
    sessions: number;
    averageTime: number;
  }>;
  userTypes: {
    authenticated: number;
    anonymous: number;
  };
}

export interface RealEstateInsights {
  // Métriques de performance
  performanceScore: number; // 0-100
  engagementLevel: 'low' | 'medium' | 'high';
  
  // Analyse comportementale
  scrollEngagement: {
    averageDepth: number;
    milestone25: number;
    milestone50: number;
    milestone75: number;
    completionRate: number;
  };
  
  // Intentions d'achat
  purchaseIntent: {
    totalSignals: number;
    highIntentSessions: number;
    mediumIntentSessions: number;
    lowIntentSessions: number;
    averageTimeToIntent: number;
  };
  
  // Insights device
  deviceAnalytics: {
    mobilePercentage: number;
    tabletPercentage: number;
    desktopPercentage: number;
    bestPerformingDevice: string;
  };
  
  // Recommandations
  recommendations: Array<{
    type: 'critical' | 'important' | 'suggestion';
    title: string;
    description: string;
    action: string;
    impact: string;
  }>;
  
  // Alertes
  alerts: Array<{
    type: 'opportunity' | 'warning' | 'info';
    title: string;
    description: string;
    priority: number;
  }>;
  
  // Prédictions
  predictions: {
    likelyToSell: number; // 0-100%
    optimalPriceRange: { min: number; max: number } | null;
    bestActionTime: string;
    expectedDaysToSell: number;
  };
}

export function useRealEstateInsights(
  analytics: PropertyAnalytics | null,
  events: PostHogEvent[] = [],
  propertyData?: {
    prix: number;
    superficie: number;
    type: string;
    createdAt: string;
  }
): RealEstateInsights | null {
  
  return useMemo(() => {
    if (!analytics) return null;
    
    // Analyser les événements de scroll
    const scrollEvents = events.filter(e => 
      e.event === 'property_scroll_milestone' || e.event === 'property_scroll_complete'
    );
    
    const scrollMilestones = {
      '25%': scrollEvents.filter(e => e.properties.milestone === '25%').length,
      '50%': scrollEvents.filter(e => e.properties.milestone === '50%').length,
      '75%': scrollEvents.filter(e => e.properties.milestone === '75%').length,
      '90%': scrollEvents.filter(e => e.event === 'property_scroll_complete').length,
    };
    
    const scrollEngagement = {
      averageDepth: analytics.totalSessions > 0 ? 
        scrollEvents.reduce((sum, e) => sum + (parseFloat(e.properties.milestone?.replace('%', '') || '0') || 0), 0) / scrollEvents.length : 0,
      milestone25: scrollMilestones['25%'],
      milestone50: scrollMilestones['50%'],
      milestone75: scrollMilestones['75%'],
      completionRate: analytics.totalSessions > 0 ? (scrollMilestones['90%'] / analytics.totalSessions) * 100 : 0
    };
    
    // Analyser les intentions d'achat
    const intentEvents = events.filter(e => e.event === 'property_purchase_intent');
    const purchaseIntent = {
      totalSignals: intentEvents.length,
      highIntentSessions: intentEvents.filter(e => e.properties.intent_level === 'high').length,
      mediumIntentSessions: intentEvents.filter(e => e.properties.intent_level === 'medium').length,
      lowIntentSessions: intentEvents.filter(e => e.properties.intent_level === 'low').length,
      averageTimeToIntent: intentEvents.length > 0 ? 
        intentEvents.reduce((sum, e) => sum + (e.properties.session_duration_at_intent || 0), 0) / intentEvents.length : 0
    };
    
    // Analyser les devices
    const engagementEvents = events.filter(e => e.event === 'property_engagement');
    const deviceCounts = {
      mobile: engagementEvents.filter(e => e.properties.device_type === 'mobile').length,
      tablet: engagementEvents.filter(e => e.properties.device_type === 'tablet').length,
      desktop: engagementEvents.filter(e => e.properties.device_type === 'desktop').length,
    };
    
    const totalDeviceEvents = deviceCounts.mobile + deviceCounts.tablet + deviceCounts.desktop;
    const deviceAnalytics = {
      mobilePercentage: totalDeviceEvents > 0 ? (deviceCounts.mobile / totalDeviceEvents) * 100 : 0,
      tabletPercentage: totalDeviceEvents > 0 ? (deviceCounts.tablet / totalDeviceEvents) * 100 : 0,
      desktopPercentage: totalDeviceEvents > 0 ? (deviceCounts.desktop / totalDeviceEvents) * 100 : 0,
      bestPerformingDevice: Object.entries(deviceCounts).reduce((a, b) => deviceCounts[a[0] as keyof typeof deviceCounts] > deviceCounts[b[0] as keyof typeof deviceCounts] ? a : b)[0]
    };
    
    // Calculer le score de performance (0-100)
    let performanceScore = 0;
    performanceScore += Math.min((analytics.averageTime / 120) * 30, 30); // Temps moyen (max 30 points)
    performanceScore += Math.min(analytics.conversionRate * 2, 25); // Conversion (max 25 points)
    performanceScore += Math.min((100 - analytics.bounceRate) * 0.25, 25); // Anti-rebond (max 25 points)
    performanceScore += Math.min(scrollEngagement.completionRate * 0.2, 20); // Scroll completion (max 20 points)
    
    const engagementLevel: 'low' | 'medium' | 'high' = 
      performanceScore >= 70 ? 'high' :
      performanceScore >= 40 ? 'medium' : 'low';
    
    // Générer des recommandations
    const recommendations: RealEstateInsights['recommendations'] = [];
    
    if (analytics.bounceRate > 60) {
      recommendations.push({
        type: 'critical',
        title: 'Taux de rebond élevé',
        description: `${analytics.bounceRate.toFixed(1)}% des visiteurs quittent rapidement`,
        action: 'Améliorer les photos principales et revoir le prix',
        impact: 'Peut augmenter l\'engagement de 30-50%'
      });
    }
    
    if (scrollEngagement.completionRate < 20) {
      recommendations.push({
        type: 'important',
        title: 'Faible lecture complète',
        description: 'Peu de visiteurs lisent l\'annonce en entier',
        action: 'Raccourcir la description et mettre les atouts en début',
        impact: 'Amélioration de la conversion de 15-25%'
      });
    }
    
    if (analytics.conversionRate < 5 && analytics.totalSessions > 10) {
      recommendations.push({
        type: 'important',
        title: 'Faible taux de conversion',
        description: 'Peu de visiteurs contactent pour cette propriété',
        action: 'Rendre le bouton de contact plus visible et simplifier le processus',
        impact: 'Peut doubler le nombre de contacts'
      });
    }
    
    if (deviceAnalytics.mobilePercentage > 70 && analytics.averageTime < 60) {
      recommendations.push({
        type: 'suggestion',
        title: 'Optimisation mobile nécessaire',
        description: 'Forte audience mobile mais faible engagement',
        action: 'Optimiser les images et la navigation pour mobile',
        impact: 'Amélioration de l\'engagement mobile de 20-30%'
      });
    }
    
    // Générer des alertes
    const alerts: RealEstateInsights['alerts'] = [];
    
    if (purchaseIntent.highIntentSessions > 0) {
      alerts.push({
        type: 'opportunity',
        title: 'Signaux d\'achat détectés !',
        description: `${purchaseIntent.highIntentSessions} sessions avec forte intention d'achat`,
        priority: 100
      });
    }
    
    if (analytics.totalSessions > 20 && analytics.conversionRate < 2) {
      alerts.push({
        type: 'warning',
        title: 'Performance en baisse',
        description: 'Beaucoup de trafic mais très peu de conversions',
        priority: 80
      });
    }
    
    if (analytics.averageTime > 180 && analytics.conversionRate > 10) {
      alerts.push({
        type: 'info',
        title: 'Propriété très attractive',
        description: 'Engagement élevé et bon taux de conversion',
        priority: 60
      });
    }
    
    // Prédictions basées sur les données
    const daysSinceCreation = propertyData ? 
      Math.ceil((Date.now() - new Date(propertyData.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 1;
    
    const likelyToSell = Math.min(
      Math.max(
        (performanceScore * 0.6) + 
        (analytics.conversionRate * 3) + 
        (purchaseIntent.highIntentSessions * 5), 
        0
      ), 
      100
    );
    
    const expectedDaysToSell = Math.max(
      30 - (performanceScore * 0.3) - (analytics.conversionRate * 2),
      7
    );
    
    const predictions = {
      likelyToSell,
      optimalPriceRange: null, // À implémenter avec données marché
      bestActionTime: purchaseIntent.totalSignals > 0 ? 'Maintenant - signaux d\'intérêt détectés' : 'Dans les 24-48h',
      expectedDaysToSell: Math.round(expectedDaysToSell)
    };
    
    return {
      performanceScore: Math.round(performanceScore),
      engagementLevel,
      scrollEngagement,
      purchaseIntent,
      deviceAnalytics,
      recommendations: recommendations.sort((a, b) => {
        const priority = { critical: 3, important: 2, suggestion: 1 };
        return priority[b.type] - priority[a.type];
      }),
      alerts: alerts.sort((a, b) => b.priority - a.priority),
      predictions
    };
  }, [analytics, events, propertyData]);
}