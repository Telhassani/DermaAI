# 📸 Composants Images - Documentation

Ce dossier contient des composants avancés pour la gestion d'images médicales. Actuellement, une version **simple** est utilisée dans l'application, mais ces composants **professionnels** sont disponibles pour des fonctionnalités futures.

## 🎯 État Actuel

**✅ Version Simple (En Production)**
- Upload basique avec sélection de fichiers
- Validation de type et taille (max 5MB)
- Galerie en grille responsive (2-4 colonnes)
- Suppression d'images au hover
- Stockage local en base64

**📦 Composants Avancés (Disponibles)**
Ces composants sont prêts à l'emploi mais pas encore intégrés :

### 1. `ImageUpload` - Upload Professionnel
**Fonctionnalités :**
- ✨ Drag & drop interactif (react-dropzone)
- 🗜️ Compression automatique des images
- 📊 Barre de progression d'upload
- ✅ Validation avancée (type, taille, nombre)
- 🎨 Prévisualisation avec animations (framer-motion)
- 🔄 Gestion des erreurs par fichier

**Usage :**
```tsx
import { ImageUpload } from '@/components/images'

<ImageUpload
  patientId={patientId}
  consultationId={consultationId}  // Optionnel
  onUploadComplete={(imageIds) => console.log(imageIds)}
  maxFiles={10}
  compressImages={true}
/>
```

### 2. `ImageGallery` - Galerie Avancée
**Fonctionnalités :**
- 🖼️ Lightbox plein écran
- 🔍 Zoom (0.5x à 3x)
- ⌨️ Navigation clavier (←, →, Esc, +, -)
- 📥 Téléchargement d'images
- 🗑️ Suppression avec confirmation
- 🎬 Animations de transition

**Usage :**
```tsx
import { ImageGallery } from '@/components/images'

<ImageGallery
  images={images}
  onImageDeleted={(id) => handleDelete(id)}
  columns={4}  // 2, 3, 4, ou 6
/>
```

### 3. `ImageAnnotationEditor` - Annotations sur Images
**Fonctionnalités :**
- ✏️ Outils de dessin (rectangle, cercle, stylo)
- 🎨 Palette de couleurs personnalisable
- 🏷️ Ajout de labels sur zones annotées
- ↩️ Undo/Redo
- 💾 Sauvegarde des annotations via API
- 🖱️ Canvas HTML5 natif (pas de dépendances lourdes)

**Usage :**
```tsx
import { ImageAnnotationEditor } from '@/components/images'

<ImageAnnotationEditor
  image={selectedImage}
  onSave={(imageId, annotations) => console.log('Saved')}
  onClose={() => setEditing(false)}
/>
```

### 4. `ImageComparison` - Comparaison Avant/Après
**Fonctionnalités :**
- 🎚️ Slider interactif pour comparaison
- 👆 Mode tactile optimisé
- 📱 Responsive
- 🎭 Trois variantes disponibles

**Variantes :**

**a) Slider Interactif**
```tsx
import { ImageComparison } from '@/components/images'

<ImageComparison
  beforeImage={image1}
  afterImage={image2}
  defaultPosition={50}
/>
```

**b) Côte à Côte**
```tsx
import { SideBySideComparison } from '@/components/images'

<SideBySideComparison
  beforeImage={image1}
  afterImage={image2}
/>
```

**c) Timeline d'Évolution**
```tsx
import { TimelineComparison } from '@/components/images'

<TimelineComparison
  images={allPatientImages}  // Triés par date automatiquement
/>
```

## 📦 Dépendances

Les composants avancés nécessitent :
- `react-dropzone` (v14.3.8) ✅ Installé
- `framer-motion` (v11.18.2) ✅ Installé
- `lucide-react` (v0.454.0) ✅ Installé
- `date-fns` (v4.1.0) ✅ Installé

**Toutes les dépendances sont déjà installées !**

## 🚀 Migration vers Composants Avancés

Pour passer de la version simple à la version avancée :

### Étape 1 : Modifier les Imports
```tsx
// Avant
import { Upload, X } from 'lucide-react'

// Après
import { ImageUpload, ImageGallery, ImageAnnotationEditor } from '@/components/images'
```

### Étape 2 : Remplacer le State
```tsx
// Avant
const [localImages, setLocalImages] = useState<string[]>([])

// Après
const [images, setImages] = useState<ImageMetadata[]>([])
```

### Étape 3 : Remplacer l'Upload Section
```tsx
// Avant (Simple)
<div onClick={() => fileInputRef.current?.click()}>
  <Upload />
  Cliquez pour sélectionner
</div>

// Après (Avancé)
<ImageUpload
  patientId={patientId}
  onUploadComplete={handleImageUploadComplete}
/>
```

### Étape 4 : Remplacer la Galerie
```tsx
// Avant (Simple)
<div className="grid grid-cols-2 gap-4">
  {localImages.map((img, i) => (
    <div key={i}>
      <img src={img} />
      <button onClick={() => removeImage(i)}>×</button>
    </div>
  ))}
</div>

// Après (Avancé)
<ImageGallery
  images={images}
  onImageDeleted={handleImageDeleted}
  columns={4}
/>
```

## 🔧 API Backend Requise

Les composants avancés nécessitent ces endpoints API :

```python
# FastAPI Backend
POST   /api/v1/images/upload          # Upload multiple images
GET    /api/v1/images/patient/{id}    # Get patient images
DELETE /api/v1/images/{id}            # Delete image
POST   /api/v1/images/{id}/annotations # Save annotations
GET    /api/v1/images/{id}/annotations # Get annotations
```

**⚠️ Important :** L'API backend n'est pas encore implémentée. Les composants avancés sont prêts côté frontend.

## 📝 Notes d'Implémentation

### Version Simple (Actuelle)
- ✅ Aucune dépendance externe lourde
- ✅ Stockage en base64 dans le state
- ✅ Parfait pour MVP et prototypage
- ⚠️ Pas de persistance (images perdues au refresh)
- ⚠️ Pas d'intégration backend

### Version Avancée (Disponible)
- ✅ Expérience utilisateur professionnelle
- ✅ Intégration API complète
- ✅ Persistance en base de données
- ✅ Annotations et comparaisons
- ⚠️ Nécessite backend fonctionnel
- ⚠️ Dépendances plus lourdes

## 🎯 Roadmap

**Phase 1 (Actuelle) :** ✅ Upload simple fonctionnel
**Phase 2 (Prochaine) :** Implémenter l'API backend
**Phase 3 :** Migrer vers composants avancés
**Phase 4 :** Ajouter annotations médicales
**Phase 5 :** Comparaison avant/après automatique

## 📧 Questions ?

Les composants sont entièrement documentés avec JSDoc. Consultez le code source pour plus de détails.
