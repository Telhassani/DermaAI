# 🔧 Configuration Base de Données PostgreSQL

Le user PostgreSQL `dermai_user` n'existe pas encore dans le container Docker.

## ✅ SOLUTION: Exécuter ces commandes

Copiez-collez ces commandes **une par une** dans votre terminal :

### 1. Créer le user PostgreSQL

```bash
docker exec dermai-postgres psql -U postgres -c "CREATE USER dermai_user WITH PASSWORD 'dermai_pass_dev_only';"
```

### 2. Créer la database

```bash
docker exec dermai-postgres psql -U postgres -c "CREATE DATABASE dermai_db OWNER dermai_user;"
```

### 3. Donner les permissions

```bash
docker exec dermai-postgres psql -U postgres -d dermai_db -c "GRANT ALL PRIVILEGES ON DATABASE dermai_db TO dermai_user; GRANT ALL ON SCHEMA public TO dermai_user; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO dermai_user; ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO dermai_user;"
```

### 4. Initialiser les tables

```bash
cd /Users/tariq/Applications/Dermatologie/backend
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
==================================================
✅ Database initialization complete!
==================================================
```

---

## 🚀 APRÈS INITIALISATION

### Démarrer le backend:

```bash
cd /Users/tariq/Applications/Dermatologie/backend
source venv/bin/activate
uvicorn app.main:app --reload
```

### Démarrer le frontend (nouveau terminal):

```bash
cd /Users/tariq/Applications/Dermatologie/frontend
npm run dev
```

### Ouvrir l'application:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000/docs

---

## 🔑 COMPTES DEMO

```
Doctor:    doctor@dermai.com    / Doctor123!
Admin:     admin@dermai.com     / Admin123!
Secretary: secretary@dermai.com / Secretary123!
```

---

## ❓ SI ERREUR "role already exists"

C'est OK ! Passez à la commande suivante.

## ❓ SI ERREUR "permission denied"

Vérifiez que Docker tourne:
```bash
docker ps
```

Vous devez voir `dermai-postgres` dans la liste.

---

**Une fois ces étapes terminées, tout fonctionnera ! 🚀**
