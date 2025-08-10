// Layout spécifique au dashboard avec navigation et breadcrumb intégrés
import { Breadcrumb } from '@/components/ui/breadcrumb';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Container principal du dashboard */}
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb automatique pour toutes les pages dashboard */}
        <Breadcrumb />
        
        {/* Contenu de la page */}
        <div>
          {children}
        </div>
      </div>
    </div>
  );
}