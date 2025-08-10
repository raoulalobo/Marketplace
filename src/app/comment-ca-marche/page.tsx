// Page explicative du processus sécurisé avec notaire
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Shield, FileCheck, UserCheck, CreditCard, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CommentCaMarche() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Section Hero */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Comment ça marche ?
            </h1>
            <p className="text-xl text-blue-100 mb-8">
              Un processus 100% sécurisé avec le notaire comme tiers de confiance.<br/>
              <span className="text-yellow-400 font-semibold">Zéro risque pour l'acheteur !</span>
            </p>
          </div>
        </div>
      </section>

      {/* Timeline du processus en 4 étapes */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-16 text-gray-900">
              Processus sécurisé en 4 étapes
            </h2>
            
            <div className="relative">
              {/* Ligne de connexion */}
              <div className="absolute left-8 top-16 bottom-16 w-1 bg-blue-200 hidden md:block"></div>
              
              <div className="space-y-16">
                
                {/* Étape 1 - Dépôt chez notaire */}
                <div className="flex flex-col md:flex-row items-start gap-8">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl relative z-10">
                      1
                    </div>
                  </div>
                  <div className="flex-1 bg-white p-8 rounded-lg shadow-md">
                    <div className="flex items-center gap-4 mb-6">
                      <CreditCard className="w-8 h-8 text-blue-600" />
                      <h3 className="text-2xl font-bold text-gray-900">
                        Dépôt sécurisé chez le notaire
                      </h3>
                    </div>
                    <p className="text-gray-600 text-lg mb-4">
                      Vous déposez le montant de votre achat directement chez un notaire certifié. 
                      Votre argent est <strong>bloqué et protégé</strong> - impossible pour quiconque d'y toucher.
                    </p>
                    <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                      <p className="text-green-800 font-semibold">
                        ✅ Garantie : Votre argent est 100% sécurisé et inviolable
                      </p>
                    </div>
                  </div>
                </div>

                {/* Étape 2 - Protocole d'accord */}
                <div className="flex flex-col md:flex-row items-start gap-8">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-2xl relative z-10">
                      2
                    </div>
                  </div>
                  <div className="flex-1 bg-white p-8 rounded-lg shadow-md">
                    <div className="flex items-center gap-4 mb-6">
                      <FileCheck className="w-8 h-8 text-green-600" />
                      <h3 className="text-2xl font-bold text-gray-900">
                        Signature du protocole d'accord
                      </h3>
                    </div>
                    <p className="text-gray-600 text-lg mb-4">
                      Nous signons ensemble un protocole d'accord légal qui stipule clairement :
                    </p>
                    <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-500 mb-4">
                      <div className="flex items-center gap-3 mb-3">
                        <Clock className="w-6 h-6 text-yellow-600" />
                        <p className="font-bold text-yellow-800 text-lg">
                          Délai maximum : 1 mois
                        </p>
                      </div>
                      <p className="text-yellow-700">
                        Si vous ne recevez pas votre dossier technique complet dans un délai d'<strong>1 mois</strong>, 
                        vous récupérez automatiquement <strong>100% de votre argent</strong>.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Étape 3 - Lancement procédure */}
                <div className="flex flex-col md:flex-row items-start gap-8">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-2xl relative z-10">
                      3
                    </div>
                  </div>
                  <div className="flex-1 bg-white p-8 rounded-lg shadow-md">
                    <div className="flex items-center gap-4 mb-6">
                      <UserCheck className="w-8 h-8 text-yellow-600" />
                      <h3 className="text-2xl font-bold text-gray-900">
                        Lancement des démarches officielles
                      </h3>
                    </div>
                    <p className="text-gray-600 text-lg mb-4">
                      Nous lançons immédiatement toutes les procédures pour constituer votre dossier technique complet :
                    </p>
                    <ul className="space-y-2 text-gray-600">
                      <li className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span>Titre foncier authentique</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span>Certificat d'urbanisme à jour</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span>Permis de construire valide</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span>Tous documents légaux requis</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Étape 4 - Vérification finale */}
                <div className="flex flex-col md:flex-row items-start gap-8">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl relative z-10">
                      4
                    </div>
                  </div>
                  <div className="flex-1 bg-white p-8 rounded-lg shadow-md">
                    <div className="flex items-center gap-4 mb-6">
                      <Shield className="w-8 h-8 text-purple-600" />
                      <h3 className="text-2xl font-bold text-gray-900">
                        Vérification finale et déblocage
                      </h3>
                    </div>
                    <p className="text-gray-600 text-lg mb-6">
                      Une fois le dossier technique constitué, nous effectuons une <strong>double vérification</strong> de la mise à jour au cadastre :
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Si OK */}
                      <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                        <div className="flex items-center gap-3 mb-4">
                          <CheckCircle className="w-8 h-8 text-green-600" />
                          <h4 className="text-xl font-bold text-green-800">Si tout est OK</h4>
                        </div>
                        <p className="text-green-700 mb-3">
                          ✅ Cadastre à jour<br/>
                          ✅ Documents validés<br/>
                          ✅ Propriété légale
                        </p>
                        <p className="font-semibold text-green-800">
                          → Le vendeur récupère l'argent<br/>
                          → Vous obtenez votre bien en toute sécurité
                        </p>
                      </div>
                      
                      {/* Si pas OK */}
                      <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                        <div className="flex items-center gap-3 mb-4">
                          <XCircle className="w-8 h-8 text-red-600" />
                          <h4 className="text-xl font-bold text-red-800">Si problème détecté</h4>
                        </div>
                        <p className="text-red-700 mb-3">
                          ❌ Cadastre pas à jour<br/>
                          ❌ Documents invalides<br/>
                          ❌ Problème légal
                        </p>
                        <p className="font-semibold text-red-800">
                          → Vous récupérez 100% de votre argent<br/>
                          → Aucune perte financière
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
      <section className="bg-blue-50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
              Questions fréquentes
            </h2>
            
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  Le notaire est-il vraiment indépendant ?
                </h3>
                <p className="text-gray-600">
                  Oui, absolument. Le notaire est un officier public indépendant, certifié par l'État. 
                  Il n'a aucun lien avec nous ni avec le vendeur. Son rôle est de protéger vos intérêts.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  Que se passe-t-il si le délai d'1 mois est dépassé ?
                </h3>
                <p className="text-gray-600">
                  Le remboursement est automatique. Le notaire libère immédiatement vos fonds 
                  sans aucune procédure compliquée. C'est écrit noir sur blanc dans le protocole.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  Y a-t-il des frais cachés ?
                </h3>
                <p className="text-gray-600">
                  Aucun frais caché. Seuls les frais de notaire standard s'appliquent (environ 2% du montant), 
                  que vous paieriez de toute façon dans n'importe quelle transaction immobilière légale.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-bold mb-3 text-gray-900">
                  Comment vérifiez-vous le cadastre ?
                </h3>
                <p className="text-gray-600">
                  Nous effectuons une vérification directe auprès du Ministère des Domaines et des Affaires Foncières. 
                  Nous nous assurons que la propriété est bien enregistrée et à jour dans les registres officiels.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action final */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">
              Prêt à investir en toute sécurité ?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Avec notre processus, vous ne prenez <strong>AUCUN RISQUE</strong>.<br/>
              Découvrez nos biens disponibles et commencez sereinement.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold text-lg px-8 py-4 h-auto">
                <Link href="/properties" className="flex items-center gap-2">
                  Voir les biens sécurisés
                  <ArrowRight className="w-6 h-6" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-900 text-lg px-8 py-4 h-auto">
                <Link href="/auth/register">
                  Créer mon compte gratuit
                </Link>
              </Button>
            </div>
            
            <div className="mt-8 flex items-center justify-center gap-4 text-blue-200">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">
                Processus légal certifié • Protection notaire garantie • 0% de risque
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}