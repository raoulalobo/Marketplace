// Utilitaires de formatage centralisés
'use client';

// Formatage de monnaie pour le Franc CFA (XAF)
export const formatCurrency = (amount: number, currency = 'XAF'): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Formatage de nombres avec séparateurs de milliers
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('fr-FR').format(num);
};

// Formatage de pourcentages
export const formatPercent = (value: number, decimals = 1): string => {
  return `${value.toFixed(decimals)}%`;
};

// Formatage de dates
export const formatDate = (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  };
  
  return new Intl.DateTimeFormat('fr-FR', { ...defaultOptions, ...options }).format(new Date(date));
};

// Formatage de dates relatives (ex: "il y a 2 jours")
export const formatRelativeTime = (date: Date | string): string => {
  const now = new Date();
  const pastDate = new Date(date);
  const diffMs = now.getTime() - pastDate.getTime();
  
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);
  
  if (diffMinutes < 1) return 'à l\'instant';
  if (diffMinutes < 60) return `il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
  if (diffHours < 24) return `il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
  if (diffDays < 7) return `il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  if (diffWeeks < 4) return `il y a ${diffWeeks} semaine${diffWeeks > 1 ? 's' : ''}`;
  if (diffMonths < 12) return `il y a ${diffMonths} mois`;
  return `il y a ${diffYears} an${diffYears > 1 ? 's' : ''}`;
};

// Formatage de temps de lecture estimé
export const formatReadingTime = (text: string): string => {
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / wordsPerMinute);
  
  return `${readingTime} min de lecture`;
};

// Formatage de tailles de fichiers
export const formatFileSize = (bytes: number): string => {
  const sizes = ['o', 'Ko', 'Mo', 'Go', 'To'];
  if (bytes === 0) return '0 o';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = bytes / Math.pow(1024, i);
  
  return `${size.toFixed(1)} ${sizes[i]}`;
};

// Formatage de numéros de téléphone camerounais
export const formatPhoneNumber = (phone: string): string => {
  // Nettoyer le numéro
  const cleaned = phone.replace(/\D/g, '');
  
  // Vérifier si c'est un numéro camerounais
  if (cleaned.length === 9 && cleaned.startsWith('6')) {
    return `+237 ${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 7)} ${cleaned.slice(7)}`;
  }
  
  if (cleaned.length === 12 && cleaned.startsWith('237')) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10)}`;
  }
  
  // Retourner le numéro original si le format n'est pas reconnu
  return phone;
};

// Formatage d'adresses
export const formatAddress = (address: string): string => {
  return address
    .split(',')
    .map(part => part.trim())
    .filter(part => part.length > 0)
    .join(', ');
};

// Formatage de noms propres
export const formatName = (firstName: string, lastName: string): string => {
  const formattedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  const formattedLastName = lastName.charAt(0).toUpperCase() + lastName.slice(1).toLowerCase();
  
  return `${formattedFirstName} ${formattedLastName}`;
};

// Formatage de statuts
export const formatStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'PENDING': 'En attente',
    'ACCEPTED': 'Accepté',
    'REJECTED': 'Refusé',
    'COMPLETED': 'Terminé',
    'ACTIVE': 'Actif',
    'INACTIVE': 'Inactif',
    'SOLD': 'Vendu',
    'RENTED': 'Loué'
  };
  
  return statusMap[status] || status;
};

// Formatage de types de propriétés
export const formatPropertyType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'MAISON': 'Maison',
    'TERRAIN': 'Terrain',
    'BUREAU': 'Bureau',
    'HANGAR': 'Hangar',
    'AUTRE': 'Autre'
  };
  
  return typeMap[type] || type;
};

// Formatage de superficies
export const formatSurface = (surface: number): string => {
  if (surface >= 10000) {
    return `${(surface / 10000).toFixed(1)} ha`;
  }
  return `${surface.toFixed(0)} m²`;
};

// Formatage de distances
export const formatDistance = (distance: number): string => {
  if (distance < 1000) {
    return `${Math.round(distance)} m`;
  }
  return `${(distance / 1000).toFixed(1)} km`;
};

// Formatage de durées
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) {
    return `${remainingMinutes} min`;
  }
  
  if (remainingMinutes === 0) {
    return `${hours} h`;
  }
  
  return `${hours} h ${remainingMinutes} min`;
};

// Troncation de texte avec ellipsis
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.slice(0, maxLength).trim() + '...';
};

// Capitalisation de texte
export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

// Capitalisation de chaque mot
export const titleCase = (text: string): string => {
  return text
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
};

// Formatage de badges et tags
export const formatBadge = (count: number): string => {
  if (count > 999) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  if (count > 999999) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  return count.toString();
};

// Export par défaut
export default {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatDate,
  formatRelativeTime,
  formatReadingTime,
  formatFileSize,
  formatPhoneNumber,
  formatAddress,
  formatName,
  formatStatus,
  formatPropertyType,
  formatSurface,
  formatDistance,
  formatDuration,
  truncateText,
  capitalize,
  titleCase,
  formatBadge
};