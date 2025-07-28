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
            "Grâce à cette plateforme, j'ai trouvé ma villa de rêve à Bonapriso en seulement 2 semaines. 
            Un service professionnel et des biens de qualité vérifiés. Je recommande vivement !"
          </blockquote>

          {/* Étoiles */}
          <div className="flex justify-center gap-1 mb-8">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
            ))}
          </div>

          {/* Informations du client */}
          <div className="flex items-center justify-center gap-6">
            <div className="relative">
              <Image
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&q=80"
                alt="Amadou Njoya"
                width={80}
                height={80}
                className="rounded-full border-4 border-yellow-400"
              />
            </div>
            <div className="text-left">
              <div className="text-xl font-semibold">Amadou Njoya</div>
              <div className="text-blue-200">Entrepreneur</div>
              <div className="text-blue-300 text-sm">Douala, Cameroun</div>
            </div>
          </div>

          {/* Statistiques de satisfaction */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 pt-16 border-t border-blue-800">
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-400 mb-2">98%</div>
              <div className="text-blue-200">Clients satisfaits</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-400 mb-2">4.8/5</div>
              <div className="text-blue-200">Note moyenne</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-yellow-400 mb-2">14j</div>
              <div className="text-blue-200">Délai moyen de vente</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}