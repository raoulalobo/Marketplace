// Section héro moderne pour la marketplace immobilière camerounaise
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, MapPin, Building, Users, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 overflow-hidden">
      {/* Image de fond avec overlay */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
          alt="Architecture moderne à Douala, Cameroun"
          fill
          className="object-cover opacity-30"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-transparent"></div>
      </div>

      {/* Contenu principal */}
      <div className="relative z-10 container mx-auto px-4 pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[80vh]">
          {/* Colonne gauche - Contenu textuel */}
          <div className="text-white space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                Trouvez la propriété{' '}
                <span className="text-yellow-400">idéale</span>{' '}
                au Cameroun
              </h1>
              <p className="text-xl text-blue-100 max-w-lg">
                Des maisons modernes aux terrains titrés, découvrez plus de 500 biens 
                vérifiés dans les principales villes du Cameroun.
              </p>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg mb-2 mx-auto">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold">500+</div>
                <div className="text-sm text-blue-200">Propriétés vérifiées</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-600 rounded-lg mb-2 mx-auto">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold">200+</div>
                <div className="text-sm text-blue-200">Clients satisfaits</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-yellow-600 rounded-lg mb-2 mx-auto">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold">15+</div>
                <div className="text-sm text-blue-200">Villes couvertes</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-600 rounded-lg mb-2 mx-auto">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div className="text-2xl font-bold">50+</div>
                <div className="text-sm text-blue-200">Agents certifiés</div>
              </div>
            </div>

            {/* Call to Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
              >
                <Link href="/properties" className="flex items-center gap-2">
                  Découvrir les biens
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-blue-600 hover:bg-white hover:text-blue-900"
              >
                <Link href="/auth/register">
                  Devenir agent
                </Link>
              </Button>
            </div>

            {/* Villes populaires */}
            <div className="pt-4">
              <p className="text-sm text-blue-200 mb-2">Villes populaires :</p>
              <div className="flex flex-wrap gap-2">
                {['Douala', 'Yaoundé', 'Bafoussam', 'Bamenda', 'Garoua'].map((ville) => (
                  <span 
                    key={ville}
                    className="px-3 py-1 bg-blue-800/50 rounded-full text-sm text-blue-100 border border-blue-600"
                  >
                    {ville}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Colonne droite - Image moderne */}
          <div className="hidden lg:block">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-transparent rounded-2xl"></div>
              <Image
                src="https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                alt="Villa moderne au Cameroun"
                width={600}
                height={700}
                className="rounded-2xl shadow-2xl"
              />
              {/* Badge flottant */}
              <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-900">
                    Nouvelle propriété disponible
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Flèche de défilement */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <div className="animate-bounce">
          <ArrowRight className="w-6 h-6 text-white rotate-90" />
        </div>
      </div>
    </section>
  );
}