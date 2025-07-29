'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronRight, TrendingUp, Users, Clock, Activity, Target, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

interface MetricExplanation {
  title: string;
  icon: React.ReactNode;
  description: string;
  goodExample: string;
  badExample: string;
  tips: string[];
}

const metricsExplanations: MetricExplanation[] = [
  {
    title: "Sessions totales",
    icon: <Users className="w-5 h-5" />,
    description: "Le nombre de visiteurs uniques qui ont consulté votre propriété.",
    goodExample: "15 sessions = 15 personnes différentes ont regardé votre annonce",
    badExample: "2 sessions = très peu de visibilité, votre annonce est peu vue",
    tips: [
      "Partagez votre annonce sur les réseaux sociaux",
      "Optimisez le titre avec des mots-clés recherchés",
      "Vérifiez que vos photos de couverture sont attractives",
      "Mettez à jour régulièrement votre annonce"
    ]
  },
  {
    title: "Temps moyen de consultation",
    icon: <Clock className="w-5 h-5" />,
    description: "Combien de temps en moyenne les visiteurs passent sur votre annonce.",
    goodExample: "2m 30s = les visiteurs sont vraiment intéressés par votre propriété",
    badExample: "15s = les visiteurs repartent très vite, quelque chose ne va pas",
    tips: [
      "Ajoutez plus de photos de qualité",
      "Rédigez une description détaillée et attrayante",
      "Mettez en avant les points forts de votre propriété",
      "Assurez-vous que le prix est cohérent avec le marché"
    ]
  },
  {
    title: "Niveau de scroll moyen",
    icon: <Activity className="w-5 h-5" />,
    description: "Jusqu'où les visiteurs descendent sur votre page (en pourcentage).",
    goodExample: "80% = les visiteurs lisent votre annonce jusqu'au bout",
    badExample: "20% = les visiteurs ne scrollent pas, ils ne voient que le début",
    tips: [
      "Structurez votre description avec des paragraphes courts",
      "Placez les informations importantes en haut",
      "Utilisez des puces pour les caractéristiques",
      "Ajoutez des photos tout au long de la description"
    ]
  },
  {
    title: "Taux de rebond",
    icon: <TrendingUp className="w-5 h-5" />,
    description: "Pourcentage de visiteurs qui repartent rapidement (moins de 30 secondes).",
    goodExample: "25% = la plupart des visiteurs restent pour consulter votre annonce",
    badExample: "80% = les visiteurs repartent immédiatement, c'est problématique",
    tips: [
      "Améliorez votre première photo (c'est la première impression)",
      "Vérifiez que votre prix n'est pas trop élevé",
      "Assurez-vous que le titre correspond bien à la propriété",
      "Rédigez un début de description accrocheur"
    ]
  }
];

export function MetricsHelpSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedMetric, setExpandedMetric] = useState<number | null>(null);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      {/* En-tête cliquable */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left"
      >
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900">
            Comment interpréter vos données de performance ?
          </h3>
        </div>
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-blue-600" />
        ) : (
          <ChevronRight className="w-5 h-5 text-blue-600" />
        )}
      </button>

      {/* Contenu expansible */}
      {isOpen && (
        <div className="mt-4 space-y-4">
          {/* Introduction */}
          <div className="text-sm text-blue-800 bg-blue-100 p-3 rounded">
            <p className="mb-2">
              <strong>🎯 Objectif :</strong> Vous aider à comprendre si vos annonces attirent et retiennent l'attention des acheteurs potentiels.
            </p>
            <p>
              <strong>💡 Conseil :</strong> Cliquez sur chaque métrique ci-dessous pour des explications détaillées et des conseils d'amélioration.
            </p>
          </div>

          {/* Métriques expliquées */}
          <div className="space-y-3">
            {metricsExplanations.map((metric, index) => (
              <div key={index} className="border border-blue-200 rounded-lg">
                <button
                  onClick={() => setExpandedMetric(expandedMetric === index ? null : index)}
                  className="flex items-center justify-between w-full p-3 text-left hover:bg-blue-50"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-blue-600">{metric.icon}</div>
                    <span className="font-medium text-gray-900">{metric.title}</span>
                  </div>
                  {expandedMetric === index ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                {expandedMetric === index && (
                  <div className="px-3 pb-3 space-y-3">
                    {/* Description */}
                    <p className="text-sm text-gray-700">{metric.description}</p>

                    {/* Exemples */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-green-50 border border-green-200 p-3 rounded">
                        <div className="flex items-center gap-2 mb-1">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">Bon exemple</span>
                        </div>
                        <p className="text-sm text-green-700">{metric.goodExample}</p>
                      </div>
                      
                      <div className="bg-red-50 border border-red-200 p-3 rounded">
                        <div className="flex items-center gap-2 mb-1">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <span className="text-sm font-medium text-red-800">Mauvais exemple</span>
                        </div>
                        <p className="text-sm text-red-700">{metric.badExample}</p>
                      </div>
                    </div>

                    {/* Conseils d'amélioration */}
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">Comment améliorer</span>
                      </div>
                      <ul className="space-y-1">
                        {metric.tips.map((tip, tipIndex) => (
                          <li key={tipIndex} className="text-sm text-yellow-700 flex items-start gap-2">
                            <span className="text-yellow-500 mt-0.5">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Seuils de performance */}
          <div className="bg-gray-50 border border-gray-200 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Seuils de performance (à retenir)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium text-green-700 mb-1">✅ Performances excellentes</div>
                <ul className="text-green-600 space-y-0.5 ml-4">
                  <li>• Sessions ≥ 10</li>
                  <li>• Temps ≥ 1 minute</li>
                  <li>• Scroll ≥ 60%</li>
                  <li>• Rebond ≤ 40%</li>
                </ul>
              </div>
              <div>
                <div className="font-medium text-red-700 mb-1">❌ Performances à améliorer</div>
                <ul className="text-red-600 space-y-0.5 ml-4">
                  <li>• Sessions &lt; 3</li>
                  <li>• Temps &lt; 30s</li>
                  <li>• Scroll &lt; 30%</li>
                  <li>• Rebond &gt; 70%</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Call to action */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
            <h4 className="font-medium mb-2">🚀 Prêt à optimiser vos annonces ?</h4>
            <p className="text-sm opacity-90">
              Utilisez ces insights pour améliorer vos propriétés une par une. 
              Concentrez-vous d'abord sur celles qui ont le plus de potentiel !
            </p>
          </div>
        </div>
      )}
    </div>
  );
}