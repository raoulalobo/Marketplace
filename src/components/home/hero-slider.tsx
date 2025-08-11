// Hero Slider avec 2 produits vedette : Immobilier + Troc
'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ImmobilierSlide } from './hero-slides/immobilier-slide';
import { TrocSlide } from './hero-slides/troc-slide';

const slides = [
  { id: 'immobilier', component: ImmobilierSlide },
  { id: 'troc', component: TrocSlide }
];

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Auto-play du slider
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000); // 6 secondes par slide

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  // Navigation vers slide suivant
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  // Navigation vers slide précédent
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Navigation directe vers un slide
  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Pause auto-play au survol
  const handleMouseEnter = () => setIsAutoPlaying(false);
  const handleMouseLeave = () => setIsAutoPlaying(true);

  return (
    <section 
      className="relative h-[70vh] overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Container des slides avec transition */}
      <div 
        className="flex transition-transform duration-700 ease-in-out h-full"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {slides.map((slide, index) => {
          const SlideComponent = slide.component;
          return (
            <div key={slide.id} className="w-full h-full flex-shrink-0">
              <SlideComponent isActive={index === currentSlide} />
            </div>
          );
        })}
      </div>

      {/* Boutons de navigation */}
      <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none z-20">
        {/* Bouton précédent */}
        <button
          onClick={prevSlide}
          className="ml-4 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors pointer-events-auto backdrop-blur-sm"
          aria-label="Slide précédent"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Bouton suivant */}
        <button
          onClick={nextSlide}
          className="mr-4 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full transition-colors pointer-events-auto backdrop-blur-sm"
          aria-label="Slide suivant"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Indicators en bas */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide 
                ? 'bg-white scale-110' 
                : 'bg-white/50 hover:bg-white/70'
            }`}
            aria-label={`Aller au slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress bar (optionnel) */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20 z-20">
        <div 
          className="h-full bg-white/70 transition-all duration-300 ease-linear"
          style={{ 
            width: `${((currentSlide + 1) / slides.length) * 100}%`
          }}
        />
      </div>
    </section>
  );
}