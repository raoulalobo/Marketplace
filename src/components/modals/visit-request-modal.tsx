// Composant modal pour demander une visite d'une propriété
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, X, Clock, DollarSign, Send, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

// Schéma de validation pour la demande de visite
const visitRequestSchema = z.object({
  message: z.string().optional(),
  datePreferee: z.string().optional()
});

type VisitRequestFormData = z.infer<typeof visitRequestSchema>;

interface Property {
  id: string;
  titre: string;
  prix: number;
  fraisVisite: number;
  adresse: string;
  agent: {
    nom: string;
    prenom: string;
  };
}

interface VisitRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  onSuccess?: (visitRequest: unknown) => void;
}

export function VisitRequestModal({ 
  isOpen, 
  onClose, 
  property,
  onSuccess 
}: VisitRequestModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Configuration du formulaire avec react-hook-form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<VisitRequestFormData>({
    resolver: zodResolver(visitRequestSchema)
  });

  // Fonction pour formater le prix
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  // Fonction pour extraire la ville de l'adresse
  const getCity = (address: string) => {
    const parts = address.split(',');
    return parts[parts.length - 1]?.trim() || '';
  };

  // Fonction pour obtenir la date minimale (aujourd'hui)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Fonction pour obtenir la date maximale (3 mois à partir d'aujourd'hui)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    return maxDate.toISOString().split('T')[0];
  };

  // Gestionnaire de soumission du formulaire
  const onSubmit = async (data: VisitRequestFormData) => {
    setIsLoading(true);
    setError('');

    try {
      // Préparer les données pour l'API
      const requestData: Record<string, unknown> = {};
      
      if (data.message?.trim()) {
        requestData.message = data.message.trim();
      }
      
      if (data.datePreferee) {
        // Convertir la date en ISO string avec l'heure par défaut (14h00)
        const dateTime = new Date(data.datePreferee + 'T14:00:00');
        requestData.datePreferee = dateTime.toISOString();
      }

      // Appel à l'API
      const response = await fetch(`/api/properties/${property.id}/visit-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la création de la demande');
      }

      // Succès : réinitialiser le formulaire et appeler le callback
      reset();
      if (onSuccess) {
        onSuccess(result.visitRequest);
      }
      onClose();

    } catch (err: unknown) {
      console.error('Erreur lors de la demande de visite:', err);
      setError(err.message || 'Une erreur s\'est produite');
    } finally {
      setIsLoading(false);
    }
  };

  // Gestionnaire de fermeture du modal
  const handleClose = () => {
    if (!isLoading) {
      reset();
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
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Demander une visite
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
          {/* Informations de la propriété */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">Prix de la propriété</span>
              <p className="text-blue-600 font-semibold">{formatPrice(property.prix)}</p>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">Frais de visite</span>
              <span className="text-sm font-semibold text-blue-600">
                {formatPrice(property.fraisVisite)}
              </span>
            </div>
            <div className="flex items-center text-sm text-blue-700">
              <Clock className="w-4 h-4 mr-1" />
              <span>Visite avec {property.agent.prenom} {property.agent.nom}</span>
            </div>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Date préférée */}
            <div>
              <Label htmlFor="datePreferee" className="text-sm font-medium text-gray-700 mb-2 block">
                Date préférée (optionnel)
              </Label>
              <Input
                id="datePreferee"
                type="date"
                min={getMinDate()}
                max={getMaxDate()}
                {...register('datePreferee')}
                className="w-full"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Si aucune date n'est sélectionnée, l'agent vous proposera des créneaux
              </p>
            </div>

            {/* Message optionnel */}
            <div>
              <Label htmlFor="message" className="text-sm font-medium text-gray-700 mb-2 block">
                Message pour l'agent (optionnel)
              </Label>
              <Textarea
                id="message"
                placeholder="Ajoutez un message à votre demande de visite..."
                {...register('message')}
                className="w-full h-24 resize-none"
                disabled={isLoading}
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1">
                Précisez vos disponibilités ou questions particulières
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
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Envoi...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Envoyer la demande
                  </div>
                )}
              </Button>
            </div>
          </form>

          {/* Note importante */}
          <div className="mt-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <DollarSign className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Frais de visite : {formatPrice(property.fraisVisite)}</p>
                <p className="text-xs">
                  Les frais de visite sont à régler directement à l'agent lors de la visite.
                  Ces frais sont généralement déduits du prix de la propriété en cas d'achat.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}