// Composant principal d'affichage du profil utilisateur
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Settings, 
  Shield, 
  Edit, 
  Camera 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProfileUser {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  telephone: string | null;
  avatar: string | null;
  createdAt: Date;
  // Statistiques optionnelles selon le rôle
  properties?: { id: string }[];
  favorites?: { id: string }[];
  visitRequests?: { id: string }[];
}

interface ProfileContentProps {
  user: ProfileUser;
}

/**
 * Composant principal d'affichage du profil utilisateur
 * Affiche les informations personnelles et les statistiques
 */
export function ProfileContent({ user }: ProfileContentProps) {
  const [imageError, setImageError] = useState(false);

  // Formatage de la date d'inscription
  const memberSince = new Date(user.createdAt).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Badge du rôle utilisateur
  const getRoleBadge = (role: string) => {
    const roleConfig = {
      ACHETEUR: { label: 'Acheteur', variant: 'default' as const, color: 'bg-blue-100 text-blue-800' },
      AGENT: { label: 'Agent Immobilier', variant: 'secondary' as const, color: 'bg-green-100 text-green-800' },
      ADMIN: { label: 'Administrateur', variant: 'destructive' as const, color: 'bg-red-100 text-red-800' },
    };
    
    return roleConfig[role as keyof typeof roleConfig] || roleConfig.ACHETEUR;
  };

  const roleInfo = getRoleBadge(user.role);

  // Statistiques selon le rôle
  const getStats = () => {
    if (user.role === 'AGENT' && user.properties) {
      return [
        { label: 'Propriétés publiées', value: user.properties.length, icon: '🏠' }
      ];
    } else if (user.role === 'ACHETEUR') {
      return [
        { label: 'Propriétés favorites', value: user.favorites?.length || 0, icon: '❤️' },
        { label: 'Demandes de visite', value: user.visitRequests?.length || 0, icon: '📅' }
      ];
    }
    return [];
  };

  const stats = getStats();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Titre principal */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mon profil</h1>
        <p className="text-gray-600">Gérez vos informations personnelles et vos préférences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Colonne de gauche - Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Carte des informations personnelles */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl">Informations personnelles</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/profile/edit">
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Avatar et nom */}
              <div className="flex items-start space-x-4">
                <div className="relative">
                  {user.avatar && !imageError ? (
                    <img
                      src={user.avatar}
                      alt={`${user.nom} ${user.prenom}`}
                      className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                      {user.nom?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="absolute -bottom-1 -right-1 w-8 h-8 p-0 rounded-full bg-white"
                    asChild
                  >
                    <Link href="/dashboard/profile/edit">
                      <Camera className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {`${user.nom} ${user.prenom}`}
                  </h2>
                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${roleInfo.color}`}>
                    {roleInfo.label}
                  </div>
                </div>
              </div>

              {/* Informations de contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Téléphone</p>
                    <p className="font-medium text-gray-900">
                      {user.telephone || 'Non renseigné'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 md:col-span-2">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Membre depuis</p>
                    <p className="font-medium text-gray-900">{memberSince}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques selon le rôle */}
          {stats.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Statistiques</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stats.map((stat, index) => (
                    <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                      <span className="text-2xl">{stat.icon}</span>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        <p className="text-sm text-gray-600">{stat.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Colonne de droite - Actions et paramètres */}
        <div className="space-y-6">
          {/* Actions rapides */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full" variant="outline">
                <Link href="/dashboard/profile/edit">
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier mon profil
                </Link>
              </Button>
              
              <Button asChild className="w-full" variant="outline">
                <Link href="/dashboard/profile/security">
                  <Shield className="w-4 h-4 mr-2" />
                  Sécurité et mot de passe
                </Link>
              </Button>

              <Button asChild className="w-full" variant="outline">
                <Link href="/dashboard">
                  <Settings className="w-4 h-4 mr-2" />
                  Retour au dashboard
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Informations de compte */}
          <Card>
            <CardHeader>
              <CardTitle>Informations du compte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Type de compte:</span>
                <span className="font-medium">{roleInfo.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Statut:</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Actif
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">ID utilisateur:</span>
                <span className="font-mono text-xs">{user.id.slice(-8)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}