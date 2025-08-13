// Middleware Next.js pour gérer les redirections et authentification
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirection permanente de /favorites vers /dashboard/favorites
  if (pathname === '/favorites') {
    console.log('Redirecting /favorites to /dashboard/favorites');
    return NextResponse.redirect(
      new URL('/dashboard/favorites', request.url),
      301 // Redirection permanente pour SEO
    );
  }

  // Redirection permanente de /profile vers /dashboard/profile
  if (pathname === '/profile') {
    console.log('Redirecting /profile to /dashboard/profile');
    return NextResponse.redirect(
      new URL('/dashboard/profile', request.url),
      301 // Redirection permanente pour SEO
    );
  }

  // Continuer avec la requête normale
  return NextResponse.next();
}

// Configuration du matcher pour optimiser les performances
export const config = {
  matcher: [
    // Redirections de compatibilité
    '/favorites',
    '/profile',
    // Optionnel : ajouter d'autres routes futures ici
    // '/admin/:path*',
    // '/dashboard/:path*'
  ]
};