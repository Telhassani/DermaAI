# 🏥 DermAI - Application SAAS Cabinet Dermatologie

> Application SAAS complète pour la gestion de cabinet dermatologique avec intégration IA (analyse d'images, vérification interactions médicamenteuses, interprétation résultats laboratoires)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-green)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)

---

## 🎯 Vision

Créer **l'application SAAS la plus intuitive** pour dermatologues, intégrant l'IA de manière invisible et utile.

**Résultats attendus:**
- ✅ 30-50% gain de temps par consultation
- ✅ 92%+ précision diagnostique (avec IA)
- ✅ 99%+ détection interactions médicamenteuses
- ✅ Interface "pour non-geeks"
- ✅ HIPAA/RGPD 100% compliant

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│           UTILISATEURS FINAUX               │
│  (Médecins, Assistants, Patients)          │
└──────────────┬──────────────────────────────┘
               │
      ┌────────┴────────┐
      │                 │
  📱 WEB APP       📲 MOBILE
  (Next.js 15)    (React Native)
      │                 │
      └────────┬────────┘
               │
      ┌────────▼────────┐
      │  API GATEWAY    │
      │   (FastAPI)     │
      └────────┬────────┘
               │
    ┌──────────┼──────────┐
    │          │          │
┌───▼───┐  ┌──▼───┐  ┌───▼────┐
│  AI   │  │  DB  │  │EXTERNAL│
│Claude │  │ PG16 │  │  APIs  │
│GPT-4o │  │Redis │  │RxNav   │
└───────┘  └──────┘  │Kantesti│
                      └────────┘
```

---

## 📦 Stack Technique

### Frontend
- **Framework:** Next.js 15 + React 19 + TypeScript 5.3
- **Styling:** TailwindCSS 4.0 + Shadcn/UI
- **State:** Zustand + React Query (TanStack Query v5)
- **UI/UX:** Framer Motion, Recharts
- **Forms:** React Hook Form + Zod
- **Deploy:** Vercel

### Backend
- **Framework:** FastAPI 0.115+ (Python 3.11+)
- **ORM:** SQLAlchemy 2.0 + Alembic
- **Database:** PostgreSQL 16
- **Cache:** Redis 7+
- **Queue:** Celery + APScheduler
- **Testing:** Pytest + Coverage
- **Deploy:** Docker + Kubernetes

### IA & APIs
- **Pathologie:** Claude 3.5 Sonnet (primary)
- **Fallback:** GPT-4o
- **Médicaments:** RxNav (gratuit) + Claude reasoning
- **Laboratoires:** Kantesti AI ou Claude

### DevOps
- **Containers:** Docker + Docker Compose
- **CI/CD:** GitHub Actions
- **Monitoring:** Sentry + Prometheus
- **Logs:** ELK Stack

---

## 🚀 Quick Start

### Prérequis

```bash
# Vérifier versions
node --version    # v20.0.0+
python --version  # 3.11.0+
docker --version  # 24.0.0+
```

### Installation (Développement Local)

```bash
# 1. Cloner le repository
git clone <repo-url>
cd Dermatologie

# 2. Démarrer les services (PostgreSQL + Redis)
docker-compose up -d

# 3. Setup Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# 4. Setup Frontend (nouveau terminal)
cd frontend
npm install
npm run dev

# 5. Accéder à l'application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Variables d'environnement

Créer `.env` files:

**Backend (.env):**
```env
# Database
DATABASE_URL=postgresql://dermai_user:dermai_pass@localhost:5432/dermai_db
REDIS_URL=redis://localhost:6379/0

# Security
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# AI APIs
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
KANTESTI_API_KEY=...

# Environment
ENVIRONMENT=development
DEBUG=True
```

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_ENV=development
```

---

## 📁 Structure du Projet

```
Dermatologie/
├── frontend/                 # Application Next.js
│   ├── src/
│   │   ├── app/             # App Router (Next.js 15)
│   │   │   ├── (auth)/      # Routes authentification
│   │   │   ├── (dashboard)/ # Routes dashboard
│   │   │   ├── layout.tsx   # Layout racine
│   │   │   └── page.tsx     # Page d'accueil
│   │   ├── components/      # Composants réutilisables
│   │   │   ├── ui/          # Shadcn/UI components
│   │   │   ├── forms/       # Formulaires
│   │   │   ├── layouts/     # Layouts
│   │   │   └── features/    # Feature-specific components
│   │   ├── lib/             # Utilitaires
│   │   │   ├── api/         # API client
│   │   │   ├── hooks/       # Custom hooks
│   │   │   ├── stores/      # Zustand stores
│   │   │   ├── utils/       # Helpers
│   │   │   └── validations/ # Zod schemas
│   │   ├── styles/          # Styles globaux
│   │   └── types/           # TypeScript types
│   ├── public/              # Assets statiques
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.ts
│
├── backend/                  # Application FastAPI
│   ├── app/
│   │   ├── api/             # Endpoints API
│   │   │   ├── v1/          # API v1
│   │   │   │   ├── auth.py
│   │   │   │   ├── patients.py
│   │   │   │   ├── appointments.py
│   │   │   │   ├── prescriptions.py
│   │   │   │   ├── ai_analysis.py
│   │   │   │   └── billing.py
│   │   │   └── deps.py      # Dependencies
│   │   ├── core/            # Configuration
│   │   │   ├── config.py    # Settings
│   │   │   ├── security.py  # JWT, hashing
│   │   │   └── logging.py   # Logging setup
│   │   ├── models/          # SQLAlchemy models
│   │   │   ├── user.py
│   │   │   ├── patient.py
│   │   │   ├── appointment.py
│   │   │   ├── prescription.py
│   │   │   └── audit_log.py
│   │   ├── schemas/         # Pydantic schemas
│   │   │   ├── user.py
│   │   │   ├── patient.py
│   │   │   └── ...
│   │   ├── services/        # Business logic
│   │   │   ├── auth_service.py
│   │   │   ├── patient_service.py
│   │   │   ├── ai/          # AI services
│   │   │   │   ├── claude_pathology.py
│   │   │   │   ├── drug_interaction.py
│   │   │   │   └── lab_analysis.py
│   │   │   └── notifications/
│   │   ├── db/              # Database
│   │   │   ├── base.py      # Base class
│   │   │   └── session.py   # DB session
│   │   └── main.py          # FastAPI app
│   ├── alembic/             # Migrations
│   ├── tests/               # Tests
│   ├── requirements.txt
│   └── pyproject.toml
│
├── docker-compose.yml        # Services locaux
├── .github/
│   └── workflows/
│       ├── ci-frontend.yml
│       └── ci-backend.yml
├── docs/                     # Documentation
│   ├── specs/               # Spécifications
│   ├── api/                 # API documentation
│   └── deployment/          # Guides déploiement
└── README.md                 # Ce fichier
```

---

## 🔐 Sécurité & Conformité

### HIPAA Compliance
- ✅ Encryption at rest (database)
- ✅ Encryption in transit (TLS 1.3)
- ✅ Audit logs complets (tous les accès)
- ✅ MFA (Multi-Factor Authentication)
- ✅ Role-based access control (RBAC)
- ✅ Automatic session timeout
- ✅ Data backup & disaster recovery

### RGPD
- ✅ Consentement explicite patients
- ✅ Droit à l'oubli (suppression données)
- ✅ Portabilité des données
- ✅ Privacy by design
- ✅ DPO (Data Protection Officer) contacts

### Security Best Practices
- ✅ SQL injection prevention (SQLAlchemy ORM)
- ✅ XSS protection (React sanitization)
- ✅ CSRF tokens
- ✅ Rate limiting (API)
- ✅ Input validation (Zod + Pydantic)
- ✅ Secrets management (environment variables)

---

## 🧪 Tests

### Backend
```bash
cd backend
pytest tests/ -v --cov=app --cov-report=html
# Objectif: 80%+ coverage
```

### Frontend
```bash
cd frontend
npm run test
npm run test:e2e  # Playwright
# Objectif: 60%+ coverage
```

### Tests E2E
```bash
npm run test:e2e:ui  # Mode interactif
```

---

## 📊 Roadmap (12 semaines)

### ✅ PHASE 1: Foundations (Semaines 1-2)
- [x] Setup repositories & CI/CD
- [x] Configure databases
- [ ] Authentication system (JWT + MFA)
- [ ] User roles & permissions
- [ ] HIPAA audit logging

### 🚧 PHASE 2: MVP Core (Semaines 3-6)
- [ ] Patient CRUD
- [ ] Appointment scheduling
- [ ] Prescription management
- [ ] Dashboard UI
- [ ] Mobile responsive design

### ⏳ PHASE 3: AI Integration (Semaines 7-9)
- [ ] Image analysis (Claude 3.5)
- [ ] Drug interactions (RxNav + Claude)
- [ ] Lab results interpretation (Kantesti/Claude)

### ⏳ PHASE 4: Polish (Semaines 10-11)
- [ ] Advanced search
- [ ] Analytics dashboard
- [ ] Performance optimization
- [ ] Security audit

### ⏳ PHASE 5: Launch (Semaine 12)
- [ ] HIPAA certification
- [ ] Penetration testing
- [ ] Staff training
- [ ] Go live

---

## 📚 Documentation

- [📖 Spécifications complètes](./docs/specs/)
- [🔌 API Documentation](http://localhost:8000/docs)
- [🎨 Design System](./frontend/src/components/ui/)
- [🧪 Guide de test](./docs/testing.md)
- [🚀 Guide de déploiement](./docs/deployment/)

---

## 🗄️ Database Management

### Configuration

**Développement:**
```bash
# SQLite (par défaut)
# .env contient: DATABASE_URL=sqlite:///./test.db
# ✅ Simple, pas besoin Docker
# ✅ Parfait pour développement/tests
```

**Production:**
```bash
# PostgreSQL
# .env contient: DATABASE_URL=postgresql://user:password@host:5432/dbname
# Docker Compose gère PostgreSQL automatiquement
docker-compose up -d postgres redis
```

### Credentials de Démonstration

```
Email: doctor@dermai.com / password123
Email: admin@dermai.com / password123
Email: secretary@dermai.com / password123

Patients de démo: Marie Dupuis, Jean Martin, Sophie Bernard
Consultations et ordonnances pré-créées
```

### Commandes de Maintenance

#### Sauvegarder la base de données
```bash
# Création automatique avec cleanup des anciennes sauvegardes
./backend/scripts/backup_db.sh

# Les sauvegardes sont stockées dans: backend/backups/
# Dernières 7 sauvegardes sont conservées
```

#### Réinitialiser complètement la base
```bash
# Supprime test.db, crée une sauvegarde, puis réinitialise
./backend/scripts/reset_db.sh

# ⚠️ Cela supprime TOUS les données
# Une sauvegarde est créée avant la suppression
```

#### Réinitialiser avec données seulement
```bash
cd backend
python init_db.py

# Ajoute les consultations et ordonnances de démonstration
# Préserve les utilisateurs et patients existants
```

#### Inspécter la base SQLite
```bash
# Ouvrir la console SQLite
sqlite3 backend/test.db

# Quelques requêtes utiles:
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM patients;
SELECT COUNT(*) FROM consultations;
SELECT COUNT(*) FROM prescriptions;
```

---

## 🤝 Contribution

### Workflow Git

```bash
# 1. Créer une branche
git checkout -b feature/nom-feature

# 2. Développer + tester
npm run test  # ou pytest

# 3. Commit
git commit -m "feat: description courte"

# 4. Push
git push origin feature/nom-feature

# 5. Créer Pull Request
```

### Conventions de commit

```
feat: nouvelle fonctionnalité
fix: correction bug
docs: documentation
style: formatage, point-virgules
refactor: refactoring code
test: ajout tests
chore: tâches maintenance
```

---

## 📞 Support

- **Email:** support@dermai.com
- **Documentation:** [docs.dermai.com](https://docs.dermai.com)
- **Issues:** [GitHub Issues](https://github.com/dermai/issues)

---

## 📄 License

MIT License - voir [LICENSE](./LICENSE)

---

## 🎯 Métriques de Succès

- ⏱️ **Uptime:** 99.9% SLA
- ⚡ **API Response:** <200ms (p95)
- 📱 **Lighthouse Score:** 95+
- 👨‍⚕️ **Doctor Adoption:** 90%+
- ⭐ **Patient Satisfaction:** 4.5+/5
- 🎯 **Diagnostic Accuracy:** 92%+

---

**Construit avec ❤️ pour les dermatologues**

*Version: 0.1.0 | Dernière mise à jour: 2025-11-09*
