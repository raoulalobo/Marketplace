// Section témoignage client camerounais
'use client';

import Image from 'next/image';
import { Quote, Star } from 'lucide-react';

export function TestimonialSection() {
  return (
    <section className="py-16 bg-blue-900 text-white relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Icône de citation */}
          <div className="mb-8">
            <Quote className="w-16 h-16 text-yellow-400 mx-auto" />
          </div>

          {/* Témoignage principal */}
          <blockquote className="text-2xl md:text-3xl font-light leading-relaxed mb-8">
            "Avant toute chose : mes plus sincères félicitations. Ce que je vois ici, à première vue, révèle une vision claire et une exécution remarquable. Excellent travail. Continue à penser différemment"
          </blockquote>

          {/* Étoiles */}
          <div className="flex justify-center gap-1 mb-8">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
            ))}
          </div>

          {/* Informations du client */}
          <div className="flex items-center justify-center gap-6">
            <div className="text-left">
              <div className="text-xl font-semibold">TANKEU Duplex</div>
              <div className="text-blue-200">Chef agence FIGEC Mimboman</div>
              <div className="text-blue-300 text-sm">Yaounde, Cameroun</div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}