// Schémas de validation communs pour l'application
import { z } from 'zod';

// Schéma de validation pour les IDs (CUID format)
export const idSchema = z.string()
  .min(1, 'L\'ID est requis')
  .regex(/^[c][a-z0-9]{20,}$/i, {
    message: 'Format d\'ID invalide. Doit être un CUID valide (ex: ckv5x2w7k0000...)'
  })
  .transform((val) => val.trim());

// Schéma de validation pour les UUIDs
export const uuidSchema = z.string()
  .min(1, 'L\'UUID est requis')
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i, {
    message: 'Format d\'UUID invalide'
  })
  .transform((val) => val.trim());

// Schéma pour la pagination
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

// Schéma pour la recherche
export const searchSchema = z.object({
  query: z.string().min(1, 'Le terme de recherche est requis').max(100),
  filters: z.record(z.any()).optional(),
  ...paginationSchema.shape,
});

// Schéma pour les filtres de propriétés
export const propertyFiltersSchema = z.object({
  type: z.enum(['MAISON', 'TERRAIN', 'BUREAU', 'HANGAR', 'AUTRE']).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  minSurface: z.coerce.number().min(0).optional(),
  maxSurface: z.coerce.number().min(0).optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().optional(),
  agentId: z.string().optional(),
  ...paginationSchema.shape,
});

// Schéma pour les filtres de date
export const dateFiltersSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  timezone: z.string().default('Africa/Douala'),
});

// Schéma pour les uploads de fichiers
export const fileUploadSchema = z.object({
  file: z.instanceof(File, {
    message: 'Le fichier est requis',
  }),
  type: z.enum(['photo', 'video']),
  propertyId: idSchema,
});

// Validation des types de fichiers images
export const imageFileSchema = fileUploadSchema.extend({
  file: z.instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, {
      message: 'L\'image ne doit pas dépasser 5MB',
    })
    .refine((file) => {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      return allowedTypes.includes(file.type);
    }, {
      message: 'Type d\'image non supporté. Formats acceptés: JPEG, PNG, WebP',
    }),
});

// Validation des types de fichiers vidéos
export const videoFileSchema = fileUploadSchema.extend({
  file: z.instanceof(File)
    .refine((file) => file.size <= 50 * 1024 * 1024, {
      message: 'La vidéo ne doit pas dépasser 50MB',
    })
    .refine((file) => {
      const allowedTypes = ['video/mp4', 'video/webm', 'video/avi'];
      return allowedTypes.includes(file.type);
    }, {
      message: 'Type de vidéo non supporté. Formats acceptés: MP4, WebM, AVI',
    }),
});

// Schéma pour les coordonnées géographiques
export const coordinatesSchema = z.object({
  latitude: z.coerce.number()
    .min(-90, 'La latitude doit être entre -90 et 90')
    .max(90, 'La latitude doit être entre -90 et 90'),
  longitude: z.coerce.number()
    .min(-180, 'La longitude doit être entre -180 et 180')
    .max(180, 'La longitude doit être entre -180 et 180'),
});

// Schéma pour les URLs
export const urlSchema = z.string()
  .url('URL invalide')
  .refine((url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }, 'URL invalide');

// Schéma pour les emails
export const emailSchema = z.string()
  .min(1, 'L\'email est requis')
  .email('Format d\'email invalide')
  .transform((val) => val.toLowerCase().trim());

// Schéma pour les numéros de téléphone camerounais
export const phoneSchema = z.string()
  .optional()
  .transform((val) => val?.replace(/\s/g, ''))
  .refine((val) => {
    if (!val) return true;
    return /^(\+237)?[26]\d{8}$/.test(val);
  }, 'Format de téléphone camerounais invalide (ex: +237612345678 ou 612345678)');

// Schéma pour les montants monétaires
export const moneySchema = z.coerce.number()
  .int('Le montant doit être un nombre entier')
  .min(0, 'Le montant ne peut pas être négatif')
  .max(999999999999, 'Le montant est trop élevé');

// Types TypeScript dérivés des schémas
export type IdInput = z.infer<typeof idSchema>;
export type UuidInput = z.infer<typeof uuidSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
export type PropertyFiltersInput = z.infer<typeof propertyFiltersSchema>;
export type DateFiltersInput = z.infer<typeof dateFiltersSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;
export type ImageFileInput = z.infer<typeof imageFileSchema>;
export type VideoFileInput = z.infer<typeof videoFileSchema>;
export type CoordinatesInput = z.infer<typeof coordinatesSchema>;
export type UrlInput = z.infer<typeof urlSchema>;
export type EmailInput = z.infer<typeof emailSchema>;
export type PhoneInput = z.infer<typeof phoneSchema>;
export type MoneyInput = z.infer<typeof moneySchema>;

// Fonctions de validation utilitaires
export const validateId = (id: string): string => {
  return idSchema.parse(id);
};

export const validateUuid = (uuid: string): string => {
  return uuidSchema.parse(uuid);
};

export const validateEmail = (email: string): string => {
  return emailSchema.parse(email);
};

export const validatePhone = (phone?: string): string | undefined => {
  if (!phone) return undefined;
  return phoneSchema.parse(phone);
};

export const validateMoney = (amount: number): number => {
  return moneySchema.parse(amount);
};

// Fonction pour valider et parser les paramètres de recherche
export const parseSearchParams = (searchParams: URLSearchParams) => {
  const params: Record<string, any> = {};
  
  searchParams.forEach((value, key) => {
    // Conversion automatique pour certains types
    if (['page', 'limit', 'minPrice', 'maxPrice', 'minSurface', 'maxSurface'].includes(key)) {
      const num = parseInt(value);
      if (!isNaN(num)) {
        params[key] = num;
      }
    } else if (['isActive', 'isFeatured'].includes(key)) {
      params[key] = value.toLowerCase() === 'true';
    } else {
      params[key] = value;
    }
  });
  
  return params;
};