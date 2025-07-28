// Utilitaires généraux pour l'application
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Fonction pour combiner les classes CSS avec Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formater les prix en Francs CFA
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('fr-CM', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// Formater les numéros de téléphone camerounais
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Nettoyer le numéro
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('237')) {
    const number = cleaned.substring(3);
    return `+237 ${number.substring(0, 3)} ${number.substring(3, 6)} ${number.substring(6)}`;
  } else if (cleaned.length === 9) {
    return `+237 ${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6)}`;
  }
  
  return phone;
}

// Capitaliser la première lettre
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// Tronquer le texte
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
}

// Générer des initiales à partir d'un nom
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
}