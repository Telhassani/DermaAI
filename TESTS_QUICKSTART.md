# 🚀 DÉMARRAGE RAPIDE - TESTS AUTOMATISÉS

Ce guide vous permet de démarrer rapidement avec la suite de tests de DermaAI.

## 📋 Prérequis

### Frontend
```bash
cd frontend
npm install --save-dev \
  vitest \
  @vitest/ui \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jsdom
```

### Backend
```bash
cd backend
pip install pytest pytest-cov pytest-asyncio httpx
```

### E2E (Optionnel)
```bash
cd frontend
npx playwright install --with-deps
```

## 🏃 Lancer les Tests

### Frontend

```bash
cd frontend

# Lancer tous les tests
npm test

# Mode watch (recommandé pour développement)
npm run test:watch

# Avec UI interactive
npm run test:ui

# Avec coverage
npm run test:coverage

# Ouvrir le rapport de coverage
open coverage/index.html
```

### Backend

```bash
cd backend

# Lancer tous les tests
pytest

# Avec coverage
pytest --cov=app

# Tests unitaires seulement
pytest -m unit

# Tests d'intégration seulement
pytest -m integration

# Verbose output
pytest -v

# Ouvrir le rapport de coverage
open htmlcov/index.html
```

### E2E (Playwright)

```bash
cd frontend

# Lancer tous les tests E2E
npx playwright test

# Mode UI (recommandé)
npx playwright test --ui

# Browser spécifique
npx playwright test --project=chromium

# Mode headed (voir le browser)
npx playwright test --headed

# Voir le rapport
npx playwright show-report
```

## 📊 Structure des Tests

```
DermaAI/
├── frontend/
│   ├── src/
│   │   └── __tests__/
│   │       ├── setup.ts                    # Configuration globale
│   │       └── components/
│   │           └── ui/
│   │               └── modern/
│   │                   └── Button.test.tsx # Exemple de test
│   ├── e2e/                                # Tests Playwright
│   ├── vitest.config.ts                    # Config Vitest
│   └── playwright.config.ts                # Config Playwright
│
├── backend/
│   ├── tests/
│   │   ├── conftest.py                     # Fixtures globales
│   │   ├── unit/
│   │   ├── integration/
│   │   └── api/
│   └── pytest.ini                          # Config Pytest
│
└── .github/
    └── workflows/
        └── tests-ci.yml                    # CI/CD GitHub Actions
```

## 📝 Écrire un Premier Test

### Frontend (Vitest)

```typescript
// src/__tests__/components/MyComponent.test.tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import MyComponent from '@/components/MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### Backend (Pytest)

```python
# tests/unit/test_example.py
import pytest

def test_addition():
    """Test simple addition."""
    assert 1 + 1 == 2

@pytest.mark.unit
def test_patient_creation(test_db):
    """Test patient creation."""
    from app.models.patient import Patient

    patient = Patient(
        first_name="John",
        last_name="Doe",
        email="john@example.com"
    )
    test_db.add(patient)
    test_db.commit()

    assert patient.id is not None
    assert patient.full_name == "John Doe"
```

## 🎯 Bonnes Pratiques

### Frontend

1. **Utiliser les queries recommandées** (par ordre de préférence):
   - `getByRole`
   - `getByLabelText`
   - `getByPlaceholderText`
   - `getByText`
   - `getByTestId` (dernier recours)

2. **Tester le comportement, pas l'implémentation**:
   ```typescript
   // ✅ Bon
   expect(screen.getByRole('button')).toBeDisabled()

   // ❌ Mauvais
   expect(component.state.disabled).toBe(true)
   ```

3. **Utiliser user-event pour les interactions**:
   ```typescript
   import userEvent from '@testing-library/user-event'

   const user = userEvent.setup()
   await user.click(screen.getByRole('button'))
   ```

### Backend

1. **Utiliser des fixtures pour le setup**:
   ```python
   @pytest.fixture
   def test_user(test_db):
       user = User(email="test@example.com")
       test_db.add(user)
       test_db.commit()
       return user
   ```

2. **Isoler les tests**:
   - Chaque test doit être indépendant
   - Utiliser des transactions pour rollback

3. **Nommer clairement les tests**:
   ```python
   def test_user_can_login_with_valid_credentials():
       # ...
   ```

## 🔍 Debugging

### Frontend

```bash
# Mode debug avec --inspect-brk
node --inspect-brk ./node_modules/.bin/vitest

# Voir les tests en cours
npm run test:ui
```

### Backend

```bash
# Mode debug
pytest --pdb  # Entre en debugger sur erreur

# Voir le stdout
pytest -s

# Tests spécifiques
pytest tests/unit/test_patients.py::test_create_patient
```

## 📈 Coverage Reports

Les rapports de coverage sont générés automatiquement:

- **Frontend**: `frontend/coverage/index.html`
- **Backend**: `backend/htmlcov/index.html`

**Objectifs de coverage**:
- Unit Tests: 80%+
- Critical Paths: 100%

## 🤖 CI/CD

Les tests s'exécutent automatiquement sur:
- Push vers `main` ou `develop`
- Pull Requests

Voir les résultats: [GitHub Actions](.github/workflows/tests-ci.yml)

## 📚 Ressources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Pytest Documentation](https://docs.pytest.org/)
- [Playwright Documentation](https://playwright.dev/)
- [Plan Complet](./PLAN_TESTS_AUTOMATISES.md)

## 🆘 Problèmes Courants

### "Cannot find module '@testing-library/jest-dom'"

```bash
npm install --save-dev @testing-library/jest-dom
```

### "Database connection failed"

Vérifier que PostgreSQL est lancé:
```bash
docker-compose up -d postgres
```

### "Tests passent localement mais échouent en CI"

Vérifier les variables d'environnement dans `.github/workflows/tests-ci.yml`

---

**Besoin d'aide?** Consultez le [Plan Complet des Tests](./PLAN_TESTS_AUTOMATISES.md)
