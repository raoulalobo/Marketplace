// Composant modal pour signaler un problème sur une propriété
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Flag, X, AlertTriangle, Send, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Schéma de validation pour le signalement
const reportSchema = z.object({
  motif: z.string().min(1, 'Veuillez sélectionner un motif'),
  description: z.string()
    .min(10, 'La description doit contenir au moins 10 caractères')
    .max(1000, 'La description ne peut pas dépasser 1000 caractères')
});

type ReportFormData = z.infer<typeof reportSchema>;

// Motifs de signalement disponibles
const REPORT_MOTIFS = {
  CONTENU_INAPPROPRIE: {
    label: 'Contenu inapproprié',
    description: 'Photos, texte ou informations inappropriées'
  },
  INFORMATIONS_ERRONEES: {
    label: 'Informations erronées',
    description: 'Prix, superficie, localisation incorrects'
  },
  PRIX_SUSPECT: {
    label: 'Prix suspect ou trompeur',
    description: 'Prix anormalement bas ou élevé pour le marché'
  },
  PHOTOS_TROMPEUSES: {
    label: 'Photos trompeuses',
    description: 'Photos ne correspondant pas à la propriété'
  },
  SPAM: {
    label: 'Spam ou publicité',
    description: 'Contenu publicitaire non pertinent'
  },
  ARNAQUE: {
    label: 'Tentative d\'arnaque',
    description: 'Suspicion d\'activité frauduleuse'
  },
  AUTRE: {
    label: 'Autre problème',
    description: 'Autre type de problème non listé'
  }
};

interface Property {
  id: string;
  titre: string;
  adresse: string;
  agent: {
    nom: string;
    prenom: string;
  };
}

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  onSuccess?: (report: any) => void;
}

export function ReportModal({ 
  isOpen, 
  onClose, 
  property,
  onSuccess 
}: ReportModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedMotif, setSelectedMotif] = useState<string>('');

  // Configuration du formulaire avec react-hook-form
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema)
  });

  // Fonction pour extraire la ville de l'adresse
  const getCity = (address: string) => {
    const parts = address.split(',');
    return parts[parts.length - 1]?.trim() || '';
  };

  // Gestionnaire de changement de motif
  const handleMotifChange = (value: string) => {
    setSelectedMotif(value);
    setValue('motif', value);
  };

  // Gestionnaire de soumission du formulaire
  const onSubmit = async (data: ReportFormData) => {
    setIsLoading(true);
    setError('');

    try {
      // Appel à l'API
      const response = await fetch(`/api/properties/${property.id}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          motif: data.motif,
          description: data.description.trim()
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la création du signalement');
      }

      // Succès : réinitialiser le formulaire et appeler le callback
      reset();
      setSelectedMotif('');
      if (onSuccess) {
        onSuccess(result.report);
      }
      onClose();

    } catch (err: any) {
      console.error('Erreur lors du signalement:', err);
      setError(err.message || 'Une erreur s\'est produite');
    } finally {
      setIsLoading(false);
    }
  };

  // Gestionnaire de fermeture du modal
  const handleClose = () => {
    if (!isLoading) {
      reset();
      setSelectedMotif('');
      setError('');
      onClose();
    }
  };

  // Ne pas rendre le composant si le modal n'est pas ouvert
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <Flag className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Signaler un problème
              </h3>
              <p className="text-sm text-gray-600">
                {property.titre}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6">
          {/* Avertissement */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Signalement de problème</p>
                <p className="text-xs leading-relaxed">
                  Utilisez cette fonction uniquement pour signaler des contenus inappropriés, 
                  des informations erronées ou des problèmes légitimes. Les signalements abusifs 
                  peuvent entraîner des sanctions.
                </p>
              </div>
            </div>
          </div>

          {/* Informations de la propriété */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="text-sm">
              <p className="font-medium text-gray-900 mb-1">{property.titre}</p>
              <p className="text-gray-600 mb-1">{property.adresse}</p>
              <p className="text-gray-500">
                Propriété gérée par {property.agent.prenom} {property.agent.nom}
              </p>
            </div>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Motif du signalement */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 block">
                Motif du signalement *
              </Label>
              <Select value={selectedMotif} onValueChange={handleMotifChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionnez un motif" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REPORT_MOTIFS).map(([key, motif]) => (
                    <SelectItem key={key} value={key}>
                      <div>
                        <div className="font-medium">{motif.label}</div>
                        <div className="text-xs text-gray-500">{motif.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.motif && (
                <p className="text-xs text-red-600 mt-1">{errors.motif.message}</p>
              )}
            </div>

            {/* Description détaillée */}
            <div>
              <Label htmlFor="description" className="text-sm font-medium text-gray-700 mb-2 block">
                Description du problème *
              </Label>
              <Textarea
                id="description"
                placeholder="Décrivez en détail le problème que vous avez identifié..."
                {...register('description')}
                className="w-full h-32 resize-none"
                disabled={isLoading}
                maxLength={1000}
              />
              {errors.description && (
                <p className="text-xs text-red-600 mt-1">{errors.description.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Soyez aussi précis que possible pour nous aider à traiter votre signalement
              </p>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Envoi...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Envoyer le signalement
                  </div>
                )}
              </Button>
            </div>
          </form>

          {/* Note de confidentialité */}
          <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Confidentialité</p>
              <p className="text-xs leading-relaxed">
                Votre signalement sera traité de manière confidentielle par notre équipe de modération. 
                Les informations transmises ne seront utilisées que dans le cadre du traitement de votre signalement.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}