# 📊 Architecture Complète du Système de Tracking du Temps

## Vue d'ensemble

Le système de tracking du temps permet de mesurer précisément le temps que les utilisateurs (connectés ou anonymes) passent à consulter chaque propriété. Cette fonctionnalité avancée fournit aux agents immobiliers des insights métier précieux pour optimiser leurs annonces et améliorer leurs taux de conversion.

---

## 🏗️ Architecture Technique

### 1. Modèle de Données

#### **PropertyTimeSession** (Table principale)
```typescript
model PropertyTimeSession {
  // Identifiants
  id           String    @id @default(cuid())
  sessionId    String    @unique // ID unique généré côté client
  
  // Identification utilisateur
  viewerIp     String    // Adresse IP (déduplication)
  userAgent    String?   // User agent pour identification
  userId       String?   // Si utilisateur connecté (optionnel)
  
  // Timestamps de session
  enteredAt    DateTime  @default(now()) // Entrée sur la page
  lastActiveAt DateTime  @default(now()) // Dernière activité (heartbeat)
  leftAt       DateTime? // Sortie de la page (nullable)
  
  // Métriques temporelles
  timeSpent    Int?      // Temps total en secondes
  activeTime   Int?      // Temps avec onglet actif uniquement
  
  // Métriques d'engagement
  events       Json?     // Événements utilisateur (scroll, clics, etc.)
  scrollDepth  Float?    // Profondeur de scroll maximale (0-100%)
  
  // Relations
  propertyId   String
  property     Property  @relation(fields: [propertyId], references: [id])
  user         User?     @relation(fields: [userId], references: [id])
  
  // Index d'optimisation
  @@index([propertyId, enteredAt])
  @@index([sessionId])
  @@index([enteredAt])
}
```

#### **Relations étendues**
- **User** → `propertyTimeSessions: PropertyTimeSession[]`
- **Property** → `timeSessions: PropertyTimeSession[]`

---

## 🔌 API RESTful

### Endpoint: `/api/properties/[id]/track-time`

#### **POST - Démarrer une session**
```typescript
// Request Body
{
  sessionId: string;    // ID unique généré côté client
  userAgent?: string;   // User agent du navigateur
}

// Response
{
  success: true,
  sessionId: string,
  started: true
}
```

#### **PUT - Heartbeat / Mise à jour**
```typescript
// Request Body
{
  sessionId: string;
  activeTime?: number;     // Temps actif cumulé (secondes)
  scrollDepth?: number;    // Profondeur de scroll (0-100%)
  events?: Array<{         // Événements depuis le dernier heartbeat
    type: string;
    timestamp: number;
    data?: any;
  }>;
}

// Response
{
  success: true,
  sessionId: string,
  updated: true
}
```

#### **DELETE - Terminer la session**
```typescript
// Query Parameters
?sessionId=xxx&timeSpent=120&activeTime=95&scrollDepth=75.5

// Response
{
  success: true,
  sessionId: string,
  ended: true,
  totalTime: number
}
```

---

## ⚛️ Hook React `useTimeTracking`

### Interface d'utilisation
```typescript
const timeTracking = useTimeTracking({
  propertyId: string;           // ID de la propriété à tracker
  enabled?: boolean;            // Activer/désactiver (défaut: true)
  heartbeatInterval?: number;   // Intervalle heartbeat en secondes (défaut: 15)
  onError?: (error: Error) => void; // Callback erreur
});

// État retourné
{
  isTracking: boolean;      // Session active
  timeSpent: number;        // Temps total (secondes)
  activeTime: number;       // Temps actif (secondes)
  scrollDepth: number;      // Profondeur scroll (0-100%)
  sessionId: string | null; // ID de session
  trackEvent: (type: string, data?: any) => void; // Tracker événement custom
}
```

### Fonctionnalités avancées

#### **1. Page Visibility API**
- **Détection onglet actif/inactif** : Pause le compteur quand l'utilisateur change d'onglet
- **Calcul précis du temps actif** : Seul le temps avec onglet visible est comptabilisé

#### **2. Heartbeat intelligent**
- **Intervalle configurable** : Par défaut 15 secondes
- **Données envoyées** : Temps actif, profondeur de scroll, événements récents
- **Gestion des erreurs** : Retry automatique, logging des erreurs

#### **3. Détection de fermeture**
- **beforeunload Event** : Capture la fermeture de page/onglet
- **sendBeacon API** : Envoi fiable même lors de la fermeture brutale
- **Calcul final automatique** : Temps total et métriques finales

