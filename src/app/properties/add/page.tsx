// Page d'ajout de propriété pour les agents immobiliers
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ArrowLeft, Upload, X, Image as ImageIcon, Video, 
  Home, MapPin, Briefcase, Grid, DollarSign, Ruler,
  Save, Eye
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Schéma de validation
const propertySchema = z.object({
  titre: z.string().min(10, 'Le titre doit contenir au moins 10 caractères'),
  description: z.string().min(50, 'La description doit contenir au moins 50 caractères'),
  type: z.enum(['MAISON', 'TERRAIN', 'BUREAU', 'HANGAR'], {
    required_error: 'Veuillez sélectionner un type de propriété'
  }),
  prix: z.number().min(1000000, 'Le prix minimum est de 1,000,000 FCFA'),
  superficie: z.number().min(10, 'La superficie minimum est de 10 m²'),
  adresse: z.string().min(10, 'L\'adresse doit contenir au moins 10 caractères'),
  ville: z.string().min(1, 'Veuillez sélectionner une ville'),
  fraisVisite: z.number().min(0, 'Les frais de visite ne peuvent pas être négatifs')
});

type PropertyFormData = z.infer<typeof propertySchema>;

// Villes camerounaises
const villes = [
  'Douala', 'Yaoundé', 'Bafoussam', 'Bamenda', 'Garoua',
  'Maroua', 'Ngaoundéré', 'Bertoua', 'Ebolowa', 'Kribi',
  'Limbé', 'Edéa', 'Kumba', 'Foumban', 'Dschang'
];

// Types de propriétés
const typesProps = [
  { value: 'MAISON', label: 'Maison / Villa', icon: Home },
  { value: 'TERRAIN', label: 'Terrain', icon: MapPin },
  { value: 'BUREAU', label: 'Bureau / Local commercial', icon: Briefcase },
  { value: 'HANGAR', label: 'Hangar / Entrepôt', icon: Grid }
];

