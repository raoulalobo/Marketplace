// Page d'accueil moderne de la marketplace immobilière camerounaise
import { HeroSection } from '@/components/home/hero-section';
import { SearchSection } from '@/components/home/search-section';
import { FeaturedProperties } from '@/components/home/featured-properties';
import { TestimonialSection } from '@/components/home/testimonial-section';

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      {/* Section héro principale */}
      <HeroSection />
      
      {/* Section de recherche */}
      <SearchSection />
      
      {/* Propriétés en vedette */}
      <FeaturedProperties />
      
      {/* Témoignage client */}
      <TestimonialSection />
    </div>
  );
}
