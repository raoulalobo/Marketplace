// Tableau des signalements pour l'admin
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { 
  Eye, 
  Check, 
  X,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Flag,
  User,
  Home
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ReportStatus } from '@prisma/client';

// Interface pour un signalement avec ses détails
interface ReportWithDetails {
  id: string;
  motif: string;
  description: string | null;
  status: ReportStatus;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    email: string;
    nom: string;
    prenom: string;
  };
  property: {
    id: string;
    titre: string;
    prix: number;
    adresse: string;
    isActive: boolean;
    agent: {
      id: string;
      nom: string;
      prenom: string;
      email: string;
    };
  };
}

interface ReportsTableProps {
  reports: ReportWithDetails[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  onPageChange: (page: number) => void;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onStatusUpdate: (reportId: string, status: ReportStatus) => void;
  currentSort: {
    sortBy: string;
    sortOrder: string;
  };
  loading: boolean;
}

export function ReportsTable({ 
  reports, 
  pagination, 
  onPageChange, 
  onSortChange,
  onStatusUpdate,
  currentSort,
  loading 
}: ReportsTableProps) {
  const [updatingReports, setUpdatingReports] = useState<Set<string>>(new Set());

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return `${(price / 1000000).toFixed(1)}M FCFA`;
  };

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case ReportStatus.PENDING:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <AlertTriangle className="w-3 h-3 mr-1" />
            En attente
          </span>
        );
      case ReportStatus.RESOLVED:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <Check className="w-3 h-3 mr-1" />
            Résolu
          </span>
        );
      case ReportStatus.REJECTED:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <X className="w-3 h-3 mr-1" />
            Rejeté
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const getSortIcon = (column: string) => {
    if (currentSort.sortBy !== column) return null;
    return currentSort.sortOrder === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  const handleSort = (column: string) => {
    const newOrder = currentSort.sortBy === column && currentSort.sortOrder === 'asc' ? 'desc' : 'asc';
    onSortChange(column, newOrder);
  };

  const handleStatusChange = async (reportId: string, status: ReportStatus) => {
    setUpdatingReports(prev => new Set(prev).add(reportId));
    try {
      await onStatusUpdate(reportId, status);
    } finally {
      setUpdatingReports(prev => {
        const newSet = new Set(prev);
        newSet.delete(reportId);
        return newSet;
      });
    }
  };

  if (reports.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Flag className="w-16 h-16 mx-auto" />
          </div>
          <p className="text-gray-500">Aucun signalement trouvé avec ces filtres</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tableau */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left p-4">
                    <button
                      onClick={() => handleSort('motif')}
                      className="flex items-center space-x-1 font-medium text-gray-900 hover:text-blue-600"
                    >
                      <span>Signalement</span>
                      {getSortIcon('motif')}
                    </button>
                  </th>
                  <th className="text-left p-4">
                    <span className="font-medium text-gray-900">Propriété</span>
                  </th>
                  <th className="text-left p-4">
                    <span className="font-medium text-gray-900">Rapporteur</span>
                  </th>
                  <th className="text-center p-4">
                    <button
                      onClick={() => handleSort('status')}
                      className="flex items-center space-x-1 font-medium text-gray-900 hover:text-blue-600"
                    >
                      <span>Statut</span>
                      {getSortIcon('status')}
                    </button>
                  </th>
                  <th className="text-left p-4">
                    <button
                      onClick={() => handleSort('createdAt')}
                      className="flex items-center space-x-1 font-medium text-gray-900 hover:text-blue-600"
                    >
                      <span>Date</span>
                      {getSortIcon('createdAt')}
                    </button>
                  </th>
                  <th className="text-center p-4">
                    <span className="font-medium text-gray-900">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-b border-gray-100 hover:bg-gray-50">
                    {/* Signalement */}
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-gray-900 flex items-center space-x-2">
                          <Flag className="w-4 h-4 text-red-500" />
                          <span>{report.motif}</span>
                        </div>
                        {report.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {report.description}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Propriété */}
                    <td className="p-4">
                      <div>
                        <Link
                          href={`/properties/${report.property.id}`}
                          className="font-medium text-blue-600 hover:text-blue-500 flex items-center space-x-1"
                        >
                          <Home className="w-4 h-4" />
                          <span>{report.property.titre}</span>
                        </Link>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatPrice(report.property.prix)}
                        </p>
                        <p className="text-xs text-gray-500">
                          Agent: {report.property.agent.prenom} {report.property.agent.nom}
                        </p>
                        <div className="flex items-center mt-1">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                            report.property.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {report.property.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Rapporteur */}
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {report.user.prenom} {report.user.nom}
                          </p>
                          <p className="text-sm text-gray-500">{report.user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Statut */}
                    <td className="p-4 text-center">
                      {getStatusBadge(report.status)}
                    </td>

                    {/* Date */}
                    <td className="p-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {formatDate(report.createdAt)}
                        </div>
                        {report.updatedAt !== report.createdAt && (
                          <div className="text-xs text-gray-500">
                            Modifié: {formatDate(report.updatedAt)}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <Link
                          href={`/admin/reports/${report.id}`}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                          title="Voir les détails"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        
                        {report.status === ReportStatus.PENDING && (
                          <>
                            <button
                              onClick={() => handleStatusChange(report.id, ReportStatus.RESOLVED)}
                              disabled={updatingReports.has(report.id)}
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                              title="Marquer comme résolu"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleStatusChange(report.id, ReportStatus.REJECTED)}
                              disabled={updatingReports.has(report.id)}
                              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                              title="Rejeter le signalement"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {pagination.page} sur {pagination.totalPages} 
                ({pagination.totalCount} signalements au total)
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage || loading}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>
                
                {/* Pages */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const page = Math.max(1, pagination.page - 2) + i;
                    if (page > pagination.totalPages) return null;
                    
                    return (
                      <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        className={`px-3 py-1 text-sm rounded ${
                          page === pagination.page
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                        }`}
                        disabled={loading}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={!pagination.hasNextPage || loading}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}