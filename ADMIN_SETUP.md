# 👑 Guide de Création d'un Utilisateur Administrateur

Ce guide explique comment créer un utilisateur administrateur pour accéder au dashboard admin de la marketplace immobilière.

## 🎯 Méthodes Disponibles

### Method 1 : Script Interactif (Recommandé)

Le script interactif vous guide pas à pas pour créer un administrateur :

```bash
node scripts/create-admin.js
```

**Avantages :**
- ✅ Saisie sécurisée du mot de passe (masqué)
- ✅ Validation en temps réel des données
- ✅ Confirmation avant création
- ✅ Gestion des utilisateurs existants

**Processus :**
1. Saisir l'email de l'administrateur
2. Saisir le prénom et nom
3. Saisir le téléphone (optionnel)
4. Saisir et confirmer le mot de passe
5. Confirmer la création

### Méthode 2 : Script Automatique

Pour une création rapide avec des paramètres par défaut :

```bash
# Création avec paramètres par défaut
node scripts/create-admin-auto.js

# Création avec paramètres personnalisés
node scripts/create-admin-auto.js --email=mon-admin@email.com --prenom=Jean --nom=Dupont --password=MonMotDePasse123
```

**Paramètres par défaut :**
- **Email :** admin@marketplace-immo.cm
- **Prénom :** Admin
- **Nom :** Système
- **Téléphone :** +237612345678
- **Mot de passe :** Admin123!

## 🔐 Informations de Connexion Par Défaut

Après création avec le script automatique :

```
📧 Email : admin@marketplace-immo.cm
🔒 Mot de passe : Admin123!
🌐 URL de connexion : /auth/login
🎯 Dashboard admin : /admin/dashboard
```

## 🛡️ Sécurité

### Validation des Données
- **Email :** Format valide requis
- **Mot de passe :** Minimum 6 caractères
- **Unicité :** Vérification de l'email existant

### Hachage du Mot de Passe
- Utilisation de `bcryptjs` avec salt de 12
- Stockage sécurisé dans la base de données

### Permissions
- Rôle automatique : `ADMIN`
- Compte actif par défaut : `isActive: true`
- Email vérifié : `emailVerified: Date`

## 🎭 Fonctionnalités du Dashboard Admin

Une fois connecté, l'administrateur peut :

### 📊 Vue d'Ensemble
- Statistiques générales de la plateforme
- Graphiques de croissance des utilisateurs et propriétés
- Métriques de performance

### 🏠 Gestion des Propriétés
- Liste complète avec statistiques détaillées :
  - 👁️ Nombre de vues
  - ❤️ Favoris
  - 📅 Demandes de visite
  - 🚩 Signalements
  - ⏱️ Temps moyen passé
- Filtres et recherche avancée
- Actions : voir détails, modifier, activer/désactiver

### 👥 Gestion des Utilisateurs
- Liste des agents et acheteurs
- Statistiques par utilisateur
- Actions de modération

### 🚩 Gestion des Signalements
- Traitement des rapports de propriétés
- Workflow de modération
- Actions correctives

## 🔧 Dépannage

### Erreur : "Un utilisateur avec cet email existe déjà"

Le script détecte automatiquement les utilisateurs existants :
- Si l'utilisateur est déjà admin : aucune action
- Si l'utilisateur n'est pas admin : proposition de promotion

### Erreur de Connexion à la Base

Vérifiez votre configuration :
```bash
# Vérifier la variable d'environnement
echo $DATABASE_URL

# Tester la connexion Prisma
npx prisma db push
```

### Problème de Permissions

Assurez-vous que l'utilisateur a bien le rôle `ADMIN` :
```sql
SELECT id, email, role, isActive FROM users WHERE email = 'votre-email@domain.com';
```

## 🔄 Promotion d'un Utilisateur Existant

Si vous voulez promouvoir un utilisateur existant en administrateur :

1. **Via le script interactif :** Entrez l'email existant, le script proposera la promotion
2. **Via Prisma Studio :** Modifier directement le champ `role` en `ADMIN`
3. **Via la base de données :**
   ```sql
   UPDATE users SET role = 'ADMIN' WHERE email = 'email@domain.com';
   ```

## 📞 Support

En cas de problème :
1. Vérifiez les logs de l'application
2. Consultez la documentation Prisma
3. Vérifiez la configuration de la base de données

---

**⚠️ Important :** Gardez les informations de connexion admin en sécurité et changez le mot de passe par défaut après la première connexion.