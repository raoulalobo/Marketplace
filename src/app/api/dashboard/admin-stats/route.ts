// API route pour les statistiques du dashboard admin
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// Forcer le rendu dynamique pour cette route API qui utilise les headers de session
export const dynamic = 'force-dynamic';

// Interface pour les statistiques admin (sans données fictives)
interface AdminStats {
  // Vue d'ensemble de la plateforme
  totalUsers: number;
  totalAgents: number;
  totalAcheteurs: number;
  newUsersThisMonth: number;
  
  // Propriétés
  totalProperties: number;
  activeProperties: number;
  pendingProperties: number;
  propertiesAddedThisMonth: number;
  
  // Activité réelle
  totalVisitRequests: number;
  pendingVisitRequests: number;
  totalViews: number;
  totalReports: number;
  
  // Métriques réelles (pas de simulation de revenus)
  avgPropertyPrice: number;
  
  // Analytics temporelles
  usersGrowth: Array<{ date: string; users: number }>;
  propertiesGrowth: Array<{ date: string; properties: number }>;
  
  // Géographie réelle
  propertiesByCity: Array<{ city: string; count: number; avgPrice: number }>;
  
  // Types de biens
  propertiesByType: Array<{ type: string; count: number; avgPrice: number }>;
  
  // Top agents (sans revenus fictifs)
  topAgents: Array<{
    id: string;
    name: string;
    propertiesCount: number;
    totalViews: number;
  }>;
  
  // Activités récentes réelles
  recentActivities: Array<{
    type: 'USER_REGISTERED' | 'PROPERTY_ADDED' | 'VISIT_REQUESTED';
    description: string;
    timestamp: string;
    userId?: string;
    propertyId?: string;
  }>;

  // Flags pour indiquer les états vides (pas de données fictives)
  isEmpty: {
    users: boolean;
    properties: boolean;
    activities: boolean;
    agents: boolean;
  };
  
  // Messages informatifs pour les cas vides
  emptyStateMessages: {
    users?: string;
    properties?: string;
    activities?: string;
    agents?: string;
  };
}

