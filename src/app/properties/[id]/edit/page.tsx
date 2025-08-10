// Page d'édition de propriété - Design moderne et responsive
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  ArrowLeft, Upload, X, Image as ImageIcon, Video, 
  Home, MapPin, Briefcase, Grid, DollarSign, Ruler,
  Save, Eye, AlertTriangle, CheckCircle, Loader2, Trash2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PropertyImage } from '@/components/ui/property-image';

// Schéma de validation pour l'édition
const editPropertySchema = z.object({
  titre: z.string().min(10, 'Le titre doit contenir au moins 10 caractères'),
  description: z.string().min(50, 'La description doit contenir au moins 50 caractères'),
  type: z.enum(['MAISON', 'TERRAIN', 'BUREAU', 'HANGAR'], {
    required_error: 'Veuillez sélectionner un type de propriété'
  }),
  prix: z.number().min(1000000, 'Le prix minimum est de 1,000,000 FCFA'),
  superficie: z.number().min(10, 'La superficie minimum est de 10 m²'),
  adresse: z.string().min(10, 'L\'adresse doit contenir au moins 10 caractères'),
  ville: z.string().min(1, 'Veuillez sélectionner une ville'),
  fraisVisite: z.number().min(0, 'Les frais de visite ne peuvent pas être négatifs'),
  isActive: z.boolean().optional()
});

type EditPropertyFormData = z.infer<typeof editPropertySchema>;

// Interface pour les données de propriété avec médias
interface Property extends EditPropertyFormData {
  id: string;
  createdAt: string;
  updatedAt: string;
  medias: Array<{
    id: string;
    url: string;
    type: 'PHOTO' | 'VIDEO';
    order: number;
  }>;
  agent: {
    id: string;
    nom: string;
    prenom: string;
  };
}

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

