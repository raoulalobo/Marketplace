// Composant de carte de métrique avec explications pour agents immobiliers
'use client';

import { ReactNode } from 'react';
import { Info, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description: string;
  explanation: string;
  performanceLevel: 'good' | 'average' | 'poor';
  recommendations?: string[];
  className?: string;
}

// Fonction pour déterminer le niveau de performance basé sur le type de métrique
export function getPerformanceLevel(metricType: string, value: number): 'good' | 'average' | 'poor' {
  switch (metricType) {
    case 'time':
      // Temps moyen en secondes
      if (value >= 60) return 'good';
      if (value >= 30) return 'average';
      return 'poor';
    
    case 'bounce':
      // Taux de rebond en pourcentage
      if (value <= 40) return 'good';
      if (value <= 70) return 'average';
      return 'poor';
    
    case 'scroll':
      // Profondeur de scroll en pourcentage
      if (value >= 60) return 'good';
      if (value >= 30) return 'average';
      return 'poor';
    
    case 'sessions':
      // Nombre de sessions
      if (value >= 10) return 'good';
      if (value >= 3) return 'average';
      return 'poor';
    
    default:
      return 'average';
  }
}

// Fonction pour générer des recommandations basées sur les métriques
export function getRecommendations(metricType: string, performanceLevel: 'good' | 'average' | 'poor', value: number): string[] {
  const recommendations: string[] = [];
  
  switch (metricType) {
    case 'time':
      if (performanceLevel === 'poor') {
        recommendations.push("Ajoutez plus de photos de qualité pour retenir l'attention");
        recommendations.push("Enrichissez la description avec des détails attractifs");
        recommendations.push("Mettez en avant les points forts de la propriété dès le début");
      } else if (performanceLevel === 'average') {
        recommendations.push("Ajoutez une visite virtuelle ou plus de photos");
        recommendations.push("Détaillez les commodités et l'environnement");
      }
      break;
    
    case 'bounce':
      if (performanceLevel === 'poor') {
        recommendations.push("Votre première photo doit être exceptionnelle");
        recommendations.push("Vérifiez que le prix affiché est attractif");
        recommendations.push("Rédigez une description accrocheuse dès les premières lignes");
      } else if (performanceLevel === 'average') {
        recommendations.push("Optimisez l'ordre de vos photos");
        recommendations.push("Ajoutez des informations sur le quartier");
      }
      break;
    
    case 'scroll':
      if (performanceLevel === 'poor') {
        recommendations.push("Structurez mieux votre description avec des titres");
        recommendations.push("Placez les informations importantes en haut");
        recommendations.push("Réduisez les textes trop longs");
      } else if (performanceLevel === 'average') {
        recommendations.push("Ajoutez des points à puces pour faciliter la lecture");
        recommendations.push("Intégrez plus de visuels dans la description");
      }
      break;
    
    case 'sessions':
      if (performanceLevel === 'poor') {
        recommendations.push("Vérifiez la visibilité de votre annonce");
        recommendations.push("Partagez votre propriété sur les réseaux sociaux");
        recommendations.push("Optimisez le titre pour les recherches");
      } else if (performanceLevel === 'average') {
        recommendations.push("Ajoutez plus de mots-clés dans la description");
        recommendations.push("Mettez à jour régulièrement votre annonce");
      }
      break;
  }
  
  if (performanceLevel === 'good') {
    recommendations.push("Excellent ! Continuez sur cette lancée");
    recommendations.push("Partagez ces bonnes pratiques sur vos autres propriétés");
  }
  
  return recommendations;
}

