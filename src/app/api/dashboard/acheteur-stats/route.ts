// API route pour les statistiques du dashboard acheteur
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// Forcer le rendu dynamique pour cette route API qui utilise les headers de session
export const dynamic = 'force-dynamic';

// Interface pour les statistiques acheteur
interface AcheteurStats {
  // Activité de l'acheteur
  totalFavorites: number;
  totalVisitRequests: number;
  pendingVisitRequests: number;
  acceptedVisitRequests: number;
  completedVisitRequests: number;
  
  // Recherches et préférences
  savedSearches: number;
  averageBudget: number;
  preferredPropertyTypes: Array<{ type: string; count: number }>;
  preferredCities: Array<{ city: string; count: number }>;
  
  // Activité récente
  recentlyViewed: Array<{
    id: string;
    titre: string;
    prix: number;
    type: string;
    ville: string;
    viewedAt: string;
  }>;
  
  // Favoris avec détails
  favoriteProperties: Array<{
    id: string;
    titre: string;
    prix: number;
    type: string;
    ville: string;
    addedAt: string;
  }>;
  
  // Historique des visites
  visitHistory: Array<{
    id: string;
    propertyTitle: string;
    status: string;
    requestedAt: string;
    scheduledAt?: string;
  }>;
  
  // Recommandations basées sur l'activité
  recommendations: Array<{
    id: string;
    titre: string;
    prix: number;
    type: string;
    ville: string;
    matchScore: number; // Score de correspondance en %
  }>;
  
  // Analytics de recherche
  searchActivity: Array<{ date: string; searches: number }>;
  
  // Budget et préférences
  budgetRange: {
    min: number;
    max: number;
    average: number;
  };
}