#### **4. Tracking d'événements**
- **Événements automatiques** : scroll, page_visible, page_hidden, session_start/end
- **Événements personnalisés** : Via `trackEvent(type, data)`
- **Buffer d'événements** : Stockage local et envoi par batch

---

## 📈 Analytics Avancées

### API: `/api/dashboard/agent-time-analytics`

#### **Métriques globales**
```typescript
overview: {
  totalSessions: number;        // Nombre total de sessions
  averageTimeSpent: number;     // Temps moyen (secondes)
  averageActiveTime: number;    // Temps actif moyen
  averageScrollDepth: number;   // Profondeur scroll moyenne (%)
  bounceRate: number;           // Taux de rebond (< 30s) (%)
  engagementRate: number;       // Taux d'engagement (> 2min) (%)
}
```

#### **Performance par propriété**
```typescript
propertiesPerformance: Array<{
  propertyId: string;
  propertyTitle: string;
  totalSessions: number;
  averageTimeSpent: number;     // Temps moyen sur cette propriété
  averageActiveTime: number;    // Temps actif moyen
  averageScrollDepth: number;   // Scroll moyen (%)
  bounceRate: number;           // Taux de rebond spécifique (%)
  conversionRate: number;       // Demandes de visite / sessions (%)
}>
```

#### **Distribution temporelle**
```typescript
timeDistribution: Array<{
  timeRange: string;    // "0-30s", "30s-2min", "2-5min", "5-10min", "10min+"
  count: number;        // Nombre de sessions dans cette tranche
  percentage: number;   // Pourcentage du total
}>
```

#### **Événements d'engagement**
```typescript
engagementEvents: Array<{
  eventType: string;    // Type d'événement (click, scroll, etc.)
  count: number;        // Nombre total d'occurrences
  properties: Array<{   // Répartition par propriété
    propertyId: string;
    propertyTitle: string;
    count: number;
  }>;
}>
```

#### **Tendances temporelles**
```typescript
trends: {
  dailyAverages: Array<{
    date: string;             // YYYY-MM-DD
    averageTimeSpent: number; // Temps moyen ce jour
    sessionsCount: number;    // Nombre de sessions
  }>;
}
```

---

## ⚡ Intégration Frontend

### Page Propriété (`/properties/[id]/page.tsx`)

#### **Initialisation du tracking**
```typescript
// Hook de tracking automatique
const timeTracking = useTimeTracking({
  propertyId: params.id as string,
  enabled: true,
  heartbeatInterval: 15,
  onError: (error) => console.error('Time tracking error:', error)
});
```

#### **Événements trackés automatiquement**
- **Actions utilisateur** :
  - `visit_request_clicked` / `visit_request_success`
  - `favorite_clicked` (avec état ajout/suppression)
  - `share_clicked` / `report_clicked`
  - `image_changed` (navigation galerie photos)

- **Événements système** :
  - `session_start` / `session_end`
  - `page_visible` / `page_hidden`
  - `scroll` (avec profondeur)

#### **Tracking des conversions**
```typescript
const handleVisitSuccess = (visitRequest: any) => {
  // Tracker la conversion réussie
  timeTracking.trackEvent('visit_request_success', { 
    visitRequestId: visitRequest.id 
  });
  // ... rest of success handling
};
```

---

## 🔒 Sécurité et Performance

### **1. Protection des données**
- **Anonymisation** : IP hashées pour la conformité RGPD
- **Sessions temporaires** : Pas de stockage côté client sensible
- **Validation stricte** : Schémas Zod pour toutes les entrées API

### **2. Optimisations performance**
- **Heartbeat asynchrone** : N'impacte pas l'expérience utilisateur
- **Batch d'événements** : Envoi groupé pour réduire les requêtes
- **Index de base de données** : Requêtes optimisées sur sessionId, propertyId, dates

### **3. Gestion des erreurs**
- **Fallback gracieux** : Le tracking ne bloque jamais l'interface
- **Retry automatique** : Nouvelle tentative en cas d'échec réseau
- **Logging détaillé** : Traçabilité pour debug et monitoring

---

## 🎯 Métriques Collectées

