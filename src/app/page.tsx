// Page d'accueil moderne de la marketplace immobilière camerounaise
import { HeroSlider } from '@/components/home/hero-slider';
import { SearchSection } from '@/components/home/search-section';
import { FeaturedProperties } from '@/components/home/featured-properties';
import { TestimonialSection } from '@/components/home/testimonial-section';

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      {/* Section héro avec slider (Immobilier + Troc) */}
      <HeroSlider />
      
      {/* Section de recherche */}
      <SearchSection />
      
      {/* Propriétés en vedette */}
      <FeaturedProperties />
      
      {/* Témoignage client */}
      <TestimonialSection />
    </div>
  );
}
