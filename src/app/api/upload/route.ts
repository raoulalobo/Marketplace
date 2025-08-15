import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { uploadToBackblaze, generateFileKey, validateMediaFile } from '@/lib/backblaze';


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
      
      // Valider le fichier
      const validation = validateMediaFile(file, mediaType);
      if (!validation.isValid) {
        return NextResponse.json({ error: validation.error }, { status: 400 });
      }
      
      const fileKey = generateFileKey(session.user.id, 'temp', file.name, mediaType);
      const url = await uploadToBackblaze({ file, key: fileKey, mediaType });
      uploadedUrls.push({ url, type: mediaType });
    }

    return NextResponse.json({ urls: uploadedUrls }, { status: 200 });
  } catch (error) {
    console.error('Erreur lors du traitement de l\'upload:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur lors de l\'upload' }, { status: 500 });
  }
}