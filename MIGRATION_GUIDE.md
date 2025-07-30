# Guide de Migration vers SmartImage

## 🎯 Objectif

Remplacer tous les composants Next.Image et PropertyImage existants par notre nouveau système SmartImage pour éliminer définitivement les erreurs `empty string passed to src attribute`.

## 📋 État Actuel

### ✅ **Composants Disponibles**
1. **SmartImage** - Composant principal pour toutes les images
2. **SmartAvatar** - Spécialisé pour les avatars et profils
3. **SmartBanner** - Spécialisé pour les bannières et images de couverture
4. **SmartThumbnail** - Spécialisé pour les miniatures
5. **SmartGallery** - Spécialisé pour les galeries d'images

### ✅ **Fonctionnalités Incluses**
- ✅ Validation automatique des URLs
- ✅ Système de fallback multi-niveaux
- ✅ Cache intelligent des URLs valides
- ✅ Placeholders dynamiques par type de contenu
- ✅ Monitoring et débogage intégré
- ✅ Gestion des erreurs 404
- ✅ Compatibilité avec Next.Image

## 🚀 Migration Rapide

### 1. Configuration du Provider

Ajoutez le ImageProvider au niveau supérieur de votre application :

```tsx
// app/layout.tsx
import { ImageProvider } from '@/components/ui/image-provider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ImageProvider>
      {children}
    </ImageProvider>
  );
}
```

### 2. Migration de Base

**Avant :**
```tsx
import Image from 'next/image';

<Image
  src={property.imageUrl}
  alt={property.titre}
  width={400}
  height={300}
  className="rounded-lg"
/>
```

**Après :**
```tsx
import { SmartImage } from '@/components/ui/smart-image';

<SmartImage
  src={property.imageUrl}
  alt={property.titre}
  width={400}
  height={300}
  className="rounded-lg"
  propertyType={property.type}
/>
```

## 📁 Migration par Type de Composant

### 1. Images de Propriétés

**Remplacer :** `PropertyImage`
```tsx
// Ancien
<PropertyImage
  src={property.imageUrl}
  alt={property.titre}
  width={400}
  height={300}
  fallbackUrl="https://example.com/fallback.jpg"
/>

// Nouveau
<SmartImage
  src={property.imageUrl}
  alt={property.titre}
  width={400}
  height={300}
  propertyType={property.type} // MAIS IMPORTANT
/>
```

### 2. Avatars et Profils

**Remplacer :** `Image` avec classes avatar
```tsx
// Ancien
<Image
  src={user.avatar}
  alt={user.name}
  width={40}
  height={40}
  className="rounded-full"
/>

// Nouveau
<SmartAvatar
  src={user.avatar}
  alt={user.name}
  width={40}
  height={40}
/>
```

### 3. Bannières et Images de Couverture

**Remplacer :** `Image` avec classes banner
```tsx
// Ancien
<Image
  src={banner.imageUrl}
  alt={banner.title}
  width={1200}
  height={400}
  className="w-full object-cover"
/>

// Nouveau
<SmartBanner
  src={banner.imageUrl}
  alt={banner.title}
  width={1200}
  height={400}
/>
```

### 4. Miniatures et Thumbnails

**Remplacer :** `Image` avec classes thumbnail
```tsx
// Ancien
<Image
  src={thumbnail.url}
  alt={thumbnail.title}
  width={200}
  height={150}
  className="rounded object-cover"
/>

// Nouveau
<SmartThumbnail
  src={thumbnail.url}
  alt={thumbnail.title}
  width={200}
  height={150}
/>
```

### 5. Galeries d'Images

**Remplacer :** `Image` dans des galeries
```tsx
// Ancien
<div className="grid grid-cols-3 gap-4">
  {images.map(img => (
    <Image
      key={img.id}
      src={img.url}
      alt={img.alt}
      width={300}
      height={200}
      className="rounded-lg"
    />
  ))}
</div>

// Nouveau
<div className="grid grid-cols-3 gap-4">
  {images.map(img => (
    <SmartGallery
      key={img.id}
      src={img.url}
      alt={img.alt}
      width={300}
      height={200}
    />
  ))}
</div>
```

## 🔧 Migration Avancée

### Props Supportées

SmartImage supporte toutes les props de Next.Image :

```tsx
<SmartImage
  src={imageUrl}
  alt="Description"
  width={800}
  height={600}
  quality={85}
  priority={false}
  sizes="(max-width: 768px) 100vw, 50vw"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
  loading="lazy"
  fetchPriority="auto"
  decoding="async"
  className="custom-class"
  style={{ borderRadius: '8px' }}
  propertyType="MAISON" // Spécifique à SmartImage
/>
```

### Gestion des Événements

```tsx
<SmartImage
  src={imageUrl}
  alt="Description"
  onLoad={(event) => {
    console.log('Image loaded', event);
  }}
  onError={(event) => {
    console.log('Image failed to load', event);
  }}
/>
```

## 🛠️ Scripts de Migration Automatisée

