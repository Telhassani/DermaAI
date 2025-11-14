# 📋 Plan d'Action - Intégration Complète DermaAI
## Objectif: Rendre les 4 modules opérationnels avec standards enterprise

**Date**: 2025-11-14
**Modules Concernés**: Patients, Calendrier (Appointments), Ordonnances (Prescriptions), Consultations

---

## 🔍 PHASE 1: DIAGNOSTIC COMPLET (Durée: 2h)

### 1.1 État Actuel des Modules

#### ✅ Module Patients
- **Backend**:
  - ✅ Modèle défini (`backend/app/models/patient.py`)
  - ✅ API endpoints (`backend/app/api/v1/patients.py`)
  - ✅ Schemas Pydantic (`backend/app/schemas/patient.py`)
  - ✅ Migration Alembic
  - ✅ 3 patients de test créés
- **Frontend**:
  - ✅ Page liste (`frontend/src/app/(dashboard)/dashboard/patients/page.tsx`)
  - ✅ Page détail patient (`frontend/src/app/(dashboard)/dashboard/patients/[id]/page.tsx`)
  - ✅ Page création patient (`frontend/src/app/(dashboard)/dashboard/patients/new/page.tsx`)
- **Mock Data**: ✅ 3 patients (Alice, Marc, Sophie)
- **Relations**: ⚠️ Relations commentées (non actives)
- **Tests E2E**: ❌ Non testés

#### ✅ Module Calendrier (Appointments)
- **Backend**:
  - ✅ Modèle défini (`backend/app/models/appointment.py`)
  - ✅ API endpoints (`backend/app/api/v1/appointments.py`)
  - ✅ Schemas Pydantic
  - ✅ Migration Alembic
  - ✅ 4 rendez-vous de test créés
- **Frontend**:
  - ✅ Page calendrier (`frontend/src/app/(dashboard)/dashboard/calendar/page.tsx`)
  - ✅ Fonctionnalités récurrence
  - ✅ Optimistic UI updates
- **Mock Data**: ✅ 4 appointments (3 planifiés, 1 complété)
- **Relations**: ⚠️ Relations commentées (non actives)
- **Tests E2E**: ❌ Non testés

#### ⚠️ Module Consultations
- **Backend**:
  - ✅ Modèle défini (`backend/app/models/consultation.py`) - TRÈS COMPLET
  - ✅ API endpoints (`backend/app/api/v1/consultations.py`)
  - ✅ Schemas Pydantic
  - ✅ Migration Alembic
  - ❌ AUCUNE consultation de test
- **Frontend**:
  - ✅ Page liste consultations (`frontend/src/app/(dashboard)/dashboard/consultations/page.tsx`)
  - ✅ Page nouvelle consultation (`frontend/src/app/(dashboard)/dashboard/consultations/new/page.tsx`)
  - ✅ Page consultation depuis patient (`patients/[id]/consultation/new/page.tsx`)
- **Mock Data**: ❌ 0 consultation
- **Relations**: ⚠️ Relations commentées (non actives)
- **Tests E2E**: ❌ Non testés

#### ⚠️ Module Ordonnances (Prescriptions)
- **Backend**:
  - ✅ Modèle défini (`backend/app/models/prescription.py`) - Format JSON
  - ✅ API endpoints (`backend/app/api/v1/prescriptions.py`)
  - ✅ Schemas Pydantic
  - ✅ Migration Alembic
  - ❌ AUCUNE ordonnance de test
- **Frontend**:
  - ❌ Page liste manquante
  - ❌ Page création manquante
  - ❌ Intégration PDF manquante
- **Mock Data**: ❌ 0 prescription
- **Relations**: ⚠️ Relations commentées (non actives)
- **Tests E2E**: ❌ Non testés

---

### 1.2 Relations Entre Modules (État Actuel)

```
User (Doctor)
  └─── has many ─→ Patients ✅
  └─── has many ─→ Appointments ✅
  └─── has many ─→ Consultations ⚠️ (commenté)
  └─── has many ─→ Prescriptions ⚠️ (commenté)

Patient
  └─── has many ─→ Appointments ⚠️ (commenté)
  └─── has many ─→ Consultations ⚠️ (commenté)
  └─── has many ─→ Prescriptions ⚠️ (commenté)

Appointment
  └─── belongs to ─→ Patient ⚠️ (commenté)
  └─── belongs to ─→ Doctor ⚠️ (commenté)

Consultation
  └─── belongs to ─→ Patient ⚠️ (commenté)
  └─── belongs to ─→ Doctor ⚠️ (commenté)
  └─── has many ─→ Prescriptions ⚠️ (commenté)

Prescription
  └─── belongs to ─→ Consultation ⚠️ (commenté)
  └─── belongs to ─→ Patient ⚠️ (commenté)
  └─── belongs to ─→ Doctor ⚠️ (commenté)
```

