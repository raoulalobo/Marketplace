// Page explicative du système de troc - Design adapté de /comment-ca-marche
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { 
  ArrowRight, Shield, Calculator, CheckCircle, XCircle, AlertCircle, 
  Car, Gem, Home, Clock, Users, Star, ArrowLeftRight, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function TrocPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Section Hero */}
      <section className="bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Le Troc Moderne au Cameroun
            </h1>
            <p className="text-xl text-green-100 mb-8">
              Transformez vos biens (voiture, bijoux, électroménager) en terrain de rêve.<br/>
              <span className="text-orange-400 font-semibold">Évaluation professionnelle et échange 100% sécurisé !</span>
            </p>
          </div>
        </div>
      </section>

      {/* Timeline du processus en 3 étapes */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-16 text-gray-900">
              Processus sécurisé en 3 étapes
            </h2>
            
            <div className="relative">
              {/* Ligne de connexion */}
              <div className="absolute left-8 top-16 bottom-16 w-1 bg-green-200 hidden md:block"></div>
              
              <div className="space-y-16">
                
                {/* Étape 1 - Évaluation gratuite */}
                <div className="flex flex-col md:flex-row items-start gap-8">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl relative z-10">
                      1
                    </div>
                  </div>
                  <div className="flex-1 bg-white p-8 rounded-lg shadow-md">
                    <div className="flex items-center gap-4 mb-6">
                      <Calculator className="w-8 h-8 text-blue-600" />
                      <h3 className="text-2xl font-bold text-gray-900">
                        Évaluation professionnelle gratuite
                      </h3>
                    </div>
                    <p className="text-gray-600 text-lg mb-4">
                      Nos experts certifiés évaluent gratuitement la valeur de vos biens (voiture, bijoux, électroménager). 
                      Une <strong>évaluation objective et transparente</strong> basée sur les prix du marché camerounais.
                    </p>
                    <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                      <p className="text-green-800 font-semibold">
                        ✅ Garantie : Évaluation gratuite et sans engagement
                      </p>
                    </div>
                  </div>
                </div>

                {/* Étape 2 - Négociation sécurisée */}
                <div className="flex flex-col md:flex-row items-start gap-8">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-2xl relative z-10">
                      2
                    </div>
                  </div>
                  <div className="flex-1 bg-white p-8 rounded-lg shadow-md">
                    <div className="flex items-center gap-4 mb-6">
                      <Shield className="w-8 h-8 text-green-600" />
                      <h3 className="text-2xl font-bold text-gray-900">
                        Recherche et négociation du terrain idéal
                      </h3>
                    </div>
                    <p className="text-gray-600 text-lg mb-4">
                      Notre équipe recherche et négocie pour vous le terrain parfait correspondant à la valeur de vos biens :
                    </p>
                    <ul className="space-y-2 text-gray-600 mb-4">
                      <li className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span>Terrains titrés et légaux uniquement</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span>Négociation des meilleures conditions</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span>Vérification complète des documents</span>
                      </li>
                    </ul>
                    <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                      <div className="flex items-center gap-3 mb-2">
                        <Clock className="w-6 h-6 text-yellow-600" />
                        <p className="font-bold text-yellow-800">
                          Délai maximum : 30 jours
                        </p>
                      </div>
                      <p className="text-yellow-700">
                        Si nous ne trouvons pas de terrain correspondant dans les <strong>30 jours</strong>, 
                        vous gardez vos biens sans aucune obligation.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Étape 3 - Transaction notariée */}
                <div className="flex flex-col md:flex-row items-start gap-8">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl relative z-10">
                      3
                    </div>
                  </div>
                  <div className="flex-1 bg-white p-8 rounded-lg shadow-md">
                    <div className="flex items-center gap-4 mb-6">
                      <CheckCircle className="w-8 h-8 text-purple-600" />
                      <h3 className="text-2xl font-bold text-gray-900">
                        Échange sécurisé chez le notaire
                      </h3>
                    </div>
                    <p className="text-gray-600 text-lg mb-6">
                      L'échange final se déroule chez un <strong>notaire indépendant</strong> qui vérifie tous les documents 
                      et garantit la légalité de la transaction :
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Si OK */}
                      <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                        <div className="flex items-center gap-3 mb-4">
                          <CheckCircle className="w-8 h-8 text-green-600" />
                          <h4 className="text-xl font-bold text-green-800">Si tout est conforme</h4>
                        </div>
                        <p className="text-green-700 mb-3">
                          ✅ Documents vérifiés<br/>
                          ✅ Titres authentiques<br/>
                          ✅ Transaction légale
                        </p>
                        <p className="font-semibold text-green-800">
                          → Vous récupérez votre terrain titré<br/>
                          → Le vendeur récupère vos biens
                        </p>
                      </div>
                      
                      {/* Si problème */}
                      <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                        <div className="flex items-center gap-3 mb-4">
                          <XCircle className="w-8 h-8 text-red-600" />
                          <h4 className="text-xl font-bold text-red-800">Si problème détecté</h4>
                        </div>
                        <p className="text-red-700 mb-3">
                          ❌ Documents non conformes<br/>
                          ❌ Titre invalide<br/>
                          ❌ Problème légal
                        </p>
                        <p className="font-semibold text-red-800">
                          → Vous gardez 100% de vos biens<br/>
                          → Aucune perte ni obligation
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section FAQ */}
      <section className="bg-green-50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
              Questions fréquentes sur le troc
            </h2>
            
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  Comment évaluez-vous mes biens ?
                </h3>
                <p className="text-gray-600">
                  Nos experts certifiés utilisent les barèmes officiels du marché camerounais, 
                  l'état du bien, sa rareté et sa demande. L'évaluation est transparente et détaillée.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  Quels types de terrains proposez-vous ?
                </h3>
                <p className="text-gray-600">
                  Uniquement des terrains avec titre foncier authentique, dans des zones urbaines ou périurbaines 
                  de Douala, Yaoundé et autres villes du Cameroun. Tous vérifiés et légaux.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  Y a-t-il des frais cachés ?
                </h3>
                <p className="text-gray-600">
                  Aucun frais caché. Seuls les frais de notaire standard s'appliquent (2-3% de la valeur), 
                  identiques à toute transaction immobilière légale au Cameroun.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  Que se passe-t-il si mes biens perdent de la valeur ?
                </h3>
                <p className="text-gray-600">
                  L'évaluation est fixée dès le début et reste valable pendant toute la durée du processus (30 jours). 
                  Vous êtes protégé contre les fluctuations du marché.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action final */}
      <section className="bg-gradient-to-r from-emerald-600 to-green-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">
              Prêt à échanger vos biens contre votre terrain ?
            </h2>
            <p className="text-xl mb-8 text-green-100">
              Avec notre système de troc, vous ne prenez <strong>AUCUN RISQUE</strong>.<br/>
              Commencez par une évaluation gratuite de vos biens.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-orange-500 hover:bg-orange-600 text-black font-semibold text-lg px-8 py-4 h-auto">
                <Link href="/contact" className="flex items-center gap-2">
                  <Calculator className="w-6 h-6" />
                  Évaluation gratuite
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-green-900 text-lg px-8 py-4 h-auto">
                <Link href="/properties" className="flex items-center gap-2">
                  Voir les terrains disponibles
                  <ArrowRight className="w-6 h-6" />
                </Link>
              </Button>
            </div>
            
            <div className="mt-8 flex items-center justify-center gap-4 text-green-200">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">
                Évaluation gratuite • Transaction notariée • 0% de risque • 30 jours maximum
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}