// Modal pour informer qu'une connexion est requise
'use client';

import { useRouter } from 'next/navigation';
import { Lock, X, LogIn, UserPlus, Heart, Calendar, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuthRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: 'visit' | 'favorite' | 'report';
}

// Configuration des messages selon l'action
const actionConfig = {
  visit: {
    title: 'Demander une visite',
    icon: Calendar,
    description: 'Pour demander une visite de cette propriété, vous devez être connecté à votre compte.',
    benefits: [
      'Suivre le statut de vos demandes de visite',
      'Recevoir des notifications de l\'agent',
      'Accéder à l\'historique de vos visites'
    ]
  },
  favorite: {
    title: 'Ajouter aux favoris',
    icon: Heart,
    description: 'Pour sauvegarder cette propriété dans vos favoris, vous devez être connecté à votre compte.',
    benefits: [
      'Sauvegarder vos propriétés préférées',
      'Accéder à vos favoris depuis n\'importe où',
      'Recevoir des alertes sur vos propriétés favorites'
    ]
  },
  report: {
    title: 'Signaler un problème',
    icon: Flag,
    description: 'Pour signaler un problème sur cette propriété, vous devez être connecté à votre compte.',
    benefits: [
      'Assurer la traçabilité de vos signalements',
      'Suivre le traitement de vos demandes',
      'Contribuer à améliorer la plateforme'
    ]
  }
}

export function AuthRequiredModal({ isOpen, onClose, action }: AuthRequiredModalProps) {
  const router = useRouter();
  const config = actionConfig[action];
  const ActionIcon = config.icon;

  // Fonction pour rediriger vers la connexion
  const handleLogin = () => {
    const callbackUrl = encodeURIComponent(window.location.href);
    router.push(`/auth/login?callbackUrl=${callbackUrl}`);
  };

  // Fonction pour rediriger vers l'inscription
  const handleSignup = () => {
    const callbackUrl = encodeURIComponent(window.location.href);
    router.push(`/auth/register?callbackUrl=${callbackUrl}`);
  };

  // Ne pas rendre le composant si le modal n'est pas ouvert
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Lock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Connexion requise
              </h3>
              <p className="text-sm text-gray-600">
                {config.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Contenu */}
        <div className="p-6">
          {/* Icône et description */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <ActionIcon className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-gray-700 leading-relaxed">
              {config.description}
            </p>
          </div>

          {/* Avantages */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Cela nous permet de :
            </h4>
            <ul className="space-y-2">
              {config.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleLogin}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <LogIn className="w-4 h-4 mr-2" />
              Se connecter
            </Button>
            
            <Button
              onClick={handleSignup}
              variant="outline"
              className="w-full"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Créer un compte
            </Button>
            
            <Button
              onClick={onClose}
              variant="ghost"
              className="w-full text-gray-600"
            >
              Annuler
            </Button>
          </div>

          {/* Note */}
          <div className="mt-6 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm text-green-800">
              <p className="font-medium mb-1">Inscription gratuite</p>
              <p className="text-xs">
                Créez votre compte en moins de 2 minutes et accédez à toutes les fonctionnalités 
                de Marketplace Immo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}