export function MetricCard({
  title,
  value,
  icon,
  description,
  explanation,
  performanceLevel,
  recommendations = [],
  className = ""
}: MetricCardProps) {
  
  // Styles basés sur le niveau de performance
  const performanceStyles = {
    good: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      iconColor: 'text-green-600',
      trendIcon: <TrendingUp className="w-4 h-4 text-green-600" />
    },
    average: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200', 
      iconColor: 'text-yellow-600',
      trendIcon: <Minus className="w-4 h-4 text-yellow-600" />
    },
    poor: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-600',
      trendIcon: <TrendingDown className="w-4 h-4 text-red-600" />
    }
  };
  
  const styles = performanceStyles[performanceLevel];
  
  return (
    <div className={`relative p-4 rounded-lg border-2 ${styles.bgColor} ${styles.borderColor} ${className}`}>
      {/* En-tête avec icône et tendance */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={styles.iconColor}>
            {icon}
          </div>
          <h3 className="font-medium text-gray-900">{title}</h3>
        </div>
        {styles.trendIcon}
      </div>
      
      {/* Valeur principale */}
      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        <span className="text-sm text-gray-600">{description}</span>
      </div>
      
      {/* Explication simple */}
      <div className="mb-3">
        <div className="flex items-start gap-2 text-sm text-gray-700">
          <Info className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0" />
          <p>{explanation}</p>
        </div>
      </div>
      
      {/* Recommandations si présentes */}
      {recommendations.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-600 mb-1">💡 Conseils :</p>
          {recommendations.map((rec, index) => (
            <div key={index} className="text-xs text-gray-600 pl-2 border-l-2 border-gray-200">
              {rec}
            </div>
          ))}
        </div>
      )}
      
      {/* Badge de performance */}
      <div className="absolute top-2 right-2">
        <span className={`
          px-2 py-1 text-xs rounded-full font-medium
          ${performanceLevel === 'good' ? 'bg-green-100 text-green-800' : ''}
          ${performanceLevel === 'average' ? 'bg-yellow-100 text-yellow-800' : ''}
          ${performanceLevel === 'poor' ? 'bg-red-100 text-red-800' : ''}
        `}>
          {performanceLevel === 'good' && '✓ Bon'}
          {performanceLevel === 'average' && '◐ Moyen'}
          {performanceLevel === 'poor' && '⚠ À améliorer'}
        </span>
      </div>
    </div>
  );
}

// Composants spécialisés pour chaque type de métrique
interface SessionsMetricProps {
  value: number;
  className?: string;
}

export function SessionsMetric({ value, className }: SessionsMetricProps) {
  const performanceLevel = getPerformanceLevel('sessions', value);
  const recommendations = getRecommendations('sessions', performanceLevel, value);
  
  return (
    <MetricCard
      title="Sessions totales"
      value={value}
      icon={<Info className="w-5 h-5" />}
      description="visiteurs uniques"
      explanation="Nombre de personnes différentes qui ont consulté votre propriété. Plus il y en a, plus votre annonce est visible."
      performanceLevel={performanceLevel}
      recommendations={recommendations}
      className={className}
    />
  );
}

interface TimeMetricProps {
  value: number; // en secondes
  className?: string;
}

export function TimeMetric({ value, className }: TimeMetricProps) {
  const performanceLevel = getPerformanceLevel('time', value);
  const recommendations = getRecommendations('time', performanceLevel, value);
  
  // Formatter le temps en minutes et secondes
  const formatTime = (seconds: number) => {
    if (seconds >= 60) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  };
  
  return (
    <MetricCard
      title="Temps moyen"
      value={formatTime(value)}
      icon={<Info className="w-5 h-5" />}
      description="temps de consultation"
      explanation="Durée moyenne que les visiteurs passent à regarder votre annonce. Plus c'est long, plus ils sont intéressés !"
      performanceLevel={performanceLevel}
      recommendations={recommendations}
      className={className}
    />
  );
}

interface ScrollMetricProps {
  value: number; // en pourcentage
  className?: string;
}

export function ScrollMetric({ value, className }: ScrollMetricProps) {
  const performanceLevel = getPerformanceLevel('scroll', value);
  const recommendations = getRecommendations('scroll', performanceLevel, value);
  
  return (
    <MetricCard
      title="Scroll moyen"
      value={`${value}%`}
      icon={<Info className="w-5 h-5" />}
      description="de l'annonce lue"
      explanation="Pourcentage de votre annonce que les visiteurs lisent en moyenne. 100% signifie qu'ils voient tout !"
      performanceLevel={performanceLevel}
      recommendations={recommendations}
      className={className}
    />
  );
}

interface BounceMetricProps {
  value: number; // en pourcentage
  className?: string;
}

export function BounceMetric({ value, className }: BounceMetricProps) {
  const performanceLevel = getPerformanceLevel('bounce', value);
  const recommendations = getRecommendations('bounce', performanceLevel, value);
  
  return (
    <MetricCard
      title="Taux de rebond"
      value={`${value}%`}
      icon={<Info className="w-5 h-5" />}
      description="de départs rapides"
      explanation="Pourcentage de visiteurs qui repartent très vite (moins de 30 secondes). Plus c'est bas, mieux c'est !"
      performanceLevel={performanceLevel}
      recommendations={recommendations}
      className={className}
    />
  );
}