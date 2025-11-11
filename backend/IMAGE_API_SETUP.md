# 📸 Image API - Backend Setup Guide

L'API backend pour la gestion des images médicales est maintenant **complètement implémentée** ! Ce guide vous montre comment la démarrer et la tester.

## ✅ Ce qui a été implémenté

### 🗄️ Modèles de Base de Données

**`app/models/image.py`**
```python
# Table: images
- id, patient_id, consultation_id
- file_path, file_name, file_size, mime_type
- image_type: clinical, dermoscopic, histopathology, other
- category: diagnostic, follow_up, treatment, comparison
- body_location, description, image_metadata (JSON)
- thumbnail_path
- created_at, updated_at

# Table: image_annotations
- id, image_id, user_id
- tool: rectangle, circle, arrow, pen, text
- coordinates (JSON), color, label, notes
- created_at, updated_at
```

### 📡 API Endpoints

Tous les endpoints sont dans **`app/api/v1/images.py`** :

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `POST` | `/api/v1/images/upload` | Upload d'images multiples |
| `GET` | `/api/v1/images/patient/{id}` | Récupérer images d'un patient |
| `GET` | `/api/v1/images/{id}` | Métadonnées d'une image |
| `GET` | `/api/v1/images/{id}/file` | Télécharger le fichier image |
| `PATCH` | `/api/v1/images/{id}` | Mettre à jour métadonnées |
| `DELETE` | `/api/v1/images/{id}` | Supprimer une image |
| `POST` | `/api/v1/images/{id}/annotations` | Créer une annotation |
| `GET` | `/api/v1/images/{id}/annotations` | Lister annotations |
| `DELETE` | `/api/v1/images/annotations/{id}` | Supprimer annotation |

### ✨ Fonctionnalités

- ✅ Upload multi-fichiers avec validation
- ✅ Validation type MIME (jpeg, png, webp, heic)
- ✅ Limite de taille 10MB par fichier
- ✅ Génération automatique de noms uniques
- ✅ Stockage sur système de fichiers
- ✅ Relations patient/consultation
- ✅ Annotations médicales avec outils de dessin
- ✅ Audit logging complet
- ✅ CORS configuré pour frontend

## 🚀 Démarrage Rapide

### Prérequis

1. **PostgreSQL doit être en cours d'exécution**
2. **Python 3.11+ et dépendances installées**

### Étape 1: Démarrer PostgreSQL

```bash
# Option A: Démarrer service PostgreSQL (Linux/Mac)
sudo systemctl start postgresql
# ou
brew services start postgresql

# Option B: Docker (recommandé pour développement)
docker run -d \
  --name dermai-postgres \
  -e POSTGRES_USER=dermai_user \
  -e POSTGRES_PASSWORD=dermai_pass_dev_only \
  -e POSTGRES_DB=dermai_db \
  -p 5432:5432 \
  postgres:15
```

**Vérifier que PostgreSQL est accessible:**
```bash
psql -U dermai_user -d dermai_db -h localhost
# Mot de passe: dermai_pass_dev_only
```

### Étape 2: Exécuter la Migration

```bash
cd /home/user/DermaAI/backend
python migrate_add_images.py
```

**Sortie attendue:**
```
🔄 Starting migration: Add images and image_annotations tables...
📊 Creating images and image_annotations tables...
✅ Created image_type enum
✅ Created image_category enum
✅ Created annotation_tool enum
✅ Created images table
✅ Created indexes for images table
✅ Created image_annotations table
✅ Created indexes for image_annotations table

✅ Migration completed successfully!
```

### Étape 3: Démarrer le Serveur FastAPI

```bash
cd /home/user/DermaAI/backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Sortie attendue:**
```
🚀 DermAI API starting up...
📊 Environment: development
🔒 Debug mode: True
📝 API Docs: http://localhost:8000/docs
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Étape 4: Tester l'API

**Option A: Interface Swagger UI**

1. Ouvrir navigateur: http://localhost:8000/docs
2. Cliquer sur "Authorize" (🔒)
3. Entrer un token d'authentification valide
4. Tester l'endpoint `/api/v1/images/upload`

**Option B: cURL**

```bash
# Upload d'une image
curl -X POST "http://localhost:8000/api/v1/images/upload" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@/path/to/image.jpg" \
  -F "patient_id=1" \
  -F "image_type=clinical" \
  -F "category=diagnostic" \
  -F "description=Photo avant traitement"

# Récupérer images d'un patient
curl "http://localhost:8000/api/v1/images/patient/1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Télécharger une image
curl "http://localhost:8000/api/v1/images/1/file" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o downloaded_image.jpg
```

**Option C: Python requests**

```python
import requests

BASE_URL = "http://localhost:8000"
TOKEN = "your_auth_token"

# Upload
files = {"files": open("image.jpg", "rb")}
data = {
    "patient_id": 1,
    "image_type": "clinical",
    "category": "diagnostic",
    "description": "Test image"
}
headers = {"Authorization": f"Bearer {TOKEN}"}

response = requests.post(
    f"{BASE_URL}/api/v1/images/upload",
    files=files,
    data=data,
    headers=headers
)
print(response.json())

# Get patient images
response = requests.get(
    f"{BASE_URL}/api/v1/images/patient/1",
    headers=headers
)
print(response.json())
```

## 🔗 Intégration Frontend

### Mise à Jour du Client API Frontend