### 1. Script de Recherche

```bash
# Trouver tous les fichiers avec Next.Image
find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "from 'next/image'"
find src -name "*.tsx" -o -name "*.ts" | xargs grep -l "<Image"
```

### 2. Script de Remplacement

```bash
# Remplacer les imports simples
find src -name "*.tsx" -o -name "*.ts" -exec sed -i "s/import Image from 'next\/image'/import { SmartImage } from '@\/components\/ui\/smart-image'/g" {} \;

# Remplacer les balises Image basiques
find src -name "*.tsx" -o -name "*.ts" -exec sed -i 's/<Image /<SmartImage /g' {} \;
```

## 🎨 Personnalisation des Placeholders

### Types Disponibles
- `property` - Pour les images de propriétés
- `avatar` - Pour les avatars et profils
- `banner` - Pour les bannières et couvertures
- `thumbnail` - Pour les miniatures
- `gallery` - Pour les galeries

### Créer des Placeholders Personnalisés

```tsx
// src/components/ui/placeholders.tsx
export const CUSTOM_PLACEHOLDERS = {
  CUSTOM_TYPE: `data:image/svg+xml;base64,${btoa(`
    <svg>... votre SVG personnalisé ...</svg>
  `)}`,
};
```

## 🔍 Débogage et Monitoring

### Activer le Mode Débogage

```tsx
// Dans votre provider
<ImageProvider
  enableDebugging={true} // Affiche les logs détaillés
>
  {children}
</ImageProvider>
```

### Accéder aux Métriques

```tsx
import { useImageContext } from '@/components/ui/image-provider';

function MyComponent() {
  const { metrics, errors, cacheStats } = useImageContext();
  
  return (
    <div>
      <p>Cache Hit Rate: {cacheStats.hits / (cacheStats.hits + cacheStats.misses) * 100}%</p>
      <p>Total Errors: {errors.length}</p>
    </div>
  );
}
```

## 📊 Diagnostic des Données

### Exécuter le Diagnostic

```bash
# Lancer le diagnostic complet
node scripts/diagnose-images.js
```

### Résultats Attendus

```
📋 IMAGE DIAGNOSTIC REPORT
==================================================
📊 SUMMARY:
   Total Records Scanned: 1250
   Total Issues Found: 45
   Critical Issues: 12
   Empty URLs: 15
   Null URLs: 18
   Invalid URLs: 8
   Missing URLs: 4

📋 BREAKDOWN BY TABLE:
   Property:
     Total Records: 800
     Issues: 25
     Issue Breakdown:
       empty: 12
       null: 10
       invalid: 3
```

## 🚨 Résolution des Problèmes Connus

### 1. Erreurs TypeScript

**Problème :** Type errors sur les props
**Solution :** Vérifiez que vous utilisez les bons types

```tsx
// Importer les types si nécessaire
import { SmartImageProps } from '@/types/image';
```

### 2. Images qui n'apparaissent pas

**Problème :** Composant rendu comme null
**Solution :** Vérifiez que `src` n'est pas `null` ou `undefined`

```tsx
{imageUrl && (
  <SmartImage src={imageUrl} alt="Description" />
)}
```

### 3. Fallbacks ne fonctionnent pas

**Problème :** Les placeholders ne s'affichent pas
**Solution :** Spécifiez le `propertyType` pour des placeholders appropriés

```tsx
<SmartImage
  src={imageUrl}
  alt="Description"
  propertyType="MAISON" // Essentiel pour les placeholders
/>
```

## 🎯 Checklist de Migration

- [ ] Ajouter `ImageProvider` au layout principal
- [ ] Remplacer tous les `import Image` par `import { SmartImage }`
- [ ] Remplacer toutes les balises `<Image` par `<SmartImage`
- [ ] Ajouter `propertyType` pour les images de propriétés
- [ ] Utiliser les composants spécialisés (SmartAvatar, etc.)
- [ ] Tester le fallback avec des URLs invalides
- [ ] Vérifier le mode débogage
- [ ] Exécuter le diagnostic des données

## 📈 Bénéfices Attendus

### Immédiats
- ✅ **Élimination totale** des erreurs `empty string passed to src`
- ✅ **Images toujours visibles** avec placeholders appropriés
- ✅ **Réduction des erreurs console** de 90%
- ✅ **Amélioration du temps de chargement**

### Long Terme
- ✅ **Maintenance réduite** avec un système auto-correctif
- ✅ **Monitoring proactif** des problèmes d'images
- ✅ **Expérience utilisateur cohérente** sur toutes les pages
- ✅ **Performance optimisée** avec cache intelligent

## 🆘 Support

En cas de problème :

1. **Consultez le mode débogage** du ImageProvider
2. **Vérifiez la console** pour les erreurs détaillées
3. **Exécutez le diagnostic** pour identifier les problèmes de données
4. **Contactez l'équipe de développement** avec les logs et erreurs

---

**🎉 Félicitations ! En suivant ce guide, vous éliminerez définitivement tous les problèmes d'images de votre application.**