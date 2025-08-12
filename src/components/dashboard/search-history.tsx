// Composant pour afficher et gérer l'historique des recherches
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Clock, 
  Trash2,
  ExternalLink,
  Edit2,
  MapPin,
  Home,
  Tag,
  DollarSign,
  ArrowLeftRight,
  Filter
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Types pour les recherches sauvegardées
interface SavedSearch {
  id: string;
  searchQuery?: string;
  filters: {
    ville?: string;
    type?: string;
    priceRange?: string;
    troc?: boolean;
    payerApres?: boolean;
  };
  resultCount: number;
  name?: string;
  createdAt: string;
  lastUsed: string;
}

interface SearchHistoryProps {
  userId: string;
}

// Composant pour un item de recherche
function SearchItem({ 
  search, 
  onDelete, 
  onRename, 
  onUse 
}: { 
  search: SavedSearch; 
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  onUse: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(search.name || '');
  const [isDeleting, setIsDeleting] = useState(false);

  // Fonction pour formater la date
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  // Fonction pour construire l'URL de recherche
  const buildSearchUrl = () => {
    const params = new URLSearchParams();
    
    if (search.searchQuery) {
      // Cette fonctionnalité nécessiterait une modification de la page properties
      // pour accepter les paramètres de recherche depuis l'URL
    }
    
    if (search.filters.ville) params.append('ville', search.filters.ville);
    if (search.filters.type) params.append('type', search.filters.type);
    if (search.filters.priceRange) params.append('prix', search.filters.priceRange);
    if (search.filters.troc) params.append('troc', 'true');
    if (search.filters.payerApres) params.append('payer_apres', 'true');

    return `/properties?${params.toString()}`;
  };

  // Fonction pour sauvegarder le nouveau nom
  const handleSaveName = async () => {
    if (editName.trim() && editName !== search.name) {
      await onRename(search.id, editName.trim());
    }
    setIsEditing(false);
  };

  // Fonction pour supprimer
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(search.id);
    } catch (error) {
      setIsDeleting(false);
    }
  };

  // Fonction pour marquer comme utilisée et rediriger
  const handleUse = () => {
    onUse(search.id);
    window.location.href = buildSearchUrl();
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* Titre de la recherche */}
            <div className="flex items-center gap-2 mb-3">
              <Search className="w-4 h-4 text-blue-600" />
              {isEditing ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-8 text-sm"
                    placeholder="Nom de la recherche"
                    onKeyPress={(e) => e.key === 'Enter' && handleSaveName()}
                  />
                  <Button size="sm" onClick={handleSaveName}>
                    ✓
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => setIsEditing(false)}
                  >
                    ✕
                  </Button>
                </div>
              ) : (
                <>
                  <h3 className="font-semibold text-gray-900">
                    {search.name || 'Recherche sans nom'}
                  </h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(true)}
                    className="p-1 h-6 w-6"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                </>
              )}
            </div>

            {/* Critères de recherche */}
            <div className="space-y-2 mb-4">
              {search.searchQuery && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Tag className="w-3 h-3" />
                  <span>Recherche: "{search.searchQuery}"</span>
                </div>
              )}
              
              <div className="flex flex-wrap gap-2">
                {search.filters.ville && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {search.filters.ville}
                  </Badge>
                )}
                
                {search.filters.type && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Home className="w-3 h-3" />
                    {search.filters.type}
                  </Badge>
                )}
                
                {search.filters.priceRange && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    {search.filters.priceRange.replace('-', ' - ')} FCFA
                  </Badge>
                )}
                
                {search.filters.troc && (
                  <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700">
                    <ArrowLeftRight className="w-3 h-3" />
                    Troc accepté
                  </Badge>
                )}
                
                {search.filters.payerApres && (
                  <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700">
                    <Clock className="w-3 h-3" />
                    Paiement différé
                  </Badge>
                )}
              </div>
            </div>

            {/* Statistiques */}
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <span>{search.resultCount} résultat(s)</span>
              <span>•</span>
              <span>Créée le {formatDate(search.createdAt)}</span>
              <span>•</span>
              <span>Utilisée le {formatDate(search.lastUsed)}</span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleUse}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-3 h-3" />
                Relancer cette recherche
              </Button>
              
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2"
              >
                {isDeleting ? (
                  <div className="w-3 h-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Trash2 className="w-3 h-3" />
                )}
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Composant principal de l'historique des recherches
export function SearchHistory({ userId }: SearchHistoryProps) {
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fonction pour récupérer les recherches
  const fetchSearches = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/searches?limit=50');
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des recherches');
      }
      
      const data = await response.json();
      setSearches(data.searches || []);
    } catch (err: any) {
      console.error('Erreur API recherches:', err);
      setError(err.message || 'Erreur lors du chargement des recherches');
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les recherches au montage
  useEffect(() => {
    fetchSearches();
  }, [fetchSearches]);

  // Fonction pour supprimer une recherche
  const handleDelete = async (searchId: string) => {
    try {
      const response = await fetch(`/api/searches/${searchId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      // Retirer de la liste locale
      setSearches(prev => prev.filter(search => search.id !== searchId));
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    }
  };

  // Fonction pour renommer une recherche
  const handleRename = async (searchId: string, newName: string) => {
    try {
      const response = await fetch(`/api/searches/${searchId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la modification');
      }

      const data = await response.json();
      
      // Mettre à jour la liste locale
      setSearches(prev => 
        prev.map(search => 
          search.id === searchId 
            ? { ...search, name: data.search.name }
            : search
        )
      );
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
    }
  };

  // Fonction pour marquer une recherche comme utilisée
  const handleUse = async (searchId: string) => {
    try {
      await fetch(`/api/searches/${searchId}/use`, {
        method: 'POST',
      });

      // Mettre à jour la date de dernière utilisation localement
      setSearches(prev => 
        prev.map(search => 
          search.id === searchId 
            ? { ...search, lastUsed: new Date().toISOString() }
            : search
        )
      );
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" text="Chargement de vos recherches..." />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-red-400 mb-4">
            <Search className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Erreur de chargement
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchSearches} variant="outline">
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (searches.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Aucune recherche sauvegardée
          </h3>
          <p className="text-gray-600 mb-6">
            Effectuez des recherches sur la page des propriétés pour les voir apparaître ici.
          </p>
          <Link href="/properties">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Filter className="w-4 h-4 mr-2" />
              Rechercher des propriétés
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            Mes recherches ({searches.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{searches.length}</div>
              <div className="text-sm text-gray-600">Recherches sauvegardées</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {searches.reduce((sum, search) => sum + search.resultCount, 0)}
              </div>
              <div className="text-sm text-gray-600">Résultats au total</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {searches.filter(s => s.name).length}
              </div>
              <div className="text-sm text-gray-600">Recherches nommées</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des recherches */}
      <div className="space-y-4">
        {searches.map(search => (
          <SearchItem
            key={search.id}
            search={search}
            onDelete={handleDelete}
            onRename={handleRename}
            onUse={handleUse}
          />
        ))}
      </div>
    </div>
  );
}