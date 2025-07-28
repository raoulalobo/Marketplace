// Configuration et utilitaires pour le stockage Wasabi (S3-compatible)
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

// Configuration du client Wasabi S3
export const wasabiClient = new S3Client({
  endpoint: process.env.NEXT_PUBLIC_WASABI_ENDPOINT!,
  region: process.env.NEXT_PUBLIC_WASABI_REGION!,
  credentials: {
    accessKeyId: process.env.WASABI_ACCESS_KEY_ID!,
    secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // Requis pour Wasabi
});

// Types pour les uploads
export type MediaType = 'photo' | 'video';

export interface UploadParams {
  file: File;
  key: string;
  mediaType: MediaType;
}

// Fonction pour uploader un fichier vers Wasabi
export async function uploadToWasabi({ file, key, mediaType }: UploadParams): Promise<string> {
  try {
    const upload = new Upload({
      client: wasabiClient,
      params: {
        Bucket: process.env.NEXT_PUBLIC_WASABI_BUCKET_NAME!,
        Key: key,
        Body: file,
        ContentType: file.type,
        Metadata: {
          'media-type': mediaType,
          'uploaded-at': new Date().toISOString(),
        },
        // Permissions publiques pour affichage
        ACL: 'public-read',
      },
    });

    const result = await upload.done();
    
    // Retourne l'URL publique du fichier
    return `${process.env.WASABI_ENDPOINT}/${process.env.WASABI_BUCKET_NAME}/${key}`;
  } catch (error: any) {
    console.error('Erreur lors de l\'upload vers Wasabi:', error.message || error);
    if (error.$metadata) {
      console.error('Wasabi Error Metadata:', error.$metadata);
    }
    throw new Error('Impossible d\'uploader le fichier');
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