**Problème Majeur**: Toutes les relations SQLAlchemy sont commentées, ce qui empêche:
- Les requêtes avec jointures
- L'eager loading
- Les cascades de suppression
- La navigation entre objets

---

## 🎯 PHASE 2: ACTIVATION DES RELATIONS (Durée: 1h)

### 2.1 Activer Relations SQLAlchemy

**Fichiers à modifier**:
1. `backend/app/models/user.py` - Ajouter relationships
2. `backend/app/models/patient.py` - Ajouter relationships
3. `backend/app/models/appointment.py` - Ajouter relationships
4. `backend/app/models/consultation.py` - Ajouter relationships
5. `backend/app/models/prescription.py` - Ajouter relationships

**Stratégie**:
- Utiliser `back_populates` pour relations bidirectionnelles
- Définir cascades appropriées (`all, delete-orphan` où nécessaire)
- Ajouter `lazy='select'` ou `lazy='joined'` selon besoins

### 2.2 Créer Migration Alembic

```bash
cd backend
alembic revision --autogenerate -m "Activate model relationships"
alembic upgrade head
```

---

## 📊 PHASE 3: MOCK DATA COMPLETS (Durée: 2h)

### 3.1 Enrichir seed_data.py

**Objectifs**:
- Créer 5 consultations complètes
- Créer 5 ordonnances liées aux consultations
- Lier consultations aux appointments existants
- Assurer cohérence des dates
- Ajouter images de test (si nécessaire)

**Structure des données**:
```python
Consultation 1 (Alice Johnson):
  - Date: 2025-11-07 (rendez-vous complété)
  - Diagnostic: Dermatite de contact
  - Prescription: 1 ordonnance (crème corticoïde)

Consultation 2 (Marc Dubois):
  - Date: 2025-10-15
  - Diagnostic: Acné vulgaire
  - Prescription: 1 ordonnance (traitement acné)

Consultation 3 (Sophie Martin):
  - Date: 2025-09-20
  - Diagnostic: Psoriasis
  - Prescription: 1 ordonnance (traitement psoriasis)

Consultation 4 (Alice Johnson):
  - Date: 2025-08-10
  - Diagnostic: Contrôle dermatologique
  - Prescription: Pas d'ordonnance

Consultation 5 (Marc Dubois):
  - Date: 2025-07-05
  - Diagnostic: Eczéma
  - Prescription: 1 ordonnance (crème hydratante)
```

### 3.2 Script d'Enrichissement

```bash
python3 backend/enrich_seed_data.py
```

---

## 🧪 PHASE 4: TESTS END-TO-END (Durée: 3h)

### 4.1 Tests Backend (API)

**Créer**: `backend/tests/test_integration_modules.py`

```python
# Test workflow complet:
# 1. Créer patient
# 2. Créer appointment
# 3. Créer consultation liée à l'appointment
# 4. Créer prescription liée à la consultation
# 5. Vérifier toutes les relations
```

**Endpoints à tester**:
- GET /api/v1/patients?page=1
- GET /api/v1/patients/{id}
- GET /api/v1/appointments?patient_id={id}
- GET /api/v1/consultations?patient_id={id}
- GET /api/v1/prescriptions?consultation_id={id}
- POST /api/v1/consultations
- POST /api/v1/prescriptions

### 4.2 Tests Frontend (Navigation)

**Workflows à tester manuellement**:
1. Dashboard → Patients → Voir patient → Historique consultations
2. Dashboard → Calendrier → Voir rendez-vous → Créer consultation
3. Consultation → Créer ordonnance → Imprimer PDF
4. Patient → Nouvelle consultation → Ajouter prescription

---

## 🏗️ PHASE 5: REFACTORING STANDARDS (Durée: 4h)

### 5.1 Standards Backend

#### 5.1.1 Architecture en Couches
```
backend/app/
├── api/v1/          # Controllers (FastAPI routes)
├── models/          # ORM models (SQLAlchemy)
├── schemas/         # DTOs (Pydantic)
├── services/        # ✨ NOUVEAU - Business logic
├── repositories/    # ✨ NOUVEAU - Data access layer
├── core/            # Configuration, security
└── utils/           # Helper functions
```

**Créer services layer**:
- `backend/app/services/patient_service.py`
- `backend/app/services/consultation_service.py`
- `backend/app/services/prescription_service.py`
- `backend/app/services/appointment_service.py`

**Principe**:
- API routes → appelle Service
- Service → contient business logic
- Service → appelle Repository
- Repository → communique avec DB

#### 5.1.2 Dependency Injection

```python
# Exemple: backend/app/api/v1/consultations.py
from app.services.consultation_service import ConsultationService

@router.post("")
async def create_consultation(
    data: ConsultationCreate,
    consultation_service: ConsultationService = Depends(get_consultation_service),
    current_user: User = Depends(get_current_doctor),
):
    return await consultation_service.create(data, current_user.id)
```

