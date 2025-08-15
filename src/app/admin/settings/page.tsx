// Page de paramètres système pour l'admin
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { AdminBreadcrumb } from '@/components/admin/admin-breadcrumb';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  Settings, 
  Database, 
  Shield, 
  Mail, 
  Globe,
  Users,
  Home,
  TrendingUp,
  AlertTriangle,
  Check,
  RefreshCw,
  Download,
  Upload,
  Bell,
  Save
} from 'lucide-react';

// Interface pour les paramètres système
interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    supportEmail: string;
    maintenanceMode: boolean;
    registrationEnabled: boolean;
    defaultPropertyListingDuration: number; // en jours
    maxPhotoUploadsPerProperty: number;
    featuredPropertyCost: number; // en FCFA
  };
  moderation: {
    autoApproveProperties: boolean;
    requireEmailVerification: boolean;
    maxReportsBeforeAutoSuspend: number;
    suspensionDurationDays: number;
    moderationNotificationEmail: string;
  };
  notifications: {
    emailNotificationsEnabled: boolean;
    smsNotificationsEnabled: boolean;
    notifyAdminOnNewProperty: boolean;
    notifyAdminOnNewReport: boolean;
    notifyAgentOnPropertyView: boolean;
    dailyDigestEnabled: boolean;
  };
  backup: {
    autoBackupEnabled: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    maxBackupRetention: number; // en jours
    lastBackupDate: Date | null;
    backupStorageUsed: number; // en MB
  };
  analytics: {
    enableUserTracking: boolean;
    enablePerformanceMonitoring: boolean;
    dataRetentionDays: number;
    allowCookies: boolean;
  };
  security: {
    sessionTimeoutMinutes: number;
    maxLoginAttempts: number;
    lockoutDurationMinutes: number;
    requireStrongPasswords: boolean;
    twoFactorEnabled: boolean;
  };
}

// Interface pour les statistiques système
interface SystemStats {
  database: {
    totalUsers: number;
    totalProperties: number;
    totalReports: number;
    dbSizeGB: number;
    lastOptimized: Date | null;
  };
  performance: {
    avgResponseTime: number;
    uptime: number;
    errorRate: number;
    memoryUsage: number;
  };
  storage: {
    totalStorageGB: number;
    usedStorageGB: number;
    mediaFilesCount: number;
    backupSizeGB: number;
  };
}

