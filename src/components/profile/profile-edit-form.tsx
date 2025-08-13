// Formulaire d'édition du profil utilisateur avec validation Zod
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { User, Mail, Phone, Camera, Save, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

// Schéma de validation Zod pour le profil
const profileSchema = z.object({
  nom: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Le nom ne peut contenir que des lettres, espaces et traits d\'union'),
  prenom: z
    .string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom ne peut pas dépasser 50 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Le prénom ne peut contenir que des lettres, espaces et traits d\'union'),
  email: z
    .string()
    .email('Adresse email invalide')
    .min(1, 'L\'email est requis'),
  telephone: z
    .string()
    .optional()
    .refine((val) => {
      if (!val || val.trim() === '') return true;
      return /^[\+]?[0-9\s\-\(\)]{8,15}$/.test(val);
    }, 'Numéro de téléphone invalide'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileUser {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  avatar: string | null;
  role: string;
}

interface ProfileEditFormProps {
  user: ProfileUser;
}

/**
 * Formulaire d'édition du profil utilisateur
 * Permet de modifier nom, email, téléphone et avatar
 */
export function ProfileEditForm({ user }: ProfileEditFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(user.avatar || '');
  const [imageError, setImageError] = useState(false);
  
  const router = useRouter();
  const { toast } = useToast();

  // Configuration du formulaire avec validation Zod
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nom: user.nom || '',
      prenom: user.prenom || '',
      email: user.email,
      telephone: user.telephone || '',
    },
  });

  // Gestion de l'upload d'avatar
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validation du fichier
      if (file.size > 5 * 1024 * 1024) { // 5MB max
        toast({
          title: 'Erreur',
          description: 'L\'image ne peut pas dépasser 5MB',
          variant: 'destructive',
        });
        return;
      }

      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        toast({
          title: 'Erreur',
          description: 'Seuls les formats JPEG, PNG et WebP sont autorisés',
          variant: 'destructive',
        });
        return;
      }

      setAvatarFile(file);
      
      // Prévisualisation
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
        setImageError(false);
      };
      reader.readAsDataURL(file);
    }
  };

  // Soumission du formulaire
  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);

    try {
      // Mise à jour des informations du profil
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du profil');
      }

      // Upload de l'avatar si un nouveau fichier a été sélectionné
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);

        const avatarResponse = await fetch('/api/profile/avatar', {
          method: 'POST',
          body: formData,
        });

        if (!avatarResponse.ok) {
          throw new Error('Erreur lors de l\'upload de l\'avatar');
        }
      }

      toast({
        title: 'Succès',
        description: 'Votre profil a été mis à jour avec succès',
      });

      // Redirection vers la page de profil
      router.push('/dashboard/profile');
      router.refresh();

    } catch (error) {
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Annulation des modifications
  const handleCancel = () => {
    reset();
    setAvatarFile(null);
    setAvatarPreview(user.avatar || '');
    setImageError(false);
    router.push('/dashboard/profile');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Modifier mes informations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Section Avatar */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              {avatarPreview && !imageError ? (
                <img
                  src={avatarPreview}
                  alt="Aperçu avatar"
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {user.nom?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                </div>
              )}
              
              {/* Bouton de changement d'avatar */}
              <label 
                htmlFor="avatar-upload"
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center cursor-pointer transition-colors"
              >
                <Camera className="w-4 h-4" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-sm text-gray-600 text-center">
              Cliquez sur l'icône pour changer votre photo de profil
              <br />
              <span className="text-xs text-gray-500">JPEG, PNG ou WebP • Max 5MB</span>
            </p>
          </div>

          {/* Champs du formulaire */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nom */}
            <div className="space-y-2">
              <Label htmlFor="nom" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Nom *
              </Label>
              <Input
                id="nom"
                {...register('nom')}
                placeholder="Votre nom de famille"
                className={errors.nom ? 'border-red-500' : ''}
              />
              {errors.nom && (
                <p className="text-sm text-red-600">{errors.nom.message}</p>
              )}
            </div>

            {/* Prénom */}
            <div className="space-y-2">
              <Label htmlFor="prenom" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Prénom *
              </Label>
              <Input
                id="prenom"
                {...register('prenom')}
                placeholder="Votre prénom"
                className={errors.prenom ? 'border-red-500' : ''}
              />
              {errors.prenom && (
                <p className="text-sm text-red-600">{errors.prenom.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Adresse email *
              </Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="votre.email@exemple.com"
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && (
                <p className="text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Téléphone */}
            <div className="space-y-2">
              <Label htmlFor="telephone" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Numéro de téléphone
              </Label>
              <Input
                id="telephone"
                {...register('telephone')}
                placeholder="+237 6 XX XX XX XX"
                className={errors.telephone ? 'border-red-500' : ''}
              />
              {errors.telephone && (
                <p className="text-sm text-red-600">{errors.telephone.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Optionnel • Utilisé pour les notifications importantes
              </p>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-col-reverse md:flex-row md:justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="w-full md:w-auto"
            >
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            
            <Button
              type="submit"
              disabled={isLoading || !isDirty}
              className="w-full md:w-auto"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isLoading ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>

          {/* Note sur les champs requis */}
          <p className="text-xs text-gray-500 pt-4 border-t">
            * Champs obligatoires
          </p>
        </form>
      </CardContent>
    </Card>
  );
}