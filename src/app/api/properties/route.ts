// API route pour la gestion des propriétés
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { MediaType } from '@prisma/client';

// Schéma de validation pour créer une propriété
const createPropertySchema = z.object({
  titre: z.string().min(10, 'Le titre doit contenir au moins 10 caractères'),
  description: z.string().min(50, 'La description doit contenir au moins 50 caractères'),
  type: z.enum(['MAISON', 'TERRAIN', 'BUREAU', 'HANGAR']),
  prix: z.number().min(1000000, 'Le prix minimum est de 1,000,000 FCFA'),
  superficie: z.number().min(10, 'La superficie minimum est de 10 m²'),
  adresse: z.string().min(10, 'L\'adresse doit contenir au moins 10 caractères'),
  ville: z.string().min(1, 'La ville est requise'),
  fraisVisite: z.number().min(0, 'Les frais de visite ne peuvent pas être négatifs'),
  photos: z.array(z.string()).min(1, 'Au moins une photo est requise').max(5, 'Maximum 5 photos'),
  videos: z.array(z.string()).max(5, 'Maximum 5 vidéos').optional()
});

// Schéma de validation pour les paramètres de recherche
const searchParamsSchema = z.object({
  page: z.string().nullable().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().nullable().optional().transform(val => val ? parseInt(val) : 12),
  search: z.string().nullable().optional(),
  type: z.enum(['MAISON', 'TERRAIN', 'BUREAU', 'HANGAR']).nullable().optional(),
  ville: z.string().nullable().optional(),
  prixMin: z.string().nullable().optional().transform(val => val ? parseInt(val) : undefined),
  prixMax: z.string().nullable().optional().transform(val => val ? parseInt(val) : undefined),
  superficieMin: z.string().nullable().optional().transform(val => val ? parseInt(val) : undefined),
  superficieMax: z.string().nullable().optional().transform(val => val ? parseInt(val) : undefined),
  featured: z.string().nullable().optional().transform(val => val === 'true')
});

// GET /api/properties - Récupérer la liste des propriétés avec filtres
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Valider les paramètres de recherche
    const validatedParams = searchParamsSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      type: searchParams.get('type'),
      ville: searchParams.get('ville'),
      prixMin: searchParams.get('prixMin'),
      prixMax: searchParams.get('prixMax'),
      superficieMin: searchParams.get('superficieMin'),
      superficieMax: searchParams.get('superficieMax'),
      featured: searchParams.get('featured')
    });

    const {
      page,
      limit,
      search,
      type,
      ville,
      prixMin,
      prixMax,
      superficieMin,
      superficieMax,
      featured
    } = validatedParams;

    // Construire les filtres Prisma
    const where: any = {};

    // Recherche textuelle
    if (search) {
      where.OR = [
        { titre: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { adresse: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filtres par type et ville (recherche dans l'adresse pour la ville)
    if (type) where.type = type;
    if (ville) {
      where.adresse = { contains: ville, mode: 'insensitive' };
    }

    // Filtres par prix
    if (prixMin || prixMax) {
      where.prix = {};
      if (prixMin) where.prix.gte = prixMin;
      if (prixMax) where.prix.lte = prixMax;
    }

    // Filtres par superficie
    if (superficieMin || superficieMax) {
      where.superficie = {};
      if (superficieMin) where.superficie.gte = superficieMin;
      if (superficieMax) where.superficie.lte = superficieMax;
    }

    // Pagination
    const skip = (page - 1) * limit;

    // Logique de tri intelligent pour les propriétés en vedette
    let orderBy: any = { createdAt: 'desc' }; // Ordre par défaut
    
    if (featured) {
      // Pour les propriétés en vedette, utiliser un algorithme de rotation intelligente
      orderBy = [
        // 1. Propriétés mises en avant et encore valides en premier
        { 
          isFeatured: 'desc' as const,
          featuredUntil: { sort: 'desc' as const, nulls: 'last' as const }
        },
        // 2. Puis par nombre de vues (popularité)
        { viewsCount: 'desc' as const },
        // 3. Enfin par date de création (récence)
        { createdAt: 'desc' as const }
      ];
    }

    // Nettoyer les propriétés expirées (featuredUntil dépassé)
    const now = new Date();
    await prisma.property.updateMany({
      where: {
        isFeatured: true,
        featuredUntil: {
          lt: now
        }
      },
      data: {
        isFeatured: false,
        featuredUntil: null
      }
    });

    // Récupérer les propriétés
    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where: {
          ...where,
          isActive: true // Seulement les propriétés actives
        },
        include: {
          agent: {
            select: {
              id: true,
              nom: true,
              prenom: true,
              email: true,
              telephone: true
            }
          },
          medias: {
            orderBy: {
              order: 'asc'
            }
          },
          _count: {
            select: {
              favorites: true,
              visitRequests: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.property.count({ where: { ...where, isActive: true } })
    ]);

    return NextResponse.json({
      properties,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des propriétés:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Paramètres de recherche invalides', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// POST /api/properties - Créer une nouvelle propriété
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Vérifier les permissions (seulement agents et admins)
    if (session.user.role !== 'AGENT' && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Permissions insuffisantes' },
        { status: 403 }
      );
    }

    // Récupérer et valider les données
    const body = await request.json();
    const validatedData = createPropertySchema.parse(body);

    const { ville, photos, videos, ...rest } = validatedData;

    // Créer la propriété
    console.log('Validated Data:', validatedData);
    console.log('Agent ID:', session.user.id);
    const property = await prisma.property.create({
      data: {
        ...rest,
        adresse: `${rest.adresse}, ${ville}`,
        agentId: session.user.id,
        medias: {
          create: [
            ...photos.map((url: string, index: number) => ({
              url,
              type: MediaType.PHOTO,
              order: index,
            })),
            ...(videos || []).map((url: string, index: number) => ({
              url,
              type: MediaType.VIDEO,
              order: index,
            })),
          ],
        },
      },
      include: {
        agent: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            telephone: true
          }
        },
        medias: true, // Include medias to confirm they are created
      },
    });
    console.log('Created Property:', property);

    return NextResponse.json(
      { 
        message: 'Propriété créée avec succès',
        property 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Erreur lors de la création de la propriété:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}