interface FileUpload {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

export default function AddPropertyPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileUpload[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertySchema)
  });

  // Vérifier l'authentification et les permissions
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/login?callbackUrl=' + encodeURIComponent('/properties/add'));
      return;
    }

    if (session.user.role !== 'AGENT' && session.user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
  }, [session, status, router]);

  // Gestion des uploads de fichiers
  const handleFileUpload = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    fileArray.forEach(file => {
      // Vérifier les types de fichiers
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) return;
      
      // Vérifier les limites (5 images + 5 vidéos max)
      const currentImages = uploadedFiles.filter(f => f.type === 'image').length;
      const currentVideos = uploadedFiles.filter(f => f.type === 'video').length;
      
      if (isImage && currentImages >= 5) {
        alert('Maximum 5 images autorisées');
        return;
      }
      
      if (isVideo && currentVideos >= 5) {
        alert('Maximum 5 vidéos autorisées');
        return;
      }
      
      // Créer l'aperçu
      const reader = new FileReader();
      reader.onload = (e) => {
        const newFile: FileUpload = {
          file,
          preview: e.target?.result as string,
          type: isImage ? 'image' : 'video'
        };
        
        setUploadedFiles(prev => [...prev, newFile]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Supprimer un fichier
  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Gestion du drag & drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    handleFileUpload(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  // Soumission du formulaire
  const onSubmit = async (data: PropertyFormData) => {
    if (uploadedFiles.length === 0) {
      alert('Veuillez ajouter au moins une photo ou vidéo');
      return;
    }

    if (!session || !session.user) {
      alert('Vous devez être connecté pour ajouter une propriété.');
      router.push('/auth/login');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      uploadedFiles.forEach(fileUpload => {
        formData.append('files', fileUpload.file);
      });

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to upload files');
      }

      const { urls: uploadedUrls } = await uploadResponse.json();

      const photoUrls = uploadedUrls.filter((m: any) => m.type === 'photo').map((m: any) => m.url);
      const videoUrls = uploadedUrls.filter((m: any) => m.type === 'video').map((m: any) => m.url);

      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          photos: photoUrls,
          videos: videoUrls,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add property');
      }

      router.push('/dashboard?success=property-added');
      
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la propriété:', error);
      alert('Une erreur est survenue lors de l\'ajout de la propriété');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session || (session.user.role !== 'AGENT' && session.user.role !== 'ADMIN')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">Ajouter une nouvelle propriété</h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Informations générales */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Informations générales</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Titre */}
                <div className="md:col-span-2">
                  <Label htmlFor="titre">Titre de l'annonce *</Label>
                  <Input
                    {...register('titre')}
                    id="titre"
                    placeholder="Ex: Villa moderne à Bonapriso avec piscine"
                    className={errors.titre ? 'border-red-500' : ''}
                  />
                  {errors.titre && (
                    <p className="text-red-500 text-sm mt-1">{errors.titre.message}</p>
                  )}
                </div>

                {/* Type */}
                <div>
                  <Label htmlFor="type">Type de propriété *</Label>
                  <Select onValueChange={(value) => setValue('type', value as any)}>
                    <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {typesProps.map(type => {
                        const Icon = type.icon;
                        return (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {errors.type && (
                    <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
                  )}
                </div>

                {/* Ville */}
                <div>
                  <Label htmlFor="ville">Ville *</Label>
                  <Select onValueChange={(value) => setValue('ville', value)}>
                    <SelectTrigger className={errors.ville ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Sélectionner une ville" />
                    </SelectTrigger>
                    <SelectContent>
                      {villes.map(ville => (
                        <SelectItem key={ville} value={ville}>
                          {ville}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.ville && (
                    <p className="text-red-500 text-sm mt-1">{errors.ville.message}</p>
                  )}
                </div>

                {/* Adresse */}
                <div className="md:col-span-2">
                  <Label htmlFor="adresse">Adresse complète *</Label>
                  <Input
                    {...register('adresse')}
                    id="adresse"
                    placeholder="Ex: Rue des Cocotiers, Bonapriso"
                    className={errors.adresse ? 'border-red-500' : ''}
                  />
                  {errors.adresse && (
                    <p className="text-red-500 text-sm mt-1">{errors.adresse.message}</p>
                  )}
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <Label htmlFor="description">Description détaillée *</Label>
                  <Textarea
                    {...register('description')}
                    id="description"
                    rows={6}
                    placeholder="Décrivez en détail votre propriété (caractéristiques, équipements, environnement...)"
                    className={errors.description ? 'border-red-500' : ''}
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Caractéristiques financières */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Caractéristiques et prix</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Prix */}
                <div>
                  <Label htmlFor="prix">Prix de vente (FCFA) *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      {...register('prix', { valueAsNumber: true })}
                      id="prix"
                      type="number"
                      placeholder="85000000"
                      className={`pl-10 ${errors.prix ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.prix && (
                    <p className="text-red-500 text-sm mt-1">{errors.prix.message}</p>
                  )}
                </div>

                {/* Superficie */}
                <div>
                  <Label htmlFor="superficie">Superficie (m²) *</Label>
                  <div className="relative">
                    <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      {...register('superficie', { valueAsNumber: true })}
                      id="superficie"
                      type="number"
                      placeholder="250"
                      className={`pl-10 ${errors.superficie ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.superficie && (
                    <p className="text-red-500 text-sm mt-1">{errors.superficie.message}</p>
                  )}
                </div>

                {/* Frais de visite */}
                <div>
                  <Label htmlFor="fraisVisite">Frais de visite (FCFA)</Label>
                  <div className="relative">
                    <Eye className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      {...register('fraisVisite', { valueAsNumber: true })}
                      id="fraisVisite"
                      type="number"
                      placeholder="5000"
                      className={`pl-10 ${errors.fraisVisite ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.fraisVisite && (
                    <p className="text-red-500 text-sm mt-1">{errors.fraisVisite.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Upload de fichiers */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Photos et vidéos</h2>
              
              {/* Zone de drop */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                }`}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">
                  Glissez-déposez vos fichiers ici ou 
                  <label className="text-blue-600 cursor-pointer hover:underline ml-1">
                    cliquez pour sélectionner
                    <input
                      type="file"
                      multiple
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                    />
                  </label>
                </p>
                <p className="text-sm text-gray-500">
                  Maximum 5 images et 5 vidéos • Formats: JPG, PNG, MP4, MOV
                </p>
              </div>

              {/* Aperçu des fichiers */}
              {uploadedFiles.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-900 mb-3">
                    Fichiers sélectionnés ({uploadedFiles.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                          {file.type === 'image' ? (
                            <img
                              src={file.preview}
                              alt={`Upload ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Video className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                          {file.type === 'image' ? <ImageIcon className="w-3 h-3" /> : <Video className="w-3 h-3" />}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Publication...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Publier la propriété
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}