// GET /api/dashboard/admin-stats - Récupérer les statistiques admin
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

    // Vérifier que l'utilisateur est un admin
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Accès réservé aux administrateurs' },
        { status: 403 }
      );
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Récupérer les statistiques réelles en parallèle
    const [
      totalUsers,
      totalAgents,
      totalAcheteurs,
      newUsersThisMonth,
      totalProperties,
      activeProperties,
      propertiesAddedThisMonth,
      totalVisitRequests,
      pendingVisitRequests,
      totalReports,
      totalViews,
      allProperties,
      allUsers,
      agentsWithProperties,
      recentUsers,
      recentProperties,
      recentVisitRequests
    ] = await Promise.all([
      // Utilisateurs
      prisma.user.count(),
      
      prisma.user.count({
        where: { role: UserRole.AGENT }
      }),
      
      prisma.user.count({
        where: { role: UserRole.ACHETEUR }
      }),
      
      prisma.user.count({
        where: { 
          createdAt: { gte: startOfMonth }
        }
      }),
      
      // Propriétés
      prisma.property.count(),
      
      prisma.property.count({
        where: { isActive: true }
      }),
      
      prisma.property.count({
        where: { 
          createdAt: { gte: startOfMonth }
        }
      }),
      
      // Demandes de visite
      prisma.visitRequest.count(),
      
      prisma.visitRequest.count({
        where: { status: 'PENDING' }
      }),
      
      // Signalements
      prisma.report.count(),
      
      // Vues réelles depuis PropertyView
      prisma.propertyView.count(),
      
      // Propriétés pour analytics
      prisma.property.findMany({
        select: {
          prix: true,
          type: true,
          adresse: true,
          createdAt: true
        }
      }),
      
      // Utilisateurs pour croissance
      prisma.user.findMany({
        select: {
          createdAt: true,
          role: true
        }
      }),
      
      // Agents avec leurs propriétés et vraies vues
      prisma.user.findMany({
        where: { role: UserRole.AGENT },
        include: {
          properties: {
            include: {
              _count: {
                select: {
                  views: true,
                  favorites: true,
                  visitRequests: true
                }
              }
            }
          }
        }
      }),
      
      // Activités récentes réelles - Nouveaux utilisateurs
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          prenom: true,
          nom: true,
          role: true,
          createdAt: true
        }
      }),
      
      // Activités récentes réelles - Nouvelles propriétés
      prisma.property.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: {
          agent: {
            select: { prenom: true, nom: true }
          }
        }
      }),
      
      // Activités récentes réelles - Nouvelles demandes de visite
      prisma.visitRequest.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: {
          property: {
            select: { id: true, titre: true }
          },
          acheteur: {
            select: { prenom: true, nom: true }
          }
        }
      })
    ]);

    // Calculer les métriques dérivées réelles
    const pendingProperties = totalProperties - activeProperties;
    const avgPropertyPrice = allProperties.length > 0 
      ? allProperties.reduce((sum, prop) => sum + prop.prix, 0) / allProperties.length
      : 0;

    // Croissance des utilisateurs (30 derniers jours)
    const usersGrowth = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
      const usersUpToDate = allUsers.filter(user => 
        new Date(user.createdAt) <= date
      ).length;
      
      return {
        date: date.toISOString().split('T')[0],
        users: usersUpToDate
      };
    });

    // Croissance des propriétés (30 derniers jours)
    const propertiesGrowth = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000);
      const propertiesUpToDate = allProperties.filter(prop => 
        new Date(prop.createdAt) <= date
      ).length;
      
      return {
        date: date.toISOString().split('T')[0],
        properties: propertiesUpToDate
      };
    });

    // Pas de simulation - cette donnée sera supprimée

    // Propriétés par ville
    const propertiesByCity = allProperties.reduce((acc, prop) => {
      const city = prop.adresse.split(',').pop()?.trim() || 'Inconnu';
      const existing = acc.find(item => item.city === city);
      if (existing) {
        existing.count++;
        existing.totalPrice += prop.prix;
      } else {
        acc.push({ 
          city, 
          count: 1, 
          totalPrice: prop.prix,
          avgPrice: prop.prix 
        });
      }
      return acc;
    }, [] as Array<{ city: string; count: number; totalPrice: number; avgPrice: number }>)
    .map(item => ({
      city: item.city,
      count: item.count,
      avgPrice: item.totalPrice / item.count
    }));

    // Propriétés par type
    const propertiesByType = allProperties.reduce((acc, prop) => {
      const existing = acc.find(item => item.type === prop.type);
      if (existing) {
        existing.count++;
        existing.totalPrice += prop.prix;
      } else {
        acc.push({ 
          type: prop.type, 
          count: 1, 
          totalPrice: prop.prix,
          avgPrice: prop.prix 
        });
      }
      return acc;
    }, [] as Array<{ type: string; count: number; totalPrice: number; avgPrice: number }>)
    .map(item => ({
      type: item.type,
      count: item.count,
      avgPrice: item.totalPrice / item.count
    }));

    // Top agents (sans données fictives)
    const topAgents = agentsWithProperties
      .map(agent => {
        const agentTotalViews = agent.properties.reduce(
          (sum, prop) => sum + prop._count.views, 0
        );
        
        return {
          id: agent.id,
          name: `${agent.prenom} ${agent.nom}`,
          propertiesCount: agent.properties.length,
          totalViews: agentTotalViews
        };
      })
      .sort((a, b) => b.propertiesCount - a.propertiesCount)
      .slice(0, 5);

    // Activités récentes réelles
    const recentActivities: Array<{
      type: 'USER_REGISTERED' | 'PROPERTY_ADDED' | 'VISIT_REQUESTED';
      description: string;
      timestamp: string;
      userId?: string;
      propertyId?: string;
    }> = [
      // Nouveaux utilisateurs
      ...recentUsers.map(user => ({
        type: 'USER_REGISTERED' as const,
        description: `${user.prenom} ${user.nom} s'est inscrit comme ${user.role === 'AGENT' ? 'agent' : 'acheteur'}`,
        timestamp: user.createdAt.toISOString(),
        userId: user.id
      })),
      // Nouvelles propriétés
      ...recentProperties.map(property => ({
        type: 'PROPERTY_ADDED' as const,
        description: `${property.agent.prenom} ${property.agent.nom} a ajouté "${property.titre}"`,
        timestamp: property.createdAt.toISOString(),
        propertyId: property.id
      })),
      // Nouvelles demandes de visite
      ...recentVisitRequests.map(visit => ({
        type: 'VISIT_REQUESTED' as const,
        description: `${visit.acheteur.prenom} ${visit.acheteur.nom} demande à visiter "${visit.property.titre}"`,
        timestamp: visit.createdAt.toISOString(),
        propertyId: visit.property.id
      }))
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

    // Détection des états vides (pas de données fictives)
    const isEmpty = {
      users: totalUsers === 0,
      properties: totalProperties === 0,
      activities: recentActivities.length === 0,
      agents: topAgents.length === 0
    };

    // Messages pour les états vides
    const emptyStateMessages: { [key: string]: string } = {};
    
    if (isEmpty.users) {
      emptyStateMessages.users = "Aucun utilisateur inscrit pour le moment. Les statistiques apparaîtront dès les premières inscriptions.";
    }
    
    if (isEmpty.properties) {
      emptyStateMessages.properties = "Aucune propriété ajoutée pour le moment. Invitez des agents à publier leurs premiers biens.";
    }
    
    if (isEmpty.activities) {
      emptyStateMessages.activities = "Aucune activité récente. L'activité apparaîtra quand les utilisateurs commenceront à utiliser la plateforme.";
    }
    
    if (isEmpty.agents) {
      emptyStateMessages.agents = "Aucun agent actif pour le moment. Encouragez l'inscription d'agents immobiliers.";
    }

    const stats: AdminStats = {
      // Vue d'ensemble
      totalUsers,
      totalAgents,
      totalAcheteurs,
      newUsersThisMonth,
      
      // Propriétés
      totalProperties,
      activeProperties,
      pendingProperties,
      propertiesAddedThisMonth,
      
      // Activité
      totalVisitRequests,
      pendingVisitRequests,
      totalViews,
      totalReports,
      
      // Métriques réelles
      avgPropertyPrice,
      
      // Analytics
      usersGrowth,
      propertiesGrowth,
      propertiesByCity,
      propertiesByType,
      topAgents,
      recentActivities,
      
      // États vides et messages informatifs
      isEmpty,
      emptyStateMessages
    };

    return NextResponse.json(stats);

  } catch (error) {
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}