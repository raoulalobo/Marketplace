// API route pour l'inscription des utilisateurs
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/lib/validations/auth';
import { UserRole } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validation des données avec Zod
    const validatedData = registerSchema.parse(body);
    
    // Vérifier si l'utilisateur existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Un utilisateur avec cet email existe déjà' },
        { status: 400 }
      );
    }
    
    // Hasher le mot de passe
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(validatedData.password, saltRounds);
    
    // Formatter le numéro de téléphone s'il est fourni
    let formattedPhone = validatedData.telephone;
    if (formattedPhone) {
      // Supprimer les espaces et ajouter +237 si nécessaire
      formattedPhone = formattedPhone.replace(/\s/g, '');
      if (!formattedPhone.startsWith('+237')) {
        formattedPhone = '+237' + formattedPhone;
      }
    }
    
    // Créer l'utilisateur dans la base de données
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        nom: validatedData.nom,
        prenom: validatedData.prenom,
        telephone: formattedPhone,
        role: validatedData.role,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        createdAt: true,
      }
    });
    
    return NextResponse.json(
      { 
        message: 'Inscription réussie', 
        user: {
          id: user.id,
          email: user.email,
          name: `${user.prenom} ${user.nom}`,
          role: user.role,
        }
      },
      { status: 201 }
    );
    
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    
    // Gestion des erreurs de validation Zod
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json(
        { 
          error: 'Données invalides',
          details: (error as any).issues.map((issue: any) => ({
            field: issue.path.join('.'),
            message: issue.message
          }))
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}