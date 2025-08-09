// API route pour publier une propriété sur les réseaux sociaux via Ayrshare
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

// Schéma de validation pour la requête de partage social
const socialShareSchema = z.object({
  platforms: z.array(z.string()).min(1, 'Au moins une plateforme doit être sélectionnée'),
  includeElements: z.object({
    title: z.boolean(),
    price: z.boolean(),
    surface: z.boolean(),
    photos: z.boolean(),
    description: z.boolean(),
  }),
  selectedPhotos: z.array(z.string()).optional(),
  customMessage: z.string().optional(),
});

// Interface pour la réponse de l'API Ayrshare
interface AyrshareResponse {
  status: string;
  errors: string[];
  id?: string;
  postIds?: Array<{
    status: string;
    id: string;
    platform: string;
    postUrl?: string;
  }>;
}

// Fonction pour formater le prix en FCFA
function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
}

// Fonction pour récupérer une propriété avec vérification des droits agent
async function getPropertyForAgent(propertyId: string, agentId: string) {
  const property = await prisma.property.findFirst({
    where: {
      id: propertyId,
      agentId: agentId, // Vérifier que l'agent possède cette propriété
    },
    include: {
      agent: {
        select: {
          id: true,
          nom: true,
          prenom: true,
        }
      },
      medias: {
        orderBy: { order: 'asc' },
        take: 4, // Limiter à 4 photos pour éviter les limites API
      }
    }
  });

  return property;
}

// Fonction pour générer le contenu du post selon les éléments sélectionnés
function generatePostContent(property: any, includeElements: any, customMessage?: string): string {
  let content = '';
  
  // Message personnalisé en premier
  if (customMessage && customMessage.trim()) {
    content += customMessage.trim() + '\n\n';
  }

  // Titre de la propriété
  if (includeElements.title) {
    content += `🏡 ${property.titre}\n\n`;
  }

  // Prix et superficie
  const details = [];
  if (includeElements.price) {
    details.push(`💰 Prix: ${formatPrice(property.prix)}`);
  }
  if (includeElements.surface) {
    details.push(`📐 Superficie: ${property.superficie} m²`);
  }
  if (details.length > 0) {
    content += details.join('\n') + '\n\n';
  }

  // Description
  if (includeElements.description && property.description) {
    const shortDescription = property.description.length > 200 
      ? property.description.substring(0, 200) + '...'
      : property.description;
    content += `📋 ${shortDescription}\n\n`;
  }

  // Localisation
  content += `📍 ${property.adresse}\n\n`;
  
  // Hashtags pertinents
  const typeHashtags = {
    'MAISON': '#Maison #Villa',
    'TERRAIN': '#Terrain #Parcelle',
    'BUREAU': '#Bureau #Commercial',
    'HANGAR': '#Hangar #Entrepot'
  };
  
  content += `${typeHashtags[property.type as keyof typeof typeHashtags]} #ImmobilierCameroun #RealEstate #Investissement`;

  return content.trim();
}

// Fonction pour publier sur Ayrshare
async function publishToAyrshare(
  content: string, 
  platforms: string[], 
  mediaUrls: string[]
): Promise<AyrshareResponse> {
  const AYRSHARE_API_KEY = process.env.AYRSHARE_API_KEY;
  
  if (!AYRSHARE_API_KEY) {
    throw new Error('Clé API Ayrshare manquante');
  }

  // Préparer les données pour Ayrshare
  const postData: any = {
    post: content,
    platforms: platforms,
  };

  // Ajouter les médias si des photos sont incluses
  if (mediaUrls.length > 0) {
    postData.mediaUrls = mediaUrls;
  }

  try {
    const response = await fetch('https://api.ayrshare.com/api/post', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AYRSHARE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erreur Ayrshare API:', response.status, errorText);
      throw new Error(`Erreur Ayrshare API: ${response.status} - ${errorText}`);
    }

    const result: AyrshareResponse = await response.json();
    return result;
    
  } catch (error) {
    console.error('💥 Erreur lors de la publication Ayrshare:', error);
    throw error;
  }
}

