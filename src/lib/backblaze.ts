// Configuration et utilitaires pour le stockage Backblaze B2 (S3-compatible)
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

// Configuration du client Backblaze B2 S3-compatible
export const backblazeClient = new S3Client({
  endpoint: process.env.BACKBLAZE_ENDPOINT!,
  region: process.env.BACKBLAZE_REGION!,
  credentials: {
    accessKeyId: process.env.BACKBLAZE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.BACKBLAZE_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // Requis pour Backblaze B2
});

// Types pour les uploads
export type MediaType = 'photo' | 'video';

export interface UploadParams {
  file: File;
  key: string;
  mediaType: MediaType;
}

// Fonction pour uploader un fichier vers Backblaze B2
export async function uploadToBackblaze({ file, key, mediaType }: UploadParams): Promise<string> {
  try {
    const upload = new Upload({
      client: backblazeClient,
      params: {
        Bucket: process.env.BACKBLAZE_BUCKET_NAME!,
        Key: key,
        Body: file,
        ContentType: file.type,
        Metadata: {
          'media-type': mediaType,
          'uploaded-at': new Date().toISOString(),
        },
        // Note: ACL 'public-read' retiré car non supporté par Backblaze B2
        // Configurer les permissions via la console Backblaze
      },
    });

    const result = await upload.done();
    
    // Retourne l'URL publique du fichier
    return `${process.env.BACKBLAZE_ENDPOINT}/${process.env.BACKBLAZE_BUCKET_NAME}/${key}`;
  } catch (error: any) {
    console.error('=== ERREUR BACKBLAZE B2 DÉTAILLÉE ===');
    console.error('Message:', error.message || error);
    console.error('Code:', error.code);
    console.error('Name:', error.name);
    if (error.$metadata) {
      console.error('Metadata:', JSON.stringify(error.$metadata, null, 2));
    }
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    console.error('Configuration utilisée:');
    console.error('- Endpoint:', process.env.BACKBLAZE_ENDPOINT);
    console.error('- Region:', process.env.BACKBLAZE_REGION);
    console.error('- Bucket:', process.env.BACKBLAZE_BUCKET_NAME);
    console.error('- Access Key ID:', process.env.BACKBLAZE_ACCESS_KEY_ID ? 'défini' : 'manquant');
    console.error('- Secret Key:', process.env.BACKBLAZE_SECRET_ACCESS_KEY ? 'défini' : 'manquant');
    console.error('=====================================');
    throw new Error(`Erreur Backblaze B2: ${error.message || 'Erreur inconnue'}`);
  }
}

// Fonction pour générer une clé unique pour le fichier
export function generateFileKey(userId: string, propertyId: string, filename: string, mediaType: MediaType): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const extension = filename.split('.').pop();
  
  return `properties/${propertyId}/${mediaType}s/${userId}_${timestamp}_${randomSuffix}.${extension}`;
}

// Fonction pour valider les types de fichiers autorisés
export function validateMediaFile(file: File, mediaType: MediaType): { isValid: boolean; error?: string } {
  const maxSize = mediaType === 'photo' ? 5 * 1024 * 1024 : 50 * 1024 * 1024; // 5MB pour photos, 50MB pour vidéos
  
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `Le fichier est trop volumineux. Taille maximale: ${maxSize / 1024 / 1024}MB`
    };
  }

  const photoTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const videoTypes = ['video/mp4', 'video/webm', 'video/avi'];
  
  const allowedTypes = mediaType === 'photo' ? photoTypes : videoTypes;
  
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`
    };
  }

  return { isValid: true };
}