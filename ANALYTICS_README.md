# Système d'Analytics - Amplitude + Fallback Local

## 🎯 Vue d'ensemble

Votre système d'analytics utilise maintenant **Amplitude** comme solution principale avec un **fallback intelligent** sur les données locales de votre base de données PostgreSQL.

## 🚀 Fonctionnalités

### ✅ **Tracking Client (Amplitude)**
- **Page Views** automatiques
- **Property Views** spécialisées
- **Sessions** avec durée et engagement
- **Événements de conversion** (demandes de visite, favoris)
- **Intentions d'achat** (low/medium/high)
- **Scroll milestones** pour l'engagement

### ✅ **Analytics Serveur (API)**
- **Endpoint**: `/api/properties/[id]/amplitude-analytics`
- **Fallback automatique** sur données locales si Amplitude échoue
- **Métriques complètes**: vues, sessions, temps moyen, taux de rebond, conversion
- **Tendances quotidiennes** et analyse par type d'utilisateur

### ✅ **Mode Démo Intégré**
- Si la clé API Amplitude est invalide, le système passe en **mode démo**
- Les événements sont **loggés dans la console** en développement
- **Aucune erreur** dans la console utilisateur
- **Pas de blocage** de l'application

## 🔧 Configuration

### Variables d'environnement
```bash
# .env.local
NEXT_PUBLIC_AMPLITUDE_API_KEY="votre-cle-api-publique"
AMPLITUDE_SECRET_KEY="votre-cle-secrete"
```

### Utilisation dans les composants
```tsx
import { useRealEstateTracking } from '@/providers/amplitude-provider';

function PropertyComponent() {
  const { trackPropertyView, trackPurchaseIntent } = useRealEstateTracking();
  
  const handlePropertyView = (propertyId: string) => {
    trackPropertyView(propertyId, {
      property_type: 'MAISON',
      property_price: 100000
    });
  };
  
  const handleIntentSignal = (propertyId: string) => {
    trackPurchaseIntent(propertyId, 'high');
  };
}
```

## 📊 Endpoints API

### Analytics Amplitude
```bash
GET /api/properties/[id]/amplitude-analytics?days=30
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "totalViews": 150,
    "totalSessions": 89,
    "averageTime": 145,
    "bounceRate": 25,
    "conversionRate": 12,
    "dailyTrends": [...],
    "userTypes": {
      "authenticated": 120,
      "anonymous": 30
    }
  },
  "source": "amplitude"
}
```

## 🛠️ Dépannage

### Problèmes courants
1. **"Invalid API key"** dans la console
   - Le système passe automatiquement en mode démo
   - Vérifiez votre clé API Amplitude
   - Les événements sont toujours loggés localement

2. **Erreurs 401/400 Amplitude**
   - Mode démo activé automatiquement
   - Pas d'impact sur l'expérience utilisateur
   - Les données locales sont toujours disponibles

3. **Endpoint API retourne des données vides**
   - Vérifiez que vous avez des données dans votre base PostgreSQL
   - Le fallback local utilise les tables `property_views` et `property_time_sessions`

### Tests
```bash
# Tester le système Amplitude
node scripts/test-amplitude.js

# Vérifier les logs en mode démo (dans la console navigateur)
# Les événements s'affichent comme: 📊 [Demo] Amplitude Event
```

## 🎉 Avantages

- **🛡️ Résilient**: Fonctionne même si Amplitude est indisponible
- **📈 Complet**: Toutes les métriques essentielles pour l'immobilier
- **🔧 Facile à maintenir**: Code propre et bien documenté
- **⚡ Performant**: Mode démo léger sans erreurs
- **📊 Analytics immédiats**: Données locales toujours disponibles

## 🔄 Migration depuis PostHog

La migration est complète ! Plus besoin de:
- Configuration PostHog
- Clés API PostHog
- Scripts de diagnostic PostHog

Le système est maintenant plus simple, plus fiable et mieux adapté à vos besoins immobiliers.