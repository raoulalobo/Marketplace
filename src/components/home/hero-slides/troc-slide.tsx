// Slide Troc - Échange biens contre terrains
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TrocSlideProps {
  isActive: boolean;
}

export function TrocSlide({ isActive }: TrocSlideProps) {
  return (
    <div className="relative h-full bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900 overflow-hidden">
      {/* Image de fond */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1544984243-ec57ea16fe25?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
          alt="Échange de biens contre terrain au Cameroun"
          fill
          className="object-cover opacity-25"
          priority={isActive}
        />
      </div>

      {/* Overlay de couleur */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/70 to-green-900/60" />

      {/* Contenu principal centré */}
      <div className="relative z-10 container mx-auto px-4 h-full flex items-center justify-center min-h-0">
        <div 
          className={`text-center text-white max-w-4xl mx-auto space-y-8 transition-all duration-1000 ${
            isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >

          {/* Message principal */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              ÉCHANGEZ VOS BIENS{' '}
              <span className="text-orange-400">CONTRE DES TERRAINS</span>
            </h1>
            <p className="text-xl md:text-2xl text-green-100 font-medium">
              Voiture, bijoux, objets de valeur → Terrain de rêve
            </p>
            <p className="text-lg text-orange-300 font-semibold">
              Évaluation gratuite et échange sécurisé
            </p>
          </div>

          {/* CTA principal */}
          <div className="pt-6">
            <Button 
              size="lg" 
              className="bg-orange-500 hover:bg-orange-600 text-black text-xl font-bold px-12 py-4 h-auto"
            >
              <Link href="/troc" className="flex items-center gap-3">
                <ArrowLeftRight className="w-6 h-6" />
                DÉCOUVRIR LE TROC
              </Link>
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}