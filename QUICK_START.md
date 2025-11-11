# 🚀 QUICK START - DermAI

> **Utilisez ce guide pour démarrer rapidement après une pause**

---

## 📍 OÙ EN ÊTES-VOUS ?

### ✅ Phase A: Setup complet (TERMINÉ)
- Frontend boilerplate (Next.js 15 + TypeScript)
- Backend boilerplate (FastAPI + Python)
- Docker Compose configuré
- CI/CD pipelines créés

### ✅ Phase B: Authentication System (Backend COMPLET)
- 3 modèles créés (User, Patient, Appointment)
- Auth endpoints fonctionnels (register, login, me, logout)
- JWT tokens + password hashing
- Database init script avec comptes demo

### ⏳ PROCHAINE ÉTAPE: Installer dépendances + Tester

---

## 🎯 COMMANDES RAPIDES (Copier-coller)

### 1️⃣ Fix npm permissions (si erreur)
```bash
sudo chown -R $(whoami) ~/.npm
```

### 2️⃣ Installer dépendances

**Frontend:**
```bash
cd /Users/tariq/Applications/Dermatologie/frontend
npm install
```

**Backend:**
```bash
cd /Users/tariq/Applications/Dermatologie/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 3️⃣ Démarrer Docker
```bash
cd /Users/tariq/Applications/Dermatologie
docker-compose up -d postgres redis
```

**Vérifier:**
```bash
docker ps
# Doit voir: dermai-postgres et dermai-redis
```

### 4️⃣ Initialiser la base de données
```bash
cd backend
source venv/bin/activate
python init_db.py
```

**Output attendu:**
```
==================================================
🚀 DermAI Database Initialization
==================================================
🗄️  Creating database tables...
✅ Tables created successfully!
🌱 Seeding initial data...
✅ Seed data created successfully!

📝 Demo accounts created:
   🔐 Admin: admin@dermai.com / Admin123!
   👨‍⚕️ Doctor: doctor@dermai.com / Doctor123!
   📋 Secretary: secretary@dermai.com / Secretary123!

⚠️  IMPORTANT: Change these passwords in production!
==================================================
✅ Database initialization complete!
==================================================
```

### 5️⃣ Démarrer le backend
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

**Devrait afficher:**
```
🚀 DermAI API starting up...
📊 Environment: development
🔒 Debug mode: True
📝 API Docs: http://localhost:8000/docs
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 6️⃣ Tester l'API

**Ouvrir dans le navigateur:**
```
http://localhost:8000/docs
```

**Tester avec cURL:**
```bash
# Register un nouveau user
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "full_name": "Test User",
    "role": "doctor"
  }'

# Login avec le compte demo doctor
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=doctor@dermai.com&password=Doctor123!"
```

### 7️⃣ Démarrer le frontend (nouveau terminal)
```bash
cd /Users/tariq/Applications/Dermatologie/frontend
npm run dev
```

**Ouvrir:**
```
http://localhost:3000
```

---

## 📁 FICHIERS IMPORTANTS

| Fichier | Description |
|---------|-------------|
| [README.md](./README.md) | Documentation complète du projet |
| [PROGRESS.md](./PROGRESS.md) | Progression globale (Phase A) |
| [CHECKPOINT_PHASE_B.md](./CHECKPOINT_PHASE_B.md) | État détaillé Phase B |
| [QUICK_START.md](./QUICK_START.md) | Ce fichier (démarrage rapide) |
| [docker-compose.yml](./docker-compose.yml) | Configuration Docker |
| [backend/init_db.py](./backend/init_db.py) | Script initialisation DB |

---

## 🧪 TESTS RAPIDES

### Test 1: Backend fonctionne
```bash
curl http://localhost:8000/health
# Expected: {"status":"healthy"}
```

### Test 2: Database connectée
```bash
curl http://localhost:8000/
# Expected: JSON avec version et status
```

### Test 3: Auth endpoints disponibles
```bash
curl http://localhost:8000/api/v1
# Expected: JSON avec liste endpoints
```

### Test 4: Register fonctionne
```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "quicktest@test.com",
    "password": "Quick123!",
    "full_name": "Quick Test",
    "role": "doctor"
  }'
# Expected: 201 Created avec user data
```

---

## 🚨 PROBLÈMES COURANTS

### Erreur: "Module 'app' has no attribute 'db'"
**Solution:**
```bash
# Vérifier que tous les __init__.py existent
ls -la backend/app/db/__init__.py
ls -la backend/app/models/__init__.py
ls -la backend/app/schemas/__init__.py
```

### Erreur: "Cannot connect to database"
**Solution:**
```bash
# Vérifier que PostgreSQL tourne
docker ps | grep postgres

# Si non démarré
docker-compose up -d postgres

# Vérifier les logs
docker logs dermai-postgres
```

### Erreur: "Permission denied" (npm)
**Solution:**
```bash
sudo chown -R $(whoami) ~/.npm
```

### Erreur: "Port 8000 already in use"
**Solution:**
```bash
# Trouver le process
lsof -i :8000

# Tuer le process
kill -9 <PID>

# Ou utiliser un autre port
uvicorn app.main:app --reload --port 8001
```

---

## 🎯 PROCHAINES TÂCHES

### Immédiat (à faire maintenant):
1. ✅ Installer dépendances (npm + pip)
2. ✅ Démarrer Docker
3. ✅ Initialiser database
4. ✅ Tester backend (Swagger UI)

### Court terme (1-2 heures):
5. [ ] Créer page login (frontend)
6. [ ] Connecter frontend au backend
7. [ ] Tester flow: Register → Login → Dashboard

### Moyen terme (Week 1):
8. [ ] Dashboard layout
9. [ ] Patient list UI
10. [ ] Appointment calendar (basic)

---

## 📊 STACK ACTUEL

```
Frontend (localhost:3000)
├─ Next.js 15 + React 19
├─ TypeScript 5.3
├─ TailwindCSS 4.0
└─ Shadcn/UI components

Backend (localhost:8000)
├─ FastAPI 0.115+
├─ SQLAlchemy 2.0
├─ PostgreSQL 16
└─ Redis 7+

Docker
├─ PostgreSQL (port 5432)
├─ Redis (port 6379)
├─ pgAdmin (port 5050)
└─ Redis Commander (port 8081)
```

---

## 🔑 COMPTES DEMO

```
🔐 Admin:
   Email: admin@dermai.com
   Password: Admin123!

👨‍⚕️ Doctor:
   Email: doctor@dermai.com
   Password: Doctor123!

📋 Secretary:
   Email: secretary@dermai.com
   Password: Secretary123!
```

⚠️ **À changer en production !**

---

## 📞 BESOIN D'AIDE ?

1. **Lire d'abord:** [CHECKPOINT_PHASE_B.md](./CHECKPOINT_PHASE_B.md)
2. **Architecture:** [README.md](./README.md)
3. **Roadmap:** [PROGRESS.md](./PROGRESS.md)

---

## ✅ CHECKLIST DÉMARRAGE

```
[ ] npm permissions fixées
[ ] Frontend dependencies installées (npm install)
[ ] Backend dependencies installées (pip install)
[ ] Docker démarré (postgres + redis)
[ ] Database initialisée (init_db.py)
[ ] Backend accessible (http://localhost:8000/docs)
[ ] Frontend accessible (http://localhost:3000)
[ ] Test register réussi
[ ] Test login réussi
[ ] Comptes demo testés
```

---

**Une fois tout ✅ → Vous êtes prêt à développer !** 🚀

---

*Dernière mise à jour: 2025-11-09*
*Phase: B - Authentication System*
*Progression: 25%*
