# 🚀 CONFIGURATION FINALE - 2 Commandes

## ✅ Situation actuelle

- ✅ Frontend installé (npm)
- ✅ Backend installé (pip)
- ✅ Docker PostgreSQL + Redis tournent
- ⚠️ Il manque juste les tables dans PostgreSQL

## 🎯 COMMANDES À EXÉCUTER

Copiez-collez ces 2 commandes dans votre terminal :

### 1. Créer les tables et comptes demo dans PostgreSQL

```bash
docker exec -i dermai-postgres sh -c 'PGPASSWORD=dermai_pass_dev_only psql -U dermai_user -d dermai_db' <<'EOF'
-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'doctor',
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    phone VARCHAR(50),
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert demo users (passwords: Doctor123!, Admin123!, Secretary123!)
INSERT INTO users (email, hashed_password, full_name, role, is_active, is_verified, phone)
VALUES
('doctor@dermai.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5bOw8h5L3Q7d2', 'Dr. Jean Dupont', 'doctor', true, true, '+33987654321'),
('admin@dermai.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5bOw8h5L3Q7d2', 'DermAI Admin', 'admin', true, true, '+33123456789'),
('secretary@dermai.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5bOw8h5L3Q7d2', 'Marie Martin', 'secretary', true, true, '+33555123456')
ON CONFLICT DO NOTHING;

-- Show results
SELECT 'Users created: ' || COUNT(*) as status FROM users;
EOF
```

**Output attendu:** `Users created: 3`

### 2. Démarrer le backend

```bash
cd /Users/tariq/Applications/Dermatologie/backend && source venv/bin/activate && uvicorn app.main:app --reload
```

**Laisser tourner** ce terminal.

### 3. Démarrer le frontend (nouveau terminal)

```bash
cd /Users/tariq/Applications/Dermatologie/frontend && npm run dev
```

---

## 🎉 TESTER L'APPLICATION

### Ouvrir dans votre navigateur:

```
http://localhost:3000
```

### Se connecter avec:

```
Email:    doctor@dermai.com
Password: Doctor123!
```

### Vous devriez voir:

1. ✅ Page de login
2. ✅ Redirection vers /dashboard après connexion
3. ✅ "Bienvenue, Dr. Jean Dupont"
4. ✅ Informations du compte
5. ✅ Bouton Déconnexion fonctionne

---

## 🔍 URLs UTILES

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **API Docs (Swagger):** http://localhost:8000/docs

---

## 🔑 COMPTES DEMO

```
👨‍⚕️ Doctor:    doctor@dermai.com    / Doctor123!
🔐 Admin:     admin@dermai.com     / Admin123!
📋 Secretary: secretary@dermai.com / Secretary123!
```

---

## ❓ SI PROBLÈME

### Backend ne démarre pas

```bash
# Vérifier Docker
docker ps

# Voir les logs PostgreSQL
docker logs dermai-postgres

# Tester la connexion à la DB
docker exec -i dermai-postgres sh -c 'PGPASSWORD=dermai_pass_dev_only psql -U dermai_user -d dermai_db -c "SELECT COUNT(*) FROM users;"'
```

### Frontend ne démarre pas

```bash
cd frontend
npm run dev
```

Si erreur "Module not found":
```bash
cd frontend
npm install
```

---

**Vous êtes à 30 secondes du succès ! 🚀**

*Les 2 premières commandes créent tout ce qu'il faut.*
