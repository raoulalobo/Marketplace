// Layout principal de l'application marketplace immobilière
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/auth-provider';
import PostHogProviderWrapper from '@/providers/posthog-provider';
import { Navbar } from '@/components/layout/navbar';
import { Footer } from '@/components/layout/footer';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Marketplace Immobilier Cameroun',
  description: 'Plateforme de vente et location de biens immobiliers au Cameroun',
  keywords: 'immobilier, Cameroun, maison, terrain, bureau, location, vente',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <AuthProvider>
          <PostHogProviderWrapper>
            <div className="min-h-screen flex flex-col">
              <Navbar />
              <main className="flex-1">
                {children}
              </main>
              <Footer />
            </div>
          </PostHogProviderWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