export default function EditPropertyPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();

  // États
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const propertyId = params.id as string;

  // Configuration du formulaire
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty }
  } = useForm<EditPropertyFormData>({
    resolver: zodResolver(editPropertySchema)
  });

  // Charger les données de la propriété
  useEffect(() => {
    const fetchProperty = async () => {
      if (!session || status === 'loading') return;

      try {
        setLoading(true);
        setError('');

        const response = await fetch(`/api/properties/${propertyId}`);
        
        if (response.ok) {
          const data = await response.json();
          const propertyData = data.property;
          
          // Vérifier que l'utilisateur est le propriétaire
          if (session.user.role !== 'ADMIN' && propertyData.agent.id !== session.user.id) {
            setError('Vous n\'êtes pas autorisé à modifier cette propriété');
            return;
          }

          setProperty(propertyData);
          
          // Pré-remplir le formulaire
          setValue('titre', propertyData.titre);
          setValue('description', propertyData.description);
          setValue('type', propertyData.type);
          setValue('prix', propertyData.prix);
          setValue('superficie', propertyData.superficie);
          setValue('adresse', propertyData.adresse);
          setValue('ville', propertyData.ville || '');
          setValue('fraisVisite', propertyData.fraisVisite);
          setValue('isActive', propertyData.isActive);
          
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Propriété non trouvée');
        }
      } catch (err) {
        console.error('Erreur lors du chargement:', err);
        setError('Erreur de connexion');
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [propertyId, session, status, setValue]);

  // Soumission du formulaire
  const onSubmit = async (data: EditPropertyFormData) => {
    if (!property) return;

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const response = await fetch(`/api/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        setSuccess('Propriété mise à jour avec succès !');
        setTimeout(() => {
          router.push('/dashboard/properties');
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Erreur lors de la sauvegarde');
      }
    } catch (err) {
      console.error('Erreur de sauvegarde:', err);
      setError('Erreur de connexion lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // Fonction pour supprimer un média
  const handleDeleteMedia = async (mediaId: string) => {
    if (!property) return;
    
    try {
      const response = await fetch(`/api/properties/${propertyId}/media/${mediaId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // Mettre à jour l'état local
        setProperty({
          ...property,
          medias: property.medias.filter(media => media.id !== mediaId)
        });
      }
    } catch (err) {
      console.error('Erreur lors de la suppression du média:', err);
    }
  };

  // Gestion des états de chargement et d'erreur
  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="animate-pulse space-y-6">
                <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Accès refusé</h2>
          <p className="text-gray-600">Vous devez être connecté pour modifier une propriété.</p>
        </div>
      </div>
    );
  }

  if (error && !property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.back()} variant="outline">
            Retour
          </Button>
        </div>
      </div>
    );
  }

  if (!property) return null;

  const selectedType = typesProps.find(t => t.value === watch('type'));
  const TypeIcon = selectedType?.icon || Home;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* En-tête selon le croquis utilisateur */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Modifier la propriété
            </h1>
            <p className="text-gray-600 mb-6">
              Mettez à jour les informations de votre propriété
            </p>
            
            {/* Barre d'actions horizontale - responsive */}
            <div className="flex items-center justify-center gap-3 flex-wrap sm:gap-4">
              <Button 
                variant="outline" 
                onClick={() => router.back()}
                className="flex items-center gap-2 min-w-24"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Retour
              </Button>
              
              <Button 
                asChild
                variant="outline"
                className="flex items-center gap-2 min-w-32"
                size="sm"
              >
                <a href={`/properties/${propertyId}`} target="_blank" rel="noopener">
                  <Eye className="w-4 h-4" />
                  Prévisualiser
                </a>
              </Button>
              
              <Button
                type="button"
                variant={property.isActive ? "default" : "outline"}
                size="sm"
                className={`flex items-center gap-2 min-w-24 ${
                  property.isActive 
                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                    : 'border-green-300 text-green-700 hover:bg-green-50'
                }`}
                onClick={() => {
                  const newStatus = !property.isActive;
                  setValue('isActive', newStatus);
                  setProperty(prev => prev ? {...prev, isActive: newStatus} : null);
                }}
              >
                {property.isActive ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Active
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    Inactive
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Messages d'état */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-green-700">{success}</span>
            </div>
          )}

          {/* Formulaire principal */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 p-8">
              
              {/* Section: Informations générales */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <TypeIcon className="w-5 h-5 text-blue-600" />
                  Informations générales
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Titre */}
                  <div className="md:col-span-2">
                    <Label htmlFor="titre" className="block text-sm font-medium text-gray-700 mb-2">
                      Titre de l'annonce *
                    </Label>
                    <Input
                      id="titre"
                      {...register('titre')}
                      className={`w-full ${errors.titre ? 'border-red-300 focus:border-red-500' : ''}`}
                      placeholder="Ex: Belle villa moderne avec piscine à Douala"
                    />
                    {errors.titre && (
                      <p className="text-red-500 text-sm mt-1">{errors.titre.message}</p>
                    )}
                  </div>

                  {/* Type de propriété */}
                  <div>
                    <Label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                      Type de propriété *
                    </Label>
                    <Select onValueChange={(value) => setValue('type', value as any)} value={watch('type')}>
                      <SelectTrigger className={errors.type ? 'border-red-300' : ''}>
                        <SelectValue placeholder="Sélectionner le type" />
                      </SelectTrigger>
                      <SelectContent>
                        {typesProps.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="w-4 h-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.type && (
                      <p className="text-red-500 text-sm mt-1">{errors.type.message}</p>
                    )}
                  </div>

                  {/* Ville */}
                  <div>
                    <Label htmlFor="ville" className="block text-sm font-medium text-gray-700 mb-2">
                      Ville *
                    </Label>
                    <Select onValueChange={(value) => setValue('ville', value)} value={watch('ville')}>
                      <SelectTrigger className={errors.ville ? 'border-red-300' : ''}>
                        <SelectValue placeholder="Sélectionner la ville" />
                      </SelectTrigger>
                      <SelectContent>
                        {villes.map((ville) => (
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

                  {/* Prix */}
                  <div>
                    <Label htmlFor="prix" className="block text-sm font-medium text-gray-700 mb-2">
                      Prix (FCFA) *
                    </Label>
                    <div className="relative">
                      <DollarSign className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        id="prix"
                        type="number"
                        {...register('prix', { valueAsNumber: true })}
                        className={`pl-10 ${errors.prix ? 'border-red-300 focus:border-red-500' : ''}`}
                        placeholder="25000000"
                      />
                    </div>
                    {errors.prix && (
                      <p className="text-red-500 text-sm mt-1">{errors.prix.message}</p>
                    )}
                  </div>

                  {/* Superficie */}
                  <div>
                    <Label htmlFor="superficie" className="block text-sm font-medium text-gray-700 mb-2">
                      Superficie (m²) *
                    </Label>
                    <div className="relative">
                      <Ruler className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        id="superficie"
                        type="number"
                        {...register('superficie', { valueAsNumber: true })}
                        className={`pl-10 ${errors.superficie ? 'border-red-300 focus:border-red-500' : ''}`}
                        placeholder="150"
                      />
                    </div>
                    {errors.superficie && (
                      <p className="text-red-500 text-sm mt-1">{errors.superficie.message}</p>
                    )}
                  </div>

                  {/* Adresse complète */}
                  <div className="md:col-span-2">
                    <Label htmlFor="adresse" className="block text-sm font-medium text-gray-700 mb-2">
                      Adresse complète *
                    </Label>
                    <div className="relative">
                      <MapPin className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
                      <Textarea
                        id="adresse"
                        {...register('adresse')}
                        className={`pl-10 ${errors.adresse ? 'border-red-300 focus:border-red-500' : ''}`}
                        placeholder="Quartier, rue, numéro, points de repère..."
                        rows={2}
                      />
                    </div>
                    {errors.adresse && (
                      <p className="text-red-500 text-sm mt-1">{errors.adresse.message}</p>
                    )}
                  </div>

                  {/* Frais de visite */}
                  <div>
                    <Label htmlFor="fraisVisite" className="block text-sm font-medium text-gray-700 mb-2">
                      Frais de visite (FCFA)
                    </Label>
                    <Input
                      id="fraisVisite"
                      type="number"
                      {...register('fraisVisite', { valueAsNumber: true })}
                      className={errors.fraisVisite ? 'border-red-300 focus:border-red-500' : ''}
                      placeholder="0"
                    />
                    <p className="text-gray-500 text-xs mt-1">
                      Laissez 0 pour une visite gratuite
                    </p>
                    {errors.fraisVisite && (
                      <p className="text-red-500 text-sm mt-1">{errors.fraisVisite.message}</p>
                    )}
                  </div>

                </div>
              </div>

              {/* Section: Description */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Description détaillée
                </h2>
                
                <div>
                  <Label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description complète *
                  </Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    className={`min-h-32 ${errors.description ? 'border-red-300 focus:border-red-500' : ''}`}
                    placeholder="Décrivez votre propriété en détail : caractéristiques, commodités, environnement..."
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                  )}
                </div>
              </div>

              {/* Section: Photos et médias existants */}
              {property.medias.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Photos et médias actuels
                  </h2>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {property.medias.map((media, index) => (
                      <div key={media.id} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                          {media.type === 'PHOTO' ? (
                            <PropertyImage
                              src={media.url}
                              alt={`Photo ${index + 1}`}
                              width={200}
                              height={200}
                              className="w-full h-full object-cover"
                              propertyType={property.type}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-200">
                              <Video className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          
                          {/* Bouton de suppression */}
                          <button
                            type="button"
                            onClick={() => handleDeleteMedia(media.id)}
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          
                          {/* Numéro d'ordre */}
                          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                            {media.order}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions de sauvegarde */}
              <div className="border-t border-gray-200 pt-8">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    {isDirty && "* Vous avez des modifications non sauvegardées"}
                  </div>
                  
                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      disabled={saving}
                    >
                      Annuler
                    </Button>
                    
                    <Button
                      type="submit"
                      disabled={saving}
                      className="min-w-32"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sauvegarde...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Sauvegarder
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}