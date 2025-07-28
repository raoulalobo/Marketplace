import { NextRequest, NextResponse } from 'next/server';
import { S3Client } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Configuration du client Wasabi S3
const wasabiClient = new S3Client({
  endpoint: process.env.WASABI_ENDPOINT!,
  region: process.env.WASABI_REGION!,
  credentials: {
    accessKeyId: process.env.WASABI_ACCESS_KEY_ID!,
    secretAccessKey: process.env.WASABI_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // Requis pour Wasabi
});

// Fonction pour uploader un fichier vers Wasabi
async function uploadToWasabi(file: File, key: string, mediaType: 'photo' | 'video'): Promise<string> {
  try {
    const upload = new Upload({
      client: wasabiClient,
      params: {
        Bucket: process.env.WASABI_BUCKET_NAME!,
        Key: key,
        Body: file,
        ContentType: file.type,
        Metadata: {
          'media-type': mediaType,
          'uploaded-at': new Date().toISOString(),
        },
        // ACL: 'public-read', // Removed: Use bucket policies for public access
      },
    });

    const result = await upload.done();
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
function generateFileKey(userId: string, filename: string, mediaType: 'photo' | 'video'): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const extension = filename.split('.').pop();
  
  // Note: propertyId is not available here, so we'll use a generic path
  // The actual propertyId will be associated in the main /api/properties route
  return `uploads/${mediaType}s/${userId}_${timestamp}_${randomSuffix}.${extension}`;
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const formData = await request.formData();
  const files = formData.getAll('files') as File[];

  if (!files || files.length === 0) {
    return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 400 });
  }

  try {
    const uploadedUrls: { url: string; type: 'photo' | 'video' }[] = [];

    for (const file of files) {
      const mediaType = file.type.startsWith('image/') ? 'photo' : 'video';
      const fileKey = generateFileKey(session.user.id, file.name, mediaType);
      const url = await uploadToWasabi(file, fileKey, mediaType);
      uploadedUrls.push({ url, type: mediaType });
    }

    return NextResponse.json({ urls: uploadedUrls }, { status: 200 });
  } catch (error) {
    console.error('Erreur lors du traitement de l\'upload:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur lors de l\'upload' }, { status: 500 });
  }
}