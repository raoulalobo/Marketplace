// Schémas de validation pour l'authentification
import { z } from 'zod';
import { UserRole } from '@prisma/client';

// Schéma pour l'inscription
export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide'),
  password: z
    .string()
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères')
    .max(100, 'Le mot de passe ne peut pas dépasser 100 caractères'),
  confirmPassword: z
    .string()
    .min(1, 'La confirmation du mot de passe est requise'),
  nom: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s-']+$/, 'Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes'),
  prenom: z
    .string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom ne peut pas dépasser 50 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s-']+$/, 'Le prénom ne peut contenir que des lettres, espaces, tirets et apostrophes'),
  telephone: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true; // Optionnel
      // Format camerounais : +237XXXXXXXX ou 6XXXXXXXX
      return /^(\+237)?[26]\d{8}$/.test(val.replace(/\s/g, ''));
    }, 'Format de téléphone camerounais invalide (ex: +237612345678 ou 612345678)'),
  role: z
    .nativeEnum(UserRole)
    .refine((val) => val !== UserRole.ADMIN, 'Le rôle administrateur n\'est pas autorisé à l\'inscription'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

// Schéma pour la connexion
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide'),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis'),
});

// Schéma pour la mise à jour du profil
export const updateProfileSchema = z.object({
  nom: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Le nom ne peut pas dépasser 50 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s-']+$/, 'Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes'),
  prenom: z
    .string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Le prénom ne peut pas dépasser 50 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s-']+$/, 'Le prénom ne peut contenir que des lettres, espaces, tirets et apostrophes'),
  telephone: z
    .string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      return /^(\+237)?[26]\d{8}$/.test(val.replace(/\s/g, ''));
    }, 'Format de téléphone camerounais invalide'),
});

// Schéma pour changer le mot de passe
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Le mot de passe actuel est requis'),
  newPassword: z
    .string()
    .min(6, 'Le nouveau mot de passe doit contenir au moins 6 caractères')
    .max(100, 'Le mot de passe ne peut pas dépasser 100 caractères'),
  confirmNewPassword: z
    .string()
    .min(1, 'La confirmation du nouveau mot de passe est requise'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmNewPassword'],
});

// Types TypeScript dérivés des schémas
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;