#### 5.1.3 Error Handling

```python
# backend/app/core/exceptions.py
class DermaAIException(Exception):
    pass

class ResourceNotFound(DermaAIException):
    pass

class ValidationError(DermaAIException):
    pass
```

#### 5.1.4 Logging & Monitoring

```python
# backend/app/core/logging.py
import structlog

logger = structlog.get_logger()

# Usage:
logger.info("consultation_created",
    consultation_id=consultation.id,
    patient_id=consultation.patient_id,
    doctor_id=consultation.doctor_id
)
```

### 5.2 Standards Frontend

#### 5.2.1 Architecture Composants

```
frontend/src/
├── app/                    # Next.js app router
├── components/
│   ├── ui/                 # Composants réutilisables (boutons, inputs)
│   ├── features/           # ✨ NOUVEAU - Features par module
│   │   ├── patients/
│   │   ├── consultations/
│   │   ├── prescriptions/
│   │   └── appointments/
│   └── layouts/            # Layouts communs
├── hooks/                  # Custom React hooks
├── services/               # API calls
├── stores/                 # Zustand stores
└── utils/                  # Helper functions
```

#### 5.2.2 React Query + Zustand

**État Global (Zustand)**:
- Auth state
- UI state (sidebar, modals)
- User preferences

**Server State (React Query)**:
- Patients data
- Consultations data
- Prescriptions data
- Appointments data

**Exemple**:
```typescript
// frontend/src/services/consultations.ts
export const useConsultations = (patientId?: number) => {
  return useQuery({
    queryKey: ['consultations', patientId],
    queryFn: () => fetchConsultations(patientId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCreateConsultation = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createConsultation,
    onSuccess: () => {
      queryClient.invalidateQueries(['consultations'])
    },
  })
}
```

#### 5.2.3 TypeScript Strict Mode

```json
// frontend/tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

#### 5.2.4 Component Patterns

```typescript
// ✅ GOOD: Composant avec types stricts
interface ConsultationCardProps {
  consultation: Consultation
  onEdit?: (id: number) => void
  onDelete?: (id: number) => void
}

export const ConsultationCard: React.FC<ConsultationCardProps> = ({
  consultation,
  onEdit,
  onDelete
}) => {
  // Implementation
}

// ✅ GOOD: Custom hook pour logique réutilisable
export const useConsultationForm = (initialData?: Consultation) => {
  const [formData, setFormData] = useState(initialData)
  const { mutate, isLoading } = useCreateConsultation()

  const handleSubmit = useCallback(() => {
    mutate(formData)
  }, [formData, mutate])

  return { formData, setFormData, handleSubmit, isLoading }
}
```

### 5.3 Standards de Code

#### 5.3.1 Backend (Python)

**Outils**:
- ✅ Black (formatting) - déjà installé
- ✅ Flake8 (linting) - déjà installé
- ✅ MyPy (type checking) - déjà installé
- ✅ Isort (import sorting) - déjà installé

**Configuration**:
```ini
# backend/pyproject.toml
[tool.black]
line-length = 100
target-version = ['py311']

[tool.isort]
profile = "black"
line_length = 100

[tool.mypy]
python_version = "3.11"
warn_return_any = true
warn_unused_configs = true
disallow_untyped_defs = true
```

**Scripts**:
```bash
# backend/scripts/lint.sh
black .
isort .
flake8 .
mypy .
```

#### 5.3.2 Frontend (TypeScript)

**Outils**:
- ESLint (déjà configuré avec Next.js)
- Prettier (à ajouter)

```json
// frontend/.prettierrc
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

---

## 📄 PHASE 6: DOCUMENTATION (Durée: 2h)

### 6.1 Documentation API (OpenAPI/Swagger)

**FastAPI génère automatiquement**:
- ✅ `/docs` - Swagger UI
- ✅ `/redoc` - ReDoc

**Améliorer descriptions**:
```python
@router.post(
    "",
    response_model=ConsultationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Créer une nouvelle consultation",
    description="""
    Crée une consultation dermatologique complète avec:
    - Motif de consultation
    - Examen clinique
    - Diagnostic
    - Plan de traitement

    Nécessite les permissions de médecin.
    """,
    responses={
        201: {"description": "Consultation créée avec succès"},
        400: {"description": "Données invalides"},
        404: {"description": "Patient non trouvé"},
    }
)
```

### 6.2 README Modules

Créer pour chaque module:
- `docs/modules/PATIENTS.md`
- `docs/modules/APPOINTMENTS.md`
- `docs/modules/CONSULTATIONS.md`
- `docs/modules/PRESCRIPTIONS.md`

