// Hero Section épurée - Protection anti-arnaque immobilière
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  return (
    <section className="relative h-[100dvh] md:h-screen bg-gradient-to-br from-blue-900 to-indigo-900 overflow-hidden">
      {/* Image de fond simplifiée */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1588460479153-3a1c15a83f30?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80"
          alt="Immobilier sécurisé au Cameroun"
          fill
          className="object-cover opacity-30"
          priority
        />
      </div>

      {/* Contenu principal centré */}
      <div className="relative z-10 container mx-auto px-4 h-full flex items-center justify-center min-h-0">
        <div className="text-center text-white max-w-4xl mx-auto space-y-12">
          
          {/* Message principal */}
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              FINI LES ARNAQUES{' '}
              <span className="text-yellow-400">IMMOBILIÈRES</span>
            </h1>
            <p className="text-2xl md:text-3xl text-blue-100 font-medium">
              Payez seulement après validation de tous vos documents
            </p>
            <p className="text-xl text-green-300 font-semibold">
              100% sécurisé ou remboursé
            </p>
          </div>

          {/* CTA unique */}
          <div className="flex justify-center">
            <Button 
              size="lg" 
              className="bg-yellow-500 hover:bg-yellow-600 text-black text-xl font-bold px-12 py-4 h-auto"
            >
              <Link href="/comment-ca-marche" className="flex items-center gap-3">
                <Shield className="w-6 h-6" />
                COMMENT ÇA MARCHE
              </Link>
            </Button>
          </div>

          {/* Preuve sociale réaliste */}
          <div className="pt-8">
            <p className="text-blue-200 text-lg">
              ✅ <span className="font-semibold text-white">30 familles protégées</span> des arnaques
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}