// GET /api/dashboard/acheteur-stats - Récupérer les statistiques acheteur
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur est un acheteur
    if (session.user.role !== UserRole.ACHETEUR) {
      return NextResponse.json(
        { error: 'Accès réservé aux acheteurs' },
        { status: 403 }
      );
    }

    const acheteurId = session.user.id;
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Récupérer les statistiques en parallèle
    const [
      totalFavorites,
      totalVisitRequests,
      pendingVisitRequests,
      acceptedVisitRequests,
      completedVisitRequests,
      favoritePropertiesDetails,
      visitRequestsDetails,
      allProperties
    ] = await Promise.all([
      // Favoris
      prisma.favorite.count({
        where: { userId: acheteurId }
      }),
      
      // Demandes de visite
      prisma.visitRequest.count({
        where: { acheteurId: acheteurId }
      }),
      
      prisma.visitRequest.count({
        where: { 
          acheteurId: acheteurId,
          status: 'PENDING'
        }
      }),
      
      prisma.visitRequest.count({
        where: { 
          acheteurId: acheteurId,
          status: 'ACCEPTED'
        }
      }),
      
      prisma.visitRequest.count({
        where: { 
          acheteurId: acheteurId,
          status: 'COMPLETED'
        }
      }),
      
      // Détails des favoris
      prisma.favorite.findMany({
        where: { userId: acheteurId },
        include: {
          property: {
            select: {
              id: true,
              titre: true,
              prix: true,
              type: true,
              adresse: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      
      // Détails des demandes de visite
      prisma.visitRequest.findMany({
        where: { acheteurId: acheteurId },
        include: {
          property: {
            select: {
              id: true,
              titre: true,
              prix: true,
              type: true,
              adresse: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      
      // Toutes les propriétés pour les recommandations
      prisma.property.findMany({
        where: { isActive: true },
        select: {
          id: true,
          titre: true,
          prix: true,
          type: true,
          adresse: true
        },
        take: 20 // Limiter pour les performances
      })
    ]);

    // Analyser les préférences de l'utilisateur
    const favoriteTypes = favoritePropertiesDetails.reduce((acc, fav) => {
      const type = fav.property.type;
      const existing = acc.find(item => item.type === type);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ type, count: 1 });
      }
      return acc;
    }, [] as Array<{ type: string; count: number }>);

    const favoriteCities = favoritePropertiesDetails.reduce((acc, fav) => {
      const city = fav.property.adresse.split(',').pop()?.trim() || 'Inconnu';
      const existing = acc.find(item => item.city === city);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ city, count: 1 });
      }
      return acc;
    }, [] as Array<{ city: string; count: number }>);

    // Calculer le budget moyen des favoris
    const averageBudget = favoritePropertiesDetails.length > 0
      ? favoritePropertiesDetails.reduce((sum, fav) => sum + fav.property.prix, 0) / favoritePropertiesDetails.length
      : 0;

    // Fourchette de budget basée sur les favoris
    const budgetRange = favoritePropertiesDetails.length > 0 ? {
      min: Math.min(...favoritePropertiesDetails.map(fav => fav.property.prix)),
      max: Math.max(...favoritePropertiesDetails.map(fav => fav.property.prix)),
      average: averageBudget
    } : { min: 0, max: 0, average: 0 };

    // Propriétés récemment vues (simulé - à implémenter avec un système de tracking)
    const recentlyViewed = favoritePropertiesDetails.slice(0, 5).map(fav => ({
      id: fav.property.id,
      titre: fav.property.titre,
      prix: fav.property.prix,
      type: fav.property.type,
      ville: fav.property.adresse.split(',').pop()?.trim() || 'Inconnu',
      viewedAt: new Date(fav.createdAt.getTime() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
    }));

    // Favoris formatés
    const favoriteProperties = favoritePropertiesDetails.map(fav => ({
      id: fav.property.id,
      titre: fav.property.titre,
      prix: fav.property.prix,
      type: fav.property.type,
      ville: fav.property.adresse.split(',').pop()?.trim() || 'Inconnu',
      addedAt: fav.createdAt.toISOString()
    }));

    // Historique des visites
    const visitHistory = visitRequestsDetails.map(visit => ({
      id: visit.id,
      propertyTitle: visit.property.titre,
      status: visit.status,
      requestedAt: visit.createdAt.toISOString(),
      scheduledAt: visit.scheduledDate?.toISOString()
    }));

    // Récupérer la dernière connexion de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { id: acheteurId },
      select: { lastLoginAt: true }
    });

    const lastLogin = user?.lastLoginAt || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 jours par défaut

    // Propriétés ajoutées depuis la dernière connexion
    const newPropertiesSinceLastLogin = await prisma.property.findMany({
      where: {
        isActive: true,
        createdAt: { gte: lastLogin },
        // Exclure les propriétés déjà en favoris
        NOT: {
          favorites: {
            some: { userId: acheteurId }
          }
        }
      },
      select: {
        id: true,
        titre: true,
        prix: true,
        type: true,
        adresse: true,
        createdAt: true,
        medias: {
          select: {
            url: true,
            type: true,
            order: true
          },
          where: {
            type: 'PHOTO'
          },
          orderBy: {
            order: 'asc'
          },
          take: 1 // Prendre seulement la première photo
        }
      },
      take: 20 // Récupérer plus pour avoir du choix
    });

    // Si pas assez de nouvelles propriétés, compléter avec les plus récentes
    let recommendationPool = newPropertiesSinceLastLogin;
    
    if (recommendationPool.length < 3) { // Changé de 6 à 3
      const additionalProperties = await prisma.property.findMany({
        where: {
          isActive: true,
          createdAt: { lt: lastLogin }, // Propriétés d'avant la dernière connexion
          NOT: {
            OR: [
              // Exclure les favoris
              { favorites: { some: { userId: acheteurId } } },
              // Exclure celles déjà dans le pool
              { id: { in: newPropertiesSinceLastLogin.map(p => p.id) } }
            ]
          }
        },
        select: {
          id: true,
          titre: true,
          prix: true,
          type: true,
          adresse: true,
          createdAt: true,
          medias: {
            select: {
              url: true,
              type: true,
              order: true
            },
            where: {
              type: 'PHOTO'
            },
            orderBy: {
              order: 'asc'
            },
            take: 1 // Prendre seulement la première photo
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 3 - recommendationPool.length // Changé de 6 à 3
      });
      
      recommendationPool = [...recommendationPool, ...additionalProperties];
    }

    // Mélanger aléatoirement et formater les recommandations
    const recommendations = recommendationPool
      .sort(() => Math.random() - 0.5)
      .slice(0, 3) // Changé de 6 à 3
      .map(prop => ({
        id: prop.id,
        titre: prop.titre,
        prix: prop.prix,
        type: prop.type,
        ville: prop.adresse.split(',').pop()?.trim() || 'Inconnu',
        imageUrl: prop.medias.length > 0 ? prop.medias[0].url : null, // Ajouter l'URL de l'image
        matchScore: 100 // Score élevé car ce sont des nouvelles propriétés
      }));

    // Activité de recherche simulée (30 derniers jours)
    const searchActivity = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
      return {
        date: date.toISOString().split('T')[0],
        searches: Math.floor(Math.random() * 5) + 1 // 1-5 recherches par jour
      };
    });

    const stats: AcheteurStats = {
      // Activité
      totalFavorites,
      totalVisitRequests,
      pendingVisitRequests,
      acceptedVisitRequests,
      completedVisitRequests,
      
      // Préférences
      savedSearches: await prisma.searchHistory.count({
        where: { userId: acheteurId }
      }),
      averageBudget,
      preferredPropertyTypes: favoriteTypes,
      preferredCities: favoriteCities,
      
      // Données détaillées
      recentlyViewed,
      favoriteProperties,
      visitHistory,
      recommendations,
      searchActivity,
      budgetRange
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques acheteur:', error);
    
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}