### **Temps et Engagement**
| Métrique | Description | Utilité |
|----------|-------------|---------|
| **Temps total** | Durée complète sur la page | Intérêt global pour la propriété |
| **Temps actif** | Temps avec onglet visible | Engagement réel (pas en arrière-plan) |
| **Profondeur de scroll** | % de la page consultée | Qualité de la consultation |
| **Taux de rebond** | Sessions < 30 secondes | Détection de problèmes (prix, photos) |
| **Taux d'engagement** | Sessions > 2 minutes | Propriétés vraiment intéressantes |

### **Interactions Utilisateur**
| Événement | Données | Insight Métier |
|-----------|---------|----------------|
| `visit_request_clicked` | - | Intention forte d'achat/location |
| `visit_request_success` | `visitRequestId` | Conversion réussie |
| `favorite_clicked` | `add/remove state` | Intérêt marqué |
| `image_changed` | `fromIndex, toIndex` | Engagement avec les visuels |
| `scroll` | `depth percentage` | Consultation approfondie |

---

## 🚀 Cas d'Usage Métier

### **Pour les Agents Immobiliers**

#### **1. Optimisation des annonces**
- **Photos** : Identifier les images qui retiennent l'attention
- **Prix** : Corréler prix vs temps passé vs conversions
- **Description** : Mesurer l'engagement avec le contenu textuel

#### **2. Détection de problèmes**
- **Taux de rebond élevé** : Prix trop élevé ou photos peu attrayantes
- **Faible scroll** : Description trop longue ou peu engageante
- **Peu de conversions** : Informations manquantes ou agent difficile à contacter

#### **3. Insights compétitifs**
- **Benchmarking** : Comparer ses performances aux moyennes du marché
- **Tendances temporelles** : Identifier les meilleurs moments pour publier
- **Types de biens** : Découvrir quels types engagent le plus

### **Pour la Plateforme**

#### **1. Amélioration UX**
- **Parcours utilisateur** : Identifier les frictions dans l'interface
- **Performance mobile vs desktop** : Adapter l'expérience par device
- **A/B Testing** : Mesurer l'impact des changements d'interface

#### **2. Recommandations intelligentes**
- **Machine Learning** : Utiliser le temps passé pour améliorer l'algorithme
- **Profils utilisateur** : Comprendre les préférences par comportement
- **Similarité de propriétés** : Grouper par patterns d'engagement

---

## 🔮 Évolutions Futures

### **Phase 2 - Analytics Avancées**
- **Heatmap de scroll** : Visualisation des zones les plus consultées
- **Parcours utilisateur** : Séquences d'actions typiques
- **Segmentation** : Analyse par type d'utilisateur (acheteur/investisseur)

### **Phase 3 - Intelligence Artificielle**
- **Prédiction de conversion** : Probabilité de demande de visite
- **Recommandations automatiques** : Suggestions d'amélioration d'annonces  
- **Alertes proactives** : Notification de baisse d'engagement

### **Phase 4 - Intégrations**
- **CRM agents** : Export des données vers outils externes
- **Email marketing** : Ciblage basé sur l'engagement
- **Publicité programmatique** : Retargeting des utilisateurs engagés

---

## 📋 Checklist d'Implémentation

### ✅ **Complété**
- [x] Modèle de données PropertyTimeSession
- [x] API RESTful complète (/track-time)
- [x] Hook React useTimeTracking
- [x] Intégration page propriété
- [x] API analytics agent (/agent-time-analytics)

### 🔲 **À implémenter (optionnel)**
- [ ] Interface dashboard pour visualiser les analytics
- [ ] Alertes automatiques pour les agents
- [ ] Export des données (CSV, Excel)
- [ ] Rapports périodiques automatisés
- [ ] Intégration avec Google Analytics/Mixpanel

---

## 🏆 Avantages Concurrentiels

### **vs WhatsApp/Facebook Marketplace**
1. **Analytics professionnelles** : Métriques détaillées vs statistiques basiques
2. **Optimisation data-driven** : Insights actionnables pour améliorer les ventes
3. **Tracking multi-device** : Vision complète du parcours utilisateur
4. **Corrélations avancées** : Temps passé vs conversions vs caractéristiques du bien

### **vs Plateformes Immobilières Classiques**
1. **Granularité des données** : Tracking seconde par seconde vs vues journalières
2. **Événements personnalisés** : Tracking des interactions spécifiques
3. **Temps réel** : Analytics en direct vs rapports hebdomadaires
4. **RGPD Compliant** : Respect de la vie privée avec données anonymisées

---

*Cette architecture constitue un avantage technologique majeur pour la plateforme, permettant aux agents immobiliers d'optimiser leurs performances et d'augmenter significativement leurs taux de conversion.*