export default function AdminSettingsPage() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('general');

  // Charger les paramètres au montage
  useEffect(() => {
    fetchSettings();
    fetchStats();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings');
      if (!response.ok) throw new Error('Erreur lors du chargement des paramètres');
      
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erreur de chargement');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) throw new Error('Erreur lors du chargement des statistiques');
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Erreur stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    
    try {
      setSaving(true);
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (!response.ok) throw new Error('Erreur lors de la sauvegarde');
      
      alert('Paramètres sauvegardés avec succès');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erreur de sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleBackupNow = async () => {
    try {
      const response = await fetch('/api/admin/backup', { method: 'POST' });
      if (!response.ok) throw new Error('Erreur lors de la sauvegarde');
      
      alert('Sauvegarde lancée avec succès');
      fetchStats(); // Rafraîchir les stats
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erreur de sauvegarde');
    }
  };

  const handleOptimizeDb = async () => {
    try {
      const response = await fetch('/api/admin/optimize-db', { method: 'POST' });
      if (!response.ok) throw new Error('Erreur lors de l\'optimisation');
      
      alert('Base de données optimisée avec succès');
      fetchStats();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erreur d\'optimisation');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Chargement des paramètres..." />
      </div>
    );
  }

  if (error || !settings) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-red-800 font-medium">Erreur de chargement</h3>
            <p className="text-red-600 mt-1">{error || 'Impossible de charger les paramètres'}</p>
            <button
              onClick={fetchSettings}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Réessayer
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const tabs = [
    { id: 'general', label: 'Général', icon: Settings },
    { id: 'moderation', label: 'Modération', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'backup', label: 'Sauvegarde', icon: Database },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'security', label: 'Sécurité', icon: Shield },
    { id: 'stats', label: 'Statistiques', icon: TrendingUp }
  ];

  return (
    <div className="space-y-6">
      {/* Fil d'ariane */}
      <AdminBreadcrumb 
        items={[
          { label: 'Paramètres', icon: <Settings className="w-4 h-4" /> }
        ]} 
      />

      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Paramètres Système</h1>
          <p className="text-gray-600 mt-2">
            Configuration et administration de la marketplace immobilière
          </p>
        </div>
        
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</span>
        </button>
      </div>

      {/* Statistiques système rapides */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.database.totalUsers}</p>
                  <p className="text-sm text-gray-600">Utilisateurs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Home className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.database.totalProperties}</p>
                  <p className="text-sm text-gray-600">Propriétés</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Database className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.database.dbSizeGB.toFixed(1)}GB</p>
                  <p className="text-sm text-gray-600">Base données</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.performance.uptime.toFixed(1)}%</p>
                  <p className="text-sm text-gray-600">Uptime</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Menu de navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                        activeTab === tab.id 
                          ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                          : 'text-gray-700'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Contenu des paramètres */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {(() => {
                  const Icon = tabs.find(t => t.id === activeTab)?.icon || Settings;
                  return <Icon className="w-5 h-5" />;
                })()}
                <span>{tabs.find(t => t.id === activeTab)?.label}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Onglet Général */}
              {activeTab === 'general' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom du site
                      </label>
                      <input
                        type="text"
                        value={settings.general.siteName}
                        onChange={(e) => setSettings({
                          ...settings,
                          general: { ...settings.general, siteName: e.target.value }
                        })}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email de support
                      </label>
                      <input
                        type="email"
                        value={settings.general.supportEmail}
                        onChange={(e) => setSettings({
                          ...settings,
                          general: { ...settings.general, supportEmail: e.target.value }
                        })}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description du site
                    </label>
                    <textarea
                      value={settings.general.siteDescription}
                      onChange={(e) => setSettings({
                        ...settings,
                        general: { ...settings.general, siteDescription: e.target.value }
                      })}
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Durée d'annonce (jours)
                      </label>
                      <input
                        type="number"
                        value={settings.general.defaultPropertyListingDuration}
                        onChange={(e) => setSettings({
                          ...settings,
                          general: { ...settings.general, defaultPropertyListingDuration: parseInt(e.target.value) }
                        })}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Max photos par annonce
                      </label>
                      <input
                        type="number"
                        value={settings.general.maxPhotoUploadsPerProperty}
                        onChange={(e) => setSettings({
                          ...settings,
                          general: { ...settings.general, maxPhotoUploadsPerProperty: parseInt(e.target.value) }
                        })}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Coût mise en avant (FCFA)
                      </label>
                      <input
                        type="number"
                        value={settings.general.featuredPropertyCost}
                        onChange={(e) => setSettings({
                          ...settings,
                          general: { ...settings.general, featuredPropertyCost: parseInt(e.target.value) }
                        })}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="maintenanceMode"
                        checked={settings.general.maintenanceMode}
                        onChange={(e) => setSettings({
                          ...settings,
                          general: { ...settings.general, maintenanceMode: e.target.checked }
                        })}
                        className="rounded"
                      />
                      <label htmlFor="maintenanceMode" className="text-sm font-medium text-gray-700">
                        Mode maintenance activé
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id="registrationEnabled"
                        checked={settings.general.registrationEnabled}
                        onChange={(e) => setSettings({
                          ...settings,
                          general: { ...settings.general, registrationEnabled: e.target.checked }
                        })}
                        className="rounded"
                      />
                      <label htmlFor="registrationEnabled" className="text-sm font-medium text-gray-700">
                        Autoriser les nouvelles inscriptions
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Onglet Statistiques */}
              {activeTab === 'stats' && stats && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Statistiques base de données */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <Database className="w-5 h-5" />
                          <span>Base de données</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Utilisateurs:</span>
                          <span className="font-medium">{stats.database.totalUsers}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Propriétés:</span>
                          <span className="font-medium">{stats.database.totalProperties}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Signalements:</span>
                          <span className="font-medium">{stats.database.totalReports}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Taille DB:</span>
                          <span className="font-medium">{stats.database.dbSizeGB.toFixed(2)} GB</span>
                        </div>
                        <div className="pt-3 border-t">
                          <button
                            onClick={handleOptimizeDb}
                            className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                          >
                            <RefreshCw className="w-4 h-4" />
                            <span>Optimiser la base</span>
                          </button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Statistiques stockage */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <Database className="w-5 h-5" />
                          <span>Stockage</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Espace total:</span>
                          <span className="font-medium">{stats.storage.totalStorageGB.toFixed(2)} GB</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Espace utilisé:</span>
                          <span className="font-medium">{stats.storage.usedStorageGB.toFixed(2)} GB</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Fichiers média:</span>
                          <span className="font-medium">{stats.storage.mediaFilesCount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Sauvegardes:</span>
                          <span className="font-medium">{stats.storage.backupSizeGB.toFixed(2)} GB</span>
                        </div>
                        <div className="pt-3 border-t">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(stats.storage.usedStorageGB / stats.storage.totalStorageGB) * 100}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {((stats.storage.usedStorageGB / stats.storage.totalStorageGB) * 100).toFixed(1)}% utilisé
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Actions système */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Actions système</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                          onClick={handleBackupNow}
                          className="flex items-center justify-center space-x-2 px-4 py-3 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          <span>Sauvegarde manuelle</span>
                        </button>
                        
                        <button
                          onClick={handleOptimizeDb}
                          className="flex items-center justify-center space-x-2 px-4 py-3 border border-green-600 text-green-600 rounded-md hover:bg-green-50 transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>Optimiser DB</span>
                        </button>
                        
                        <button
                          onClick={() => window.location.reload()}
                          className="flex items-center justify-center space-x-2 px-4 py-3 border border-gray-600 text-gray-600 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>Actualiser</span>
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Message pour les autres onglets */}
              {!['general', 'stats'].includes(activeTab) && (
                <div className="text-center py-12">
                  <Settings className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Configuration "{tabs.find(t => t.id === activeTab)?.label}" en cours de développement
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    Ces paramètres seront disponibles dans une prochaine version
                  </p>
                </div>
              )}

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}