**Fichier:** `frontend/src/lib/api/images.ts`

L'API frontend existe déjà mais utilise des données mockées. Maintenant que le backend est prêt, vous pouvez activer les vraies requêtes HTTP :

```typescript
// Dans uploadImages(), remplacer le mock par:
const response = await uploadClient.post('/images/upload', formData, {
  onUploadProgress: (progressEvent) => {
    if (progressEvent.total && onProgress) {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      )
      onProgress(percentCompleted)
    }
  },
})
return response.data // Retourne ImageUploadResponse
```

### Variables d'Environnement Frontend

**Fichier:** `frontend/.env.local`

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

### Test Complet Frontend ↔ Backend

1. **Démarrer backend:** `uvicorn app.main:app --reload`
2. **Démarrer frontend:** `npm run dev` (dans `/frontend`)
3. **Naviguer:** http://localhost:3000
4. **Tester upload:**
   - Dashboard → Patients → Sélectionner patient → Onglet Images
   - Cliquer "Ajouter des images"
   - Sélectionner fichiers
   - Les images seront uploadées au backend !

## 📁 Structure des Fichiers Uploadés

```
backend/
├── uploads/
│   ├── images/
│   │   ├── 20250111_143025_a3f2b9c1.jpg
│   │   ├── 20250111_143026_7d8e4f0a.png
│   │   └── ...
│   └── thumbnails/
│       ├── thumb_20250111_143025_a3f2b9c1.jpg
│       └── ...
```

**Format des noms:** `YYYYMMDD_HHMMSS_UUID.ext`

## 🔍 Vérification de la Base de Données

```sql
-- Voir les images uploadées
SELECT id, patient_id, file_name, image_type, category, created_at
FROM images
ORDER BY created_at DESC;

-- Voir les annotations
SELECT a.id, a.image_id, a.tool, a.label, a.color
FROM image_annotations a
JOIN images i ON a.image_id = i.id;

-- Compter images par patient
SELECT patient_id, COUNT(*) as image_count
FROM images
GROUP BY patient_id;
```

## 🐛 Dépannage

### Erreur: "Connection refused" (PostgreSQL)

**Cause:** PostgreSQL n'est pas démarré

**Solution:**
```bash
sudo systemctl start postgresql
# ou utiliser Docker (voir Étape 1)
```

### Erreur: "Module not found: sqlalchemy"

**Cause:** Dépendances non installées

**Solution:**
```bash
pip install -r requirements.txt
```

### Erreur: "Table does not exist"

**Cause:** Migration pas exécutée

**Solution:**
```bash
python migrate_add_images.py
```

### Erreur: "Permission denied" lors de l'upload

**Cause:** Dossier uploads inexistant ou pas de permissions

**Solution:**
```bash
mkdir -p uploads/images uploads/thumbnails
chmod 755 uploads -R
```

### Frontend: "Failed to fetch"

**Cause:** CORS ou backend pas démarré

**Solution:**
1. Vérifier backend: `curl http://localhost:8000/health`
2. Vérifier CORS dans `app/core/config.py` :
   ```python
   ALLOWED_ORIGINS = [
       "http://localhost:3000",
       "http://localhost:3001",
   ]
   ```

## 📊 API Response Examples

### Upload Response

```json
{
  "success_count": 2,
  "failed_count": 0,
  "images": [
    {
      "id": 1,
      "patient_id": 1,
      "consultation_id": null,
      "file_name": "dermoscopy.jpg",
      "file_size": 2048576,
      "mime_type": "image/jpeg",
      "image_type": "dermoscopic",
      "category": "diagnostic",
      "body_location": "left arm",
      "description": "Suspicious mole",
      "image_metadata": null,
      "url": "http://localhost:8000/api/v1/images/1/file",
      "thumbnail_url": null,
      "created_at": "2025-01-11T14:30:25",
      "updated_at": "2025-01-11T14:30:25"
    }
  ],
  "errors": null
}
```

### Get Patient Images Response

```json
[
  {
    "id": 1,
    "patient_id": 1,
    "file_name": "dermoscopy.jpg",
    "url": "http://localhost:8000/api/v1/images/1/file",
    "image_type": "dermoscopic",
    "category": "diagnostic",
    "created_at": "2025-01-11T14:30:25"
  }
]
```

## 🔐 Sécurité

- ✅ Authentification requise (token JWT)
- ✅ Validation stricte des types MIME
- ✅ Limite de taille de fichier (10MB)
- ✅ Noms de fichiers générés (pas d'injection)
- ✅ Audit logging de toutes les opérations
- ✅ Relations cascade avec suppression sécurisée

## 📝 Prochaines Étapes

1. **Tester l'intégration complète** Frontend ↔ Backend
2. **Implémenter génération de thumbnails** (Pillow/PIL)
3. **Ajouter compression d'images** côté backend
4. **Implémenter stockage S3** pour production
5. **Ajouter endpoints de recherche** par métadonnées
6. **Créer API batch operations** (delete multiple, etc.)

## 📚 Documentation Complète

- **API Docs:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **Modèles:** `backend/app/models/image.py`
- **Schémas:** `backend/app/schemas/image.py`
- **Routes:** `backend/app/api/v1/images.py`

---

✅ **Backend API entièrement fonctionnel et prêt à être intégré !**

🚀 **Démarrez PostgreSQL → Lancez la migration → Démarrez FastAPI → Testez !**