// POST /api/properties/[id]/share-social - Publier une propriété sur les réseaux sociaux
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: propertyId  } = await params;
    
    // Vérifier l'authentification et le rôle agent
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication requise' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'AGENT') {
      return NextResponse.json(
        { error: 'Accès réservé aux agents immobiliers' },
        { status: 403 }
      );
    }

    // Valider les données de la requête
    const body = await request.json();
    const validatedData = socialShareSchema.parse(body);

    console.log(`📱 Demande de partage social pour propriété ${propertyId} par agent ${session.user.id}`);

    // Récupérer la propriété avec vérification des droits
    const property = await getPropertyForAgent(propertyId, session.user.id);
    
    if (!property) {
      return NextResponse.json(
        { error: 'Propriété non trouvée ou accès refusé' },
        { status: 404 }
      );
    }

    // Générer le contenu du post
    const postContent = generatePostContent(
      property, 
      validatedData.includeElements, 
      validatedData.customMessage
    );

    // Préparer les URLs des médias selon la sélection
    let mediaUrls: string[] = [];
    if (validatedData.selectedPhotos && validatedData.selectedPhotos.length > 0) {
      // Utiliser les photos sélectionnées spécifiquement
      mediaUrls = validatedData.selectedPhotos.slice(0, 4); // Limiter à 4 photos par sécurité
    } else if (validatedData.includeElements.photos && property.medias.length > 0) {
      // Fallback : utiliser toutes les photos disponibles (ancien comportement)
      mediaUrls = property.medias
        .filter(media => media.type === 'PHOTO')
        .slice(0, 4)
        .map(media => media.url);
    }

    console.log(`📝 Contenu généré (${postContent.length} caractères)`);
    console.log(`🖼️ ${mediaUrls.length} photos à publier`);
    console.log(`📱 Plateformes: ${validatedData.platforms.join(', ')}`);

    // Publier sur Ayrshare
    const result = await publishToAyrshare(
      postContent, 
      validatedData.platforms, 
      mediaUrls
    );

    // Analyser les résultats
    const successfulPosts = result.postIds?.filter(post => post.status === 'success') || [];
    const failedPosts = result.postIds?.filter(post => post.status !== 'success') || [];

    console.log(`✅ ${successfulPosts.length} posts publiés avec succès`);
    if (failedPosts.length > 0) {
      console.log(`❌ ${failedPosts.length} posts échoués`);
    }

    return NextResponse.json({
      success: true,
      message: `Publication réussie sur ${successfulPosts.length} plateforme(s)`,
      data: {
        ayrshareId: result.id,
        totalPlatforms: validatedData.platforms.length,
        successfulPosts: successfulPosts.length,
        failedPosts: failedPosts.length,
        postDetails: result.postIds,
        contentPreview: postContent.substring(0, 100) + '...',
        mediaCount: mediaUrls.length
      },
      errors: result.errors
    });

  } catch (error) {
    console.error('❌ Erreur lors du partage social:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Données invalides', 
          details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`) 
        },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      console.error('📋 Détails de l\'erreur:', {
        message: error.message,
        stack: error.stack,
        environment: {
          AYRSHARE_API_KEY: process.env.AYRSHARE_API_KEY ? 'Définie' : 'Manquante',
        }
      });

      if (error.message.includes('Clé API Ayrshare manquante')) {
        return NextResponse.json(
          { error: 'Configuration Ayrshare incomplète' },
          { status: 500 }
        );
      }
      
      if (error.message.includes('Ayrshare API')) {
        return NextResponse.json(
          { error: 'Erreur lors de la publication sur les réseaux sociaux', details: error.message },
          { status: 502 }
        );
      }
      
      return NextResponse.json(
        { error: 'Erreur interne du serveur', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}