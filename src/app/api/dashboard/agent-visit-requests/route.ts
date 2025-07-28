// API route pour récupérer les demandes de visite d'un agent
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { UserRole } from '@prisma/client';

// Forcer le rendu dynamique pour cette route API qui utilise les headers de session
export const dynamic = 'force-dynamic';

// Interface pour une demande de visite avec détails
interface VisitRequestWithDetails {
  id: string;
  message: string | null;
  datePreferee: string | null;
  status: string;
  createdAt: string;
  requester: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
  };
  property: {
    id: string;
    titre: string;
    prix: number;
    adresse: string;
    type: string;
  };
}

// GET /api/dashboard/agent-visit-requests - Récupérer les demandes de visite de l'agent
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

    // Vérifier que l'utilisateur est un agent
    if (session.user.role !== UserRole.AGENT) {
      return NextResponse.json(
        { error: 'Accès réservé aux agents' },
        { status: 403 }
      );
    }

    const agentId = session.user.id;
    
    // Récupérer les paramètres de requête
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status'); // 'PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED'

    // Construire le filtre
    const whereClause: any = {
      property: {
        agentId: agentId
      }
    };

    if (status) {
      whereClause.status = status;
    }

    // Récupérer les demandes de visite avec détails
    const visitRequests = await prisma.visitRequest.findMany({
      where: whereClause,
      include: {
        acheteur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        },
        property: {
          select: {
            id: true,
            titre: true,
            prix: true,
            adresse: true,
            type: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    // Formater les données
    const formattedRequests: VisitRequestWithDetails[] = visitRequests.map(request => ({
      id: request.id,
      message: request.message,
      datePreferee: request.datePreferee?.toISOString() || null,
      status: request.status,
      createdAt: request.createdAt.toISOString(),
      requester: request.acheteur, // Mapping depuis 'acheteur' vers 'requester'
      property: request.property
    }));

    // Statistiques rapides
    const stats = {
      total: formattedRequests.length,
      pending: formattedRequests.filter(r => r.status === 'PENDING').length,
      accepted: formattedRequests.filter(r => r.status === 'ACCEPTED').length,
      rejected: formattedRequests.filter(r => r.status === 'REJECTED').length,
      completed: formattedRequests.filter(r => r.status === 'COMPLETED').length
    };

    return NextResponse.json({
      visitRequests: formattedRequests,
      stats,
      hasMore: visitRequests.length === limit // Indique s'il y a potentiellement plus de résultats
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des demandes de visite:', error);
    
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}