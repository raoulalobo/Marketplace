// Composant Toast pour les notifications système
'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose?: (id: string) => void;
}

interface ToastItemProps extends ToastProps {
  onClose: (id: string) => void;
}

// Configuration des types de toast
const toastConfig = {
  success: {
    icon: CheckCircle,
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    iconColor: 'text-green-600',
    titleColor: 'text-green-900',
    messageColor: 'text-green-700'
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    iconColor: 'text-red-600',
    titleColor: 'text-red-900',
    messageColor: 'text-red-700'
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    iconColor: 'text-yellow-600',
    titleColor: 'text-yellow-900',
    messageColor: 'text-yellow-700'
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconColor: 'text-blue-600',
    titleColor: 'text-blue-900',
    messageColor: 'text-blue-700'
  }
};

// Composant Toast individuel
function ToastItem({ 
  id, 
  type, 
  title, 
  message, 
  duration = 5000, 
  onClose 
}: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const config = toastConfig[type];
  const Icon = config.icon;

  // Animation d'entrée
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Timer de fermeture automatique
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => handleClose(), duration);
      return () => clearTimeout(timer);
    }
  }, [duration]);

  // Fonction pour fermer le toast
  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(id), 300); // Attendre la fin de l'animation
  };

  return (
    <div
      className={`
        relative transform transition-all duration-300 ease-in-out mb-3
        ${isVisible && !isExiting 
          ? 'translate-x-0 opacity-100 scale-100' 
          : 'translate-x-full opacity-0 scale-95'
        }
      `}
    >
      <div
        className={`
          max-w-sm w-full shadow-lg rounded-lg border p-4
          ${config.bgColor} ${config.borderColor}
        `}
      >
        <div className="flex items-start">
          {/* Icône */}
          <div className="flex-shrink-0">
            <Icon className={`w-5 h-5 ${config.iconColor}`} />
          </div>

          {/* Contenu */}
          <div className="ml-3 flex-1">
            <p className={`text-sm font-medium ${config.titleColor}`}>
              {title}
            </p>
            {message && (
              <p className={`mt-1 text-sm ${config.messageColor}`}>
                {message}
              </p>
            )}
          </div>

          {/* Bouton de fermeture */}
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleClose}
              className={`
                inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2
                hover:bg-white/50 transition-colors
                ${config.iconColor} hover:${config.iconColor}/80
              `}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Barre de progression (optionnelle) */}
        {duration > 0 && (
          <div className="mt-3 w-full bg-white/30 rounded-full h-1">
            <div
              className={`h-1 rounded-full ${config.iconColor.replace('text-', 'bg-')}`}
              style={{
                animation: `shrink ${duration}ms linear`,
                width: '100%'
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// Composant conteneur pour tous les toasts
interface ToastContainerProps {
  toasts: ToastProps[];
  onClose: (id: string) => void;
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <>
      {/* Styles CSS pour l'animation */}
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      
      {/* Conteneur fixe */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            {...toast}
            onClose={onClose}
          />
        ))}
      </div>
    </>
  );
}

// Hook pour gérer les toasts
export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  // Fonction pour ajouter un toast
  const addToast = (
    type: ToastProps['type'],
    title: string,
    message?: string,
    duration?: number
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastProps = {
      id,
      type,
      title,
      message,
      duration: duration !== undefined ? duration : 5000
    };

    setToasts(prev => [...prev, newToast]);
    return id;
  };

  // Fonction pour supprimer un toast
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Fonctions de convenance
  const toast = {
    success: (title: string, message?: string, duration?: number) => 
      addToast('success', title, message, duration),
    
    error: (title: string, message?: string, duration?: number) => 
      addToast('error', title, message, duration),
    
    warning: (title: string, message?: string, duration?: number) => 
      addToast('warning', title, message, duration),
    
    info: (title: string, message?: string, duration?: number) => 
      addToast('info', title, message, duration),
    
    remove: removeToast,
    
    clear: () => setToasts([])
  };

  return {
    toasts,
    toast,
    removeToast
  };
}