**Structure**:
1. Vue d'ensemble
2. Fonctionnalités
3. Modèles de données
4. API endpoints
5. Screenshots
6. Workflows utilisateur

---

## ✅ PHASE 7: TESTS FINAUX & VALIDATION (Durée: 2h)

### 7.1 Checklist Validation

**Pour chaque module (Patients, Appointments, Consultations, Prescriptions)**:

- [ ] **Modèles**:
  - [ ] Relations SQLAlchemy actives
  - [ ] Contraintes de base de données
  - [ ] Indexes appropriés

- [ ] **API**:
  - [ ] GET list (avec pagination)
  - [ ] GET by ID (avec relations)
  - [ ] POST create
  - [ ] PUT/PATCH update
  - [ ] DELETE
  - [ ] Filtres fonctionnels

- [ ] **Frontend**:
  - [ ] Page liste avec recherche/filtre
  - [ ] Page détail
  - [ ] Formulaire création
  - [ ] Formulaire édition
  - [ ] Confirmation suppression
  - [ ] Loading states
  - [ ] Error handling

- [ ] **Mock Data**:
  - [ ] Minimum 5 entrées par module
  - [ ] Relations cohérentes
  - [ ] Dates réalistes

- [ ] **Tests**:
  - [ ] Tests unitaires (service layer)
  - [ ] Tests d'intégration (API)
  - [ ] Tests E2E (workflows complets)

### 7.2 Tests de Performance

```bash
# Backend
cd backend
pytest tests/ -v --cov=app --cov-report=html

# Load testing
locust -f tests/load/locustfile.py
```

### 7.3 Tests de Sécurité

- [ ] Authentification sur tous endpoints protégés
- [ ] Autorisation (RBAC) correcte
- [ ] Validation des inputs
- [ ] Protection CSRF
- [ ] Rate limiting
- [ ] SQL Injection (via ORM)
- [ ] XSS (via sanitization)

---

## 📊 MÉTRIQUES DE SUCCÈS

### Objectifs Quantitatifs:

1. **Code Coverage**: ≥ 80%
2. **Response Time API**: < 200ms (p95)
3. **Frontend Load Time**: < 2s
4. **TypeScript Errors**: 0
5. **Python Type Coverage**: ≥ 90%
6. **ESLint Warnings**: 0
7. **Relations Actives**: 100%
8. **Mock Data**: ≥ 5 entrées/module

### Objectifs Qualitatifs:

- ✅ Code maintenable et documenté
- ✅ Architecture scalable
- ✅ UX fluide et intuitive
- ✅ Performance optimale
- ✅ Sécurité robuste

---

## 🚀 ROADMAP D'EXÉCUTION

### Semaine 1: Infrastructure & Relations
- Jour 1-2: Phase 1-2 (Diagnostic + Relations)
- Jour 3-4: Phase 3 (Mock Data)
- Jour 5: Review & Tests

### Semaine 2: Refactoring & Standards
- Jour 1-3: Phase 5 (Refactoring Backend)
- Jour 4-5: Phase 5 (Refactoring Frontend)

### Semaine 3: Tests & Documentation
- Jour 1-2: Phase 4 (Tests E2E)
- Jour 3: Phase 6 (Documentation)
- Jour 4-5: Phase 7 (Validation finale)

---

## 📝 NOTES IMPORTANTES

### Priorités:

1. **CRITIQUE**: Activer relations SQLAlchemy (bloque tout)
2. **HAUTE**: Créer mock data consultations/prescriptions
3. **HAUTE**: Tests E2E workflows principaux
4. **MOYENNE**: Refactoring service layer
5. **BASSE**: Documentation détaillée

### Risques Identifiés:

1. **Relations circulaires**: Attention aux imports circulaires entre modèles
2. **Performance**: Jointures multiples peuvent être lentes (utiliser indexes)
3. **Migration données**: Backup DB avant activation relations
4. **Frontend hydration**: Next.js 15 peut avoir des issues avec Zustand

### Dépendances Externes:

- Redis (optionnel, pour cache)
- PostgreSQL (production, actuellement SQLite)
- PDF generation library (prescriptions)
- Image storage (consultations photos)

---

## 🎯 PROCHAINES ÉTAPES IMMÉDIATES

### Action 1: Activer Relations (30 min)
```bash
# Modifier les 5 modèles
# Créer migration
# Tester relations
```

### Action 2: Créer Mock Consultations (45 min)
```bash
# Enrichir seed_data.py
# Exécuter script
# Vérifier données
```

### Action 3: Tester Endpoints (30 min)
```bash
# curl tests pour chaque module
# Vérifier responses
# Documenter résultats
```

---

**Dernière mise à jour**: 2025-11-14 11:30 UTC
**Responsable**: Claude AI
**Status**: 🟡 En cours - Phase 1 terminée
