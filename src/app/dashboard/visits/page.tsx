// Page des demandes de visite de l'utilisateur
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MessageSquare, ArrowLeft, Filter, Calendar, User, Phone, Mail, MapPin, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Interface pour les demandes de visite
interface VisitRequest {
  id: string;
  propertyTitle: string;
  status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'REJECTED';
  requestedAt: string;
  scheduledAt?: string;
}

// Configuration des statuts avec couleurs et icônes
const statusConfig = {
  PENDING: {
    label: 'En attente',
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: Clock,
    description: 'Demande en cours de traitement'
  },
  ACCEPTED: {
    label: 'Accepté',
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    description: 'Visite acceptée par l\'agent'
  },
  COMPLETED: {
    label: 'Terminé',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: CheckCircle,
    description: 'Visite réalisée'
  },
  REJECTED: {
    label: 'Refusé',
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: XCircle,
    description: 'Demande refusée'
  }
};

export default function VisitsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [visits, setVisits] = useState<VisitRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('TOUS');

  // Rediriger si non connecté
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/login?callbackUrl=/dashboard/visits');
      return;
    }
  }, [session, status, router]);

  // Charger les demandes de visite
  useEffect(() => {
    const fetchVisits = async () => {
      if (!session) return;
      
      try {
        const response = await fetch('/api/dashboard/acheteur-stats');
        if (response.ok) {
          const data = await response.json();
          setVisits(data.visitHistory || []);
        } else {
          console.error('Erreur lors du chargement des demandes de visite');
        }
      } catch (error) {
        console.error('Erreur API:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVisits();
  }, [session]);

  // Filtrer les demandes de visite
  const filteredVisits = visits.filter(visit => {
    return filterStatus === 'TOUS' || visit.status === filterStatus;
  });

  // Grouper par statut pour les statistiques
  const visitStats = {
    total: visits.length,
    pending: visits.filter(v => v.status === 'PENDING').length,
    accepted: visits.filter(v => v.status === 'ACCEPTED').length,
    completed: visits.filter(v => v.status === 'COMPLETED').length,
    rejected: visits.filter(v => v.status === 'REJECTED').length,
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-8 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>

        {/* List skeleton */}
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="h-6 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Redirection en cours
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour au dashboard
              </Link>
            </Button>
          </div>
          
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Mes demandes de visite</h1>
          </div>
          <p className="text-gray-600">
            Gérez vos demandes de visite et suivez leur progression
          </p>
        </div>

        {visits.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Aucune demande de visite
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Vous n'avez pas encore fait de demande de visite. 
              Parcourez nos propriétés et planifiez vos visites.
            </p>
            <Button size="lg" asChild>
              <Link href="/properties">
                <Calendar className="w-5 h-5 mr-2" />
                Demander une visite
              </Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Statistiques */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <MessageSquare className="w-8 h-8 text-blue-600" />
                  <div className="ml-3">
                    <p className="text-2xl font-bold text-gray-900">{visitStats.total}</p>
                    <p className="text-gray-600 text-sm">Total</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <Clock className="w-8 h-8 text-orange-500" />
                  <div className="ml-3">
                    <p className="text-2xl font-bold text-gray-900">{visitStats.pending}</p>
                    <p className="text-gray-600 text-sm">En attente</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                  <div className="ml-3">
                    <p className="text-2xl font-bold text-gray-900">{visitStats.accepted}</p>
                    <p className="text-gray-600 text-sm">Acceptées</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <CheckCircle className="w-8 h-8 text-blue-500" />
                  <div className="ml-3">
                    <p className="text-2xl font-bold text-gray-900">{visitStats.completed}</p>
                    <p className="text-gray-600 text-sm">Terminées</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filtres */}
            <div className="mb-6 bg-white rounded-lg shadow p-4">
              <div className="flex items-center gap-4">
                <Filter className="w-5 h-5 text-gray-600" />
                <div className="min-w-[200px]">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TOUS">Tous les statuts</SelectItem>
                      <SelectItem value="PENDING">En attente</SelectItem>
                      <SelectItem value="ACCEPTED">Accepté</SelectItem>
                      <SelectItem value="COMPLETED">Terminé</SelectItem>
                      <SelectItem value="REJECTED">Refusé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-gray-600">
                  {filteredVisits.length} résultat{filteredVisits.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Liste des demandes */}
            <div className="space-y-4">
              {filteredVisits.map((visit) => {
                const config = statusConfig[visit.status];
                const StatusIcon = config.icon;
                
                return (
                  <div key={visit.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {visit.propertyTitle}
                            </h3>
                            
                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2" />
                                <span>Demandé le {formatShortDate(visit.requestedAt)}</span>
                              </div>
                              
                              {visit.scheduledAt && (
                                <div className="flex items-center">
                                  <Clock className="w-4 h-4 mr-2" />
                                  <span>Programmé le {formatDate(visit.scheduledAt)}</span>
                                </div>
                              )}
                              
                              <p className="text-xs text-gray-500 mt-2">
                                {config.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-3 py-1 rounded-full border ${config.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          Voir la propriété
                        </Button>
                        
                        {visit.status === 'ACCEPTED' && (
                          <Button variant="outline" size="sm">
                            <Phone className="w-4 h-4 mr-1" />
                            Contacter l'agent
                          </Button>
                        )}
                      </div>

                      {visit.status === 'PENDING' && (
                        <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                          <XCircle className="w-4 h-4 mr-1" />
                          Annuler
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredVisits.length === 0 && filterStatus !== 'TOUS' && (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Aucune demande avec ce statut
                </h3>
                <p className="text-gray-600 mb-4">
                  Aucune demande de visite ne correspond à ce filtre.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => setFilterStatus('TOUS')}
                >
                  Voir toutes les demandes
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}