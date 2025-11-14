# 🧪 PLAN D'ACTION - TESTS AUTOMATISÉS EXHAUSTIFS
## DermaAI - Application SAAS Cabinet Dermatologie

> **Objectif**: Mettre en place une suite de tests complète pour évaluer la robustesse, la performance, la sécurité et tous les aspects de l'application.

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble](#vue-densemble)
2. [Frontend Tests](#1-frontend-tests)
3. [Backend Tests](#2-backend-tests)
4. [Base de Données Tests](#3-base-de-données-tests)
5. [API Tests](#4-api-tests)
6. [Performance Tests](#5-performance-tests)
7. [Sécurité Tests](#6-sécurité-tests)
8. [E2E Tests](#7-e2e-tests)
9. [Infrastructure Tests](#8-infrastructure-tests)
10. [CI/CD Pipeline](#9-cicd-pipeline)
11. [Métriques & Reporting](#10-métriques--reporting)

---

## VUE D'ENSEMBLE

### Stack de Tests Proposée

```
┌─────────────────────────────────────────────────────────┐
│                    TESTS PYRAMID                         │
├─────────────────────────────────────────────────────────┤
│  E2E Tests (Playwright)                          5%     │
│  ├─ User journeys complets                              │
│  └─ Cross-browser testing                               │
├─────────────────────────────────────────────────────────┤
│  Integration Tests                               15%    │
│  ├─ API integration (Supertest)                         │
│  ├─ Database integration (Pytest)                       │
│  └─ Service integration                                 │
├─────────────────────────────────────────────────────────┤
│  Unit Tests                                      80%    │
│  ├─ Frontend (Vitest + React Testing Library)          │
│  ├─ Backend (Pytest)                                    │
│  └─ Utilities & Helpers                                 │
└─────────────────────────────────────────────────────────┘
```

### Outils & Technologies

| Catégorie | Outil | Usage |
|-----------|-------|-------|
| **Frontend Unit** | Vitest | Tests composants React |
| **Frontend E2E** | Playwright | Tests end-to-end |
| **Backend Unit** | Pytest | Tests API Python |
| **API Testing** | Supertest / HTTPie | Tests endpoints |
| **Performance** | Lighthouse CI, k6 | Performance & Load |
| **Security** | OWASP ZAP, Snyk | Sécurité & Vulnérabilités |
| **Database** | pytest-postgresql | Tests DB |
| **Coverage** | Coverage.py, c8 | Code coverage |
| **CI/CD** | GitHub Actions | Automation |
| **Reporting** | Allure, HTML Reports | Visualisation |

---

## 1. FRONTEND TESTS

### 1.1 Tests Unitaires (Vitest + React Testing Library)

**Configuration**: `frontend/vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/__tests__/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/__tests__/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        'src/types/',
      ],
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

**Setup**: `frontend/src/__tests__/setup.ts`

```typescript
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() { return [] }
  unobserve() {}
}
```

**Tests à créer**:

```
frontend/src/__tests__/
├── components/
│   ├── ui/
│   │   ├── Button.test.tsx
│   │   ├── Modal.test.tsx
│   │   ├── Table.test.tsx
│   │   ├── Toast.test.tsx
│   │   └── ThemeToggle.test.tsx
│   ├── patients/
│   │   ├── PatientCard.test.tsx
│   │   ├── SearchBar.test.tsx
│   │   └── FilterChips.test.tsx
│   └── prescriptions/
│       ├── PrescriptionTemplate.test.tsx
│       └── PrescriptionCard.test.tsx
├── hooks/
│   ├── useKeyboardShortcuts.test.ts
│   └── useTheme.test.ts
├── lib/
│   ├── api/
│   │   └── client.test.ts
│   └── theme/
│       └── utils.test.ts
└── utils/
    └── helpers.test.ts
```

**Exemple - Button.test.tsx**:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/modern'

describe('Button Component', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)
    fireEvent.click(screen.getByText('Click me'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('renders with different variants', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>)
    expect(screen.getByText('Primary')).toHaveClass('bg-gradient-to-r')

    rerender(<Button variant="ghost">Ghost</Button>)
    expect(screen.getByText('Ghost')).toHaveClass('hover:bg-mono-100')
  })

  it('shows loading spinner when loading', () => {
    render(<Button loading>Loading</Button>)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>)
    expect(screen.getByText('Disabled')).toBeDisabled()
  })

  it('renders with left icon', () => {
    render(<Button leftIcon={<span>Icon</span>}>With Icon</Button>)
    expect(screen.getByText('Icon')).toBeInTheDocument()
  })
})
```

**Scripts package.json**:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch"
  }
}
```

### 1.2 Tests d'Intégration

**API Mock**: `frontend/src/__tests__/mocks/handlers.ts`

```typescript
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/patients', () => {
    return HttpResponse.json({
      patients: [
        { id: 1, full_name: 'Test Patient', email: 'test@example.com' }
      ],
      total: 1,
      total_pages: 1,
    })
  }),

  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json()
    if (body.email === 'test@example.com') {
      return HttpResponse.json({
        access_token: 'fake-token',
        user: { id: 1, email: 'test@example.com' }
      })
    }
    return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }),
]
```

**Server Setup**: `frontend/src/__tests__/mocks/server.ts`

```typescript
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

### 1.3 Tests Accessibilité (a11y)

```typescript
import { axe, toHaveNoViolations } from 'jest-axe'
expect.extend(toHaveNoViolations)

describe('Button Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<Button>Accessible Button</Button>)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
```

---

## 2. BACKEND TESTS

### 2.1 Configuration Pytest

**Configuration**: `backend/pytest.ini`

```ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts =
    -v
    --tb=short
    --strict-markers
    --cov=app
    --cov-report=html
    --cov-report=term-missing
    --cov-fail-under=80
markers =
    unit: Unit tests
    integration: Integration tests
    slow: Slow running tests
    db: Database tests
    api: API tests
```

**Conftest**: `backend/tests/conftest.py`

```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.core.config import settings

# Test database
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="function")
def test_db():
    """Create a fresh database for each test."""
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(
        autocommit=False, autoflush=False, bind=engine
    )

    Base.metadata.create_all(bind=engine)

    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(test_db):
    """Create a test client with the test database."""
    def override_get_db():
        try:
            yield test_db
        finally:
            test_db.close()

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()

@pytest.fixture
def auth_headers(client):
    """Get authentication headers."""
    response = client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "password123"}
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture
def test_user(test_db):
    """Create a test user."""
    from app.models.user import User
    from app.core.security import get_password_hash

    user = User(
        email="test@example.com",
        hashed_password=get_password_hash("password123"),
        full_name="Test User",
        is_active=True,
    )
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    return user
```

**Structure des tests**:

```
backend/tests/
├── conftest.py
├── unit/
│   ├── test_auth.py
│   ├── test_patients.py
│   ├── test_appointments.py
│   ├── test_prescriptions.py
│   └── test_consultations.py
├── integration/
│   ├── test_patient_flow.py
│   ├── test_consultation_workflow.py
│   └── test_prescription_generation.py
├── api/
│   ├── test_endpoints_patients.py
│   ├── test_endpoints_auth.py
│   └── test_endpoints_analytics.py
└── performance/
    ├── test_db_queries.py
    └── test_response_times.py
```

**Exemple - test_patients.py**:

```python
import pytest
from app.models.patient import Patient

@pytest.mark.unit
def test_create_patient(test_db):
    """Test patient creation."""
    patient = Patient(
        first_name="John",
        last_name="Doe",
        email="john@example.com",
        phone="+33612345678",
        date_of_birth="1990-01-01",
        gender="male"
    )
    test_db.add(patient)
    test_db.commit()
    test_db.refresh(patient)

    assert patient.id is not None
    assert patient.full_name == "John Doe"
    assert patient.age > 0

@pytest.mark.api
def test_list_patients(client, auth_headers):
    """Test listing patients endpoint."""
    response = client.get("/api/patients", headers=auth_headers)

    assert response.status_code == 200
    data = response.json()
    assert "patients" in data
    assert "total" in data
    assert isinstance(data["patients"], list)

@pytest.mark.api
def test_create_patient_endpoint(client, auth_headers):
    """Test create patient endpoint."""
    patient_data = {
        "first_name": "Jane",
        "last_name": "Smith",
        "email": "jane@example.com",
        "phone": "+33687654321",
        "date_of_birth": "1995-05-15",
        "gender": "female"
    }

    response = client.post(
        "/api/patients",
        json=patient_data,
        headers=auth_headers
    )

    assert response.status_code == 201
    data = response.json()
    assert data["first_name"] == "Jane"
    assert data["id"] is not None

@pytest.mark.api
def test_create_patient_validation(client, auth_headers):
    """Test patient creation with invalid data."""
    invalid_data = {
        "first_name": "",  # Empty name
        "email": "invalid-email",  # Invalid email
    }

    response = client.post(
        "/api/patients",
        json=invalid_data,
        headers=auth_headers
    )

    assert response.status_code == 422

@pytest.mark.integration
def test_patient_full_workflow(client, auth_headers):
    """Test complete patient workflow."""
    # 1. Create patient
    patient_data = {
        "first_name": "Test",
        "last_name": "Patient",
        "email": "test.patient@example.com",
        "date_of_birth": "1985-03-20",
        "gender": "male"
    }

    create_response = client.post(
        "/api/patients",
        json=patient_data,
        headers=auth_headers
    )
    assert create_response.status_code == 201
    patient_id = create_response.json()["id"]

    # 2. Get patient
    get_response = client.get(
        f"/api/patients/{patient_id}",
        headers=auth_headers
    )
    assert get_response.status_code == 200
    assert get_response.json()["email"] == patient_data["email"]

    # 3. Update patient
    update_data = {"phone": "+33699887766"}
    update_response = client.put(
        f"/api/patients/{patient_id}",
        json=update_data,
        headers=auth_headers
    )
    assert update_response.status_code == 200
    assert update_response.json()["phone"] == update_data["phone"]

    # 4. Delete patient
    delete_response = client.delete(
        f"/api/patients/{patient_id}",
        headers=auth_headers
    )
    assert delete_response.status_code == 204
```

**Scripts**:

```bash
# pytest.ini already configured above
# Run tests
pytest
pytest -v --cov=app
pytest -m unit
pytest -m integration
pytest --cov-report=html
```

---

## 3. BASE DE DONNÉES TESTS

### 3.1 Tests de Migrations

**Test**: `backend/tests/db/test_migrations.py`

```python
import pytest
from alembic.config import Config
from alembic import command

def test_migrations_up_down():
    """Test that migrations can be applied and reversed."""
    alembic_cfg = Config("alembic.ini")

    # Upgrade to head
    command.upgrade(alembic_cfg, "head")

    # Downgrade one revision
    command.downgrade(alembic_cfg, "-1")

    # Upgrade again
    command.upgrade(alembic_cfg, "head")

def test_no_duplicate_migrations():
    """Ensure no duplicate migration versions."""
    alembic_cfg = Config("alembic.ini")
    # Check migrations folder for duplicates
    # ...implementation...
```

### 3.2 Tests de Performance DB

**Test**: `backend/tests/db/test_query_performance.py`

```python
import pytest
import time
from sqlalchemy import text

@pytest.mark.slow
def test_patient_query_performance(test_db):
    """Test patient query performance."""
    # Create 1000 test patients
    for i in range(1000):
        patient = Patient(
            first_name=f"Patient{i}",
            last_name=f"Test{i}",
            email=f"patient{i}@test.com",
            date_of_birth="1990-01-01"
        )
        test_db.add(patient)
    test_db.commit()

    # Measure query time
    start = time.time()
    result = test_db.query(Patient).filter(
        Patient.email.like("%patient5%")
    ).all()
    end = time.time()

    execution_time = end - start
    assert execution_time < 0.1  # Should be under 100ms
    assert len(result) > 0

@pytest.mark.db
def test_index_effectiveness(test_db):
    """Test that indexes are being used."""
    # Check EXPLAIN output
    query = text("EXPLAIN SELECT * FROM patients WHERE email = 'test@example.com'")
    result = test_db.execute(query)

    explain_output = result.fetchall()
    # Verify index is being used (not SEQUENTIAL SCAN)
    assert any("Index Scan" in str(row) for row in explain_output)
```

### 3.3 Tests d'Intégrité

```python
@pytest.mark.db
def test_foreign_key_constraints(test_db):
    """Test that foreign key constraints are enforced."""
    # Try to create consultation with non-existent patient
    with pytest.raises(Exception):
        consultation = Consultation(
            patient_id=99999,  # Non-existent
            diagnosis="Test"
        )
        test_db.add(consultation)
        test_db.commit()

@pytest.mark.db
def test_cascade_delete(test_db, test_user):
    """Test cascade deletes work correctly."""
    # Create patient with consultations
    patient = Patient(...)
    test_db.add(patient)
    test_db.commit()

    consultation = Consultation(patient_id=patient.id, ...)
    test_db.add(consultation)
    test_db.commit()

    # Delete patient
    test_db.delete(patient)
    test_db.commit()

    # Consultation should also be deleted
    assert test_db.query(Consultation).filter_by(
        patient_id=patient.id
    ).count() == 0
```

---

## 4. API TESTS

### 4.1 Tests Endpoints Complets

**Configuration**: `backend/tests/api/test_comprehensive_api.py`

```python
import pytest

class TestPatientAPI:
    """Comprehensive patient API tests."""

    def test_list_patients_pagination(self, client, auth_headers):
        """Test pagination works correctly."""
        response = client.get(
            "/api/patients?page=1&page_size=10",
            headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "patients" in data
        assert "total_pages" in data
        assert len(data["patients"]) <= 10

    def test_list_patients_search(self, client, auth_headers):
        """Test search functionality."""
        response = client.get(
            "/api/patients?search=john",
            headers=auth_headers
        )
        assert response.status_code == 200
        # Results should match search

    def test_create_patient_duplicate_email(self, client, auth_headers):
        """Test duplicate email prevention."""
        patient_data = {"email": "duplicate@test.com", ...}

        # First creation succeeds
        response1 = client.post("/api/patients", json=patient_data, headers=auth_headers)
        assert response1.status_code == 201

        # Second creation fails
        response2 = client.post("/api/patients", json=patient_data, headers=auth_headers)
        assert response2.status_code == 400

    def test_update_patient_partial(self, client, auth_headers):
        """Test partial update (PATCH)."""
        # Create patient first
        create_response = client.post("/api/patients", json={...}, headers=auth_headers)
        patient_id = create_response.json()["id"]

        # Partial update
        update_response = client.patch(
            f"/api/patients/{patient_id}",
            json={"phone": "+33611111111"},
            headers=auth_headers
        )
        assert update_response.status_code == 200
        assert update_response.json()["phone"] == "+33611111111"

    def test_delete_patient_cascade(self, client, auth_headers):
        """Test deletion with related records."""
        # Create patient with consultations
        # Delete should fail or cascade properly
        # ...
```

### 4.2 Tests de Sécurité API

```python
class TestAPISecurity:
    """API security tests."""

    def test_unauthorized_access(self, client):
        """Test endpoints require authentication."""
        response = client.get("/api/patients")
        assert response.status_code == 401

    def test_invalid_token(self, client):
        """Test invalid token is rejected."""
        headers = {"Authorization": "Bearer invalid-token"}
        response = client.get("/api/patients", headers=headers)
        assert response.status_code == 401

    def test_expired_token(self, client):
        """Test expired tokens are rejected."""
        # Create expired token
        # ...
        headers = {"Authorization": f"Bearer {expired_token}"}
        response = client.get("/api/patients", headers=headers)
        assert response.status_code == 401

    def test_sql_injection_prevention(self, client, auth_headers):
        """Test SQL injection is prevented."""
        malicious_input = "'; DROP TABLE patients; --"
        response = client.get(
            f"/api/patients?search={malicious_input}",
            headers=auth_headers
        )
        # Should not crash, should sanitize input
        assert response.status_code in [200, 400]

    def test_xss_prevention(self, client, auth_headers):
        """Test XSS prevention."""
        xss_payload = "<script>alert('XSS')</script>"
        patient_data = {
            "first_name": xss_payload,
            ...
        }
        response = client.post("/api/patients", json=patient_data, headers=auth_headers)
        # Should sanitize or escape
        if response.status_code == 201:
            data = response.json()
            assert "<script>" not in data["first_name"]
```

---

## 5. PERFORMANCE TESTS

### 5.1 Load Testing avec k6

**Installation**:
```bash
# macOS
brew install k6

# Linux
sudo apt-get install k6

# Windows
choco install k6
```

**Script**: `performance/load-test.js`

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m', target: 50 },    // Stay at 50 users
    { duration: '30s', target: 100 },  // Ramp up to 100 users
    { duration: '2m', target: 100 },   // Stay at 100 users
    { duration: '30s', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'],    // Error rate should be below 1%
  },
};

const BASE_URL = 'http://localhost:8000';
const AUTH_TOKEN = 'your-test-token';

export default function () {
  const headers = {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
  };

  // Test 1: List patients
  let res = http.get(`${BASE_URL}/api/patients?page=1&page_size=20`, { headers });
  check(res, {
    'list patients status is 200': (r) => r.status === 200,
    'list patients response time < 500ms': (r) => r.timings.duration < 500,
  });
  errorRate.add(res.status !== 200);

  sleep(1);

  // Test 2: Get patient details
  res = http.get(`${BASE_URL}/api/patients/1`, { headers });
  check(res, {
    'get patient status is 200': (r) => r.status === 200,
    'get patient response time < 200ms': (r) => r.timings.duration < 200,
  });
  errorRate.add(res.status !== 200);

  sleep(1);

  // Test 3: Search patients
  res = http.get(`${BASE_URL}/api/patients?search=john`, { headers });
  check(res, {
    'search patients status is 200': (r) => r.status === 200,
  });
  errorRate.add(res.status !== 200);

  sleep(1);
}
```

**Exécution**:
```bash
k6 run performance/load-test.js
k6 run --vus 100 --duration 5m performance/load-test.js
```

### 5.2 Lighthouse CI (Frontend Performance)

**Configuration**: `.lighthouserc.json`

```json
{
  "ci": {
    "collect": {
      "url": [
        "http://localhost:3000",
        "http://localhost:3000/dashboard",
        "http://localhost:3000/dashboard/patients"
      ],
      "numberOfRuns": 3,
      "settings": {
        "preset": "desktop"
      }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "categories:accessibility": ["error", {"minScore": 0.9}],
        "categories:best-practices": ["error", {"minScore": 0.9}],
        "categories:seo": ["error", {"minScore": 0.9}]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

**Script package.json**:
```json
{
  "scripts": {
    "lighthouse": "lhci autorun",
    "lighthouse:desktop": "lighthouse http://localhost:3000 --preset=desktop --view",
    "lighthouse:mobile": "lighthouse http://localhost:3000 --preset=mobile --view"
  }
}
```

### 5.3 Tests de Charge Base de Données

```python
import pytest
import time
from concurrent.futures import ThreadPoolExecutor

@pytest.mark.slow
def test_concurrent_patient_creation(test_db):
    """Test concurrent patient creation."""
    def create_patient(index):
        patient = Patient(
            first_name=f"Patient{index}",
            last_name="Test",
            email=f"patient{index}@test.com",
            date_of_birth="1990-01-01"
        )
        test_db.add(patient)
        test_db.commit()
        return patient.id

    start = time.time()
    with ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(create_patient, range(100)))
    end = time.time()

    assert len(results) == 100
    assert end - start < 10  # Should complete in under 10 seconds
```

---

## 6. SÉCURITÉ TESTS

### 6.1 OWASP ZAP Automated Scan

**Script**: `security/zap-scan.sh`

```bash
#!/bin/bash

# Pull ZAP Docker image
docker pull owasp/zap2docker-stable

# Run baseline scan
docker run -v $(pwd)/security:/zap/wrk/:rw \
  -t owasp/zap2docker-stable zap-baseline.py \
  -t http://localhost:3000 \
  -r zap-report.html \
  -w zap-report.md

# Run full scan (more comprehensive, takes longer)
docker run -v $(pwd)/security:/zap/wrk/:rw \
  -t owasp/zap2docker-stable zap-full-scan.py \
  -t http://localhost:3000 \
  -r zap-full-report.html
```

### 6.2 Snyk Security Scan

```bash
# Install Snyk
npm install -g snyk

# Authenticate
snyk auth

# Test frontend dependencies
cd frontend && snyk test

# Test backend dependencies
cd backend && snyk test --file=requirements.txt

# Monitor for vulnerabilities
snyk monitor
```

### 6.3 Tests de Pénétration

```python
class TestSecurityPenetration:
    """Penetration testing scenarios."""

    def test_rate_limiting(self, client):
        """Test rate limiting is enforced."""
        # Make 100 requests quickly
        responses = []
        for _ in range(100):
            res = client.get("/api/patients")
            responses.append(res.status_code)

        # Should get 429 (Too Many Requests) at some point
        assert 429 in responses

    def test_password_brute_force_protection(self, client):
        """Test protection against brute force attacks."""
        # Try login with wrong password multiple times
        for _ in range(10):
            client.post("/api/auth/login", json={
                "email": "test@example.com",
                "password": "wrong-password"
            })

        # Account should be locked or rate limited
        response = client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "correct-password"
        })
        assert response.status_code in [429, 423]  # Too Many Requests or Locked

    def test_csrf_protection(self, client):
        """Test CSRF protection."""
        # POST without CSRF token should fail
        response = client.post("/api/patients", json={...})
        # Should require CSRF token
```

---

## 7. E2E TESTS

### 7.1 Playwright Configuration

**Configuration**: `frontend/playwright.config.ts`

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
})
```

**Tests**: `frontend/e2e/patient-workflow.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Patient Management Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('should create a new patient', async ({ page }) => {
    // Navigate to patients page
    await page.click('text=Patients')
    await expect(page).toHaveURL('/dashboard/patients')

    // Click new patient button
    await page.click('text=Nouveau patient')

    // Fill form
    await page.fill('[name="first_name"]', 'John')
    await page.fill('[name="last_name"]', 'Doe')
    await page.fill('[name="email"]', 'john.doe@example.com')
    await page.fill('[name="phone"]', '+33612345678')
    await page.fill('[name="date_of_birth"]', '1990-01-15')
    await page.selectOption('[name="gender"]', 'male')

    // Submit
    await page.click('button[type="submit"]')

    // Verify success
    await expect(page.locator('text=Patient créé avec succès')).toBeVisible()
    await expect(page.locator('text=John Doe')).toBeVisible()
  })

  test('should search and filter patients', async ({ page }) => {
    await page.goto('/dashboard/patients')

    // Search
    await page.fill('[placeholder*="Rechercher"]', 'John')
    await page.waitForTimeout(500)

    // Verify results
    const results = page.locator('[data-testid="patient-card"]')
    await expect(results).toContainText('John')

    // Filter by active
    await page.click('text=Actifs')
    await expect(page.locator('[data-testid="active-badge"]')).toBeVisible()
  })

  test('should update patient information', async ({ page }) => {
    await page.goto('/dashboard/patients')

    // Click first patient
    await page.click('[data-testid="patient-card"]:first-child')

    // Click edit
    await page.click('text=Modifier')

    // Update phone
    await page.fill('[name="phone"]', '+33699887766')
    await page.click('button:has-text("Enregistrer")')

    // Verify update
    await expect(page.locator('text=+33699887766')).toBeVisible()
  })

  test('should delete patient', async ({ page }) => {
    await page.goto('/dashboard/patients')

    // Click more options
    await page.click('[aria-label="More options"]:first-child')
    await page.click('text=Supprimer')

    // Confirm deletion
    await page.click('button:has-text("Confirmer")')

    // Verify deletion
    await expect(page.locator('text=Patient supprimé')).toBeVisible()
  })
})

test.describe('Prescription Printing', () => {
  test('should preview and print prescription', async ({ page }) => {
    await page.goto('/dashboard/prescriptions')

    // Click print on first prescription
    await page.click('button:has-text("Imprimer"):first-child')

    // Verify modal opens
    await expect(page.locator('text=Prévisualisation Ordonnance')).toBeVisible()

    // Verify prescription content
    await expect(page.locator('text=ORD-')).toBeVisible()
    await expect(page.locator('text=Dr.')).toBeVisible()

    // Test fullscreen toggle
    await page.click('[title="Plein écran"]')

    // Close modal
    await page.click('[aria-label="Close modal"]')
    await expect(page.locator('text=Prévisualisation')).not.toBeVisible()
  })
})

test.describe('Dark Mode', () => {
  test('should toggle dark mode', async ({ page }) => {
    await page.goto('/dashboard')

    // Click theme toggle
    await page.click('[aria-label="Toggle theme"]')

    // Verify dark mode applied
    await expect(page.locator('html')).toHaveClass(/dark/)

    // Toggle back
    await page.click('[aria-label="Toggle theme"]')
    await expect(page.locator('html')).not.toHaveClass(/dark/)
  })
})

test.describe('Keyboard Shortcuts', () => {
  test('should open command palette with Cmd+K', async ({ page }) => {
    await page.goto('/dashboard')

    // Press Cmd+K (Mac) or Ctrl+K (Windows/Linux)
    await page.keyboard.press('Meta+k')

    // Verify command palette opens
    await expect(page.locator('text=Rechercher des actions')).toBeVisible()

    // Type to search
    await page.keyboard.type('patients')

    // Verify filtered results
    await expect(page.locator('text=Liste des patients')).toBeVisible()

    // Press Escape to close
    await page.keyboard.press('Escape')
    await expect(page.locator('text=Rechercher des actions')).not.toBeVisible()
  })
})
```

**Exécution**:
```bash
npx playwright test
npx playwright test --ui
npx playwright test --project=chromium
npx playwright test --headed
npx playwright show-report
```

---

## 8. INFRASTRUCTURE TESTS

### 8.1 Tests de Démarrage

**Script**: `tests/infra/test_startup.sh`

```bash
#!/bin/bash

echo "Testing infrastructure startup..."

# Test 1: Backend starts successfully
echo "Starting backend..."
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

sleep 5

# Check if backend is running
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend started successfully"
else
    echo "❌ Backend failed to start"
    kill $BACKEND_PID
    exit 1
fi

# Test 2: Frontend starts successfully
echo "Starting frontend..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

sleep 10

# Check if frontend is running
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend started successfully"
else
    echo "❌ Frontend failed to start"
    kill $BACKEND_PID $FRONTEND_PID
    exit 1
fi

# Test 3: Database connection
echo "Testing database connection..."
if cd ../backend && python -c "
from app.database import engine
try:
    engine.connect()
    print('✅ Database connection successful')
except Exception as e:
    print(f'❌ Database connection failed: {e}')
    exit(1)
"; then
    echo "Database test passed"
else
    kill $BACKEND_PID $FRONTEND_PID
    exit 1
fi

# Test 4: API health check
echo "Testing API health..."
HEALTH_RESPONSE=$(curl -s http://localhost:8000/health)
if echo $HEALTH_RESPONSE | grep -q "ok"; then
    echo "✅ API health check passed"
else
    echo "❌ API health check failed"
    kill $BACKEND_PID $FRONTEND_PID
    exit 1
fi

# Cleanup
kill $BACKEND_PID $FRONTEND_PID
echo "All infrastructure tests passed! 🎉"
```

### 8.2 Docker Tests

```bash
#!/bin/bash

echo "Testing Docker setup..."

# Build images
docker-compose build

# Start services
docker-compose up -d

# Wait for services to be ready
sleep 15

# Test backend
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend container running"
else
    echo "❌ Backend container failed"
    exit 1
fi

# Test frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend container running"
else
    echo "❌ Frontend container failed"
    exit 1
fi

# Test database
if docker-compose exec -T db psql -U postgres -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database container running"
else
    echo "❌ Database container failed"
    exit 1
fi

# Cleanup
docker-compose down

echo "Docker tests passed! 🐳"
```

---

## 9. CI/CD PIPELINE

### 9.1 GitHub Actions

**Configuration**: `.github/workflows/tests.yml`

```yaml
name: Tests CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  # Backend Tests
  backend-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: dermaai_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Cache Python dependencies
        uses: actions/cache@v3
        with:
          path: ~/.cache/pip
          key: ${{ runner.os }}-pip-${{ hashFiles('backend/requirements.txt') }}

      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install pytest pytest-cov pytest-asyncio

      - name: Run migrations
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/dermaai_test
        run: |
          cd backend
          alembic upgrade head

      - name: Run tests with coverage
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/dermaai_test
        run: |
          cd backend
          pytest --cov=app --cov-report=xml --cov-report=html

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage.xml
          flags: backend

      - name: Archive test results
        uses: actions/upload-artifact@v3
        with:
          name: backend-test-results
          path: backend/htmlcov/

  # Frontend Tests
  frontend-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        run: |
          cd frontend
          npm ci

      - name: Run linter
        run: |
          cd frontend
          npm run lint

      - name: Type check
        run: |
          cd frontend
          npm run type-check

      - name: Run unit tests
        run: |
          cd frontend
          npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/coverage-final.json
          flags: frontend

      - name: Archive test results
        uses: actions/upload-artifact@v3
        with:
          name: frontend-test-results
          path: frontend/coverage/

  # E2E Tests
  e2e-tests:
    runs-on: ubuntu-latest
    needs: [backend-tests, frontend-tests]

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd frontend
          npm ci
          npx playwright install --with-deps

      - name: Start services
        run: |
          docker-compose up -d
          sleep 15

      - name: Run Playwright tests
        run: |
          cd frontend
          npx playwright test

      - name: Upload Playwright report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: frontend/playwright-report/

      - name: Stop services
        if: always()
        run: docker-compose down

  # Security Scan
  security-scan:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Run Snyk Security Scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

      - name: Run OWASP ZAP Scan
        uses: zaproxy/action-baseline@v0.7.0
        with:
          target: 'http://localhost:3000'

  # Performance Tests
  performance-tests:
    runs-on: ubuntu-latest
    needs: [backend-tests, frontend-tests]

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Start services
        run: |
          docker-compose up -d
          sleep 15

      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6

      - name: Run load tests
        run: k6 run performance/load-test.js

      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli
          cd frontend
          lhci autorun

      - name: Stop services
        if: always()
        run: docker-compose down

  # Build Check
  build-check:
    runs-on: ubuntu-latest
    needs: [backend-tests, frontend-tests, e2e-tests]

    steps:
      - uses: actions/checkout@v3

      - name: Build frontend
        run: |
          cd frontend
          npm ci
          npm run build

      - name: Test backend build
        run: |
          cd backend
          pip install -r requirements.txt
          python -c "from app.main import app; print('Backend build successful')"
```

### 9.2 Pre-commit Hooks

**Configuration**: `.pre-commit-config.yaml`

```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
      - id: check-json
      - id: check-merge-conflict

  - repo: https://github.com/psf/black
    rev: 23.3.0
    hooks:
      - id: black
        args: [--line-length=100]
        files: ^backend/

  - repo: https://github.com/pycqa/flake8
    rev: 6.0.0
    hooks:
      - id: flake8
        args: [--max-line-length=100]
        files: ^backend/

  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v8.44.0
    hooks:
      - id: eslint
        files: ^frontend/.*\.[jt]sx?$
        args: [--fix]

  - repo: https://github.com/pre-commit/mirrors-prettier
    rev: v3.0.0
    hooks:
      - id: prettier
        files: ^frontend/
```

---

## 10. MÉTRIQUES & REPORTING

### 10.1 Code Coverage Dashboard

**Backend Coverage Report**:
```bash
cd backend
pytest --cov=app --cov-report=html --cov-report=term
open htmlcov/index.html
```

**Frontend Coverage Report**:
```bash
cd frontend
npm run test:coverage
open coverage/index.html
```

### 10.2 Test Results Dashboard

**Allure Report** (Comprehensive test reporting):

```bash
# Install Allure
npm install -g allure-commandline

# Generate report
allure generate ./allure-results --clean -o ./allure-report
allure open ./allure-report
```

### 10.3 Performance Metrics

**K6 Cloud Dashboard**:
- Visualize load test results
- Compare performance over time
- Identify bottlenecks

**Lighthouse CI Server**:
- Track performance scores
- Monitor regressions
- Set performance budgets

---

## 📊 MÉTRIQUES DE SUCCÈS

### Objectifs de Coverage

| Type | Target | Minimum |
|------|--------|---------|
| Unit Tests | 90% | 80% |
| Integration Tests | 80% | 70% |
| E2E Critical Paths | 100% | 90% |
| API Endpoints | 100% | 95% |

### Objectifs de Performance

| Métrique | Target | Maximum |
|----------|--------|---------|
| Page Load (Desktop) | < 2s | 3s |
| Page Load (Mobile) | < 3s | 5s |
| API Response Time (p95) | < 200ms | 500ms |
| Database Query Time | < 50ms | 100ms |
| Lighthouse Performance Score | > 90 | 80 |

### Objectifs de Sécurité

- Zero critical vulnerabilities
- Zero high-severity vulnerabilities
- OWASP Top 10 compliance
- Regular security audits

---

## 🚀 ÉTAPES DE MISE EN ŒUVRE

### Phase 1: Setup Initial (Semaine 1)
- [ ] Configure Vitest + React Testing Library
- [ ] Configure Pytest + fixtures
- [ ] Setup CI/CD pipeline basique
- [ ] Premiers tests unitaires (Button, utils)

### Phase 2: Tests Unitaires (Semaines 2-3)
- [ ] Tests composants UI (100%)
- [ ] Tests hooks personnalisés
- [ ] Tests API client
- [ ] Tests backend models & services

### Phase 3: Tests d'Intégration (Semaine 4)
- [ ] Tests API endpoints
- [ ] Tests database operations
- [ ] Tests workflows complets

### Phase 4: E2E Tests (Semaine 5)
- [ ] Configure Playwright
- [ ] Tests user journeys critiques
- [ ] Tests cross-browser

### Phase 5: Performance & Sécurité (Semaine 6)
- [ ] Setup k6 load tests
- [ ] Configure Lighthouse CI
- [ ] OWASP ZAP scans
- [ ] Snyk vulnerability scans

### Phase 6: Optimisation & Documentation (Semaine 7)
- [ ] Optimiser suite de tests
- [ ] Améliorer coverage
- [ ] Documenter procédures
- [ ] Former l'équipe

---

## 📝 COMMANDES RAPIDES

```bash
# Backend
cd backend
pytest                          # Run all tests
pytest -v                       # Verbose
pytest -m unit                  # Unit tests only
pytest -m integration           # Integration tests only
pytest --cov=app               # With coverage
pytest -k test_patient         # Specific test pattern

# Frontend
cd frontend
npm test                        # Run tests
npm run test:ui                # Visual test runner
npm run test:coverage          # With coverage
npx playwright test            # E2E tests
npx playwright test --ui       # E2E with UI

# Performance
k6 run performance/load-test.js
npm run lighthouse

# Security
snyk test
docker run -t owasp/zap2docker-stable zap-baseline.py -t http://localhost:3000

# CI/CD
git commit -m "test: add patient tests"  # Triggers pre-commit hooks
git push                        # Triggers GitHub Actions
```

---

## 🎯 CONCLUSION

Ce plan fournit une approche exhaustive pour tester tous les aspects de DermaAI:

✅ **Frontend**: Composants, hooks, intégration
✅ **Backend**: API, services, models, database
✅ **Performance**: Load testing, page speed, optimization
✅ **Sécurité**: Vulnérabilités, pénétration, OWASP
✅ **E2E**: User journeys complets, cross-browser
✅ **Infrastructure**: Démarrage, Docker, configurations
✅ **CI/CD**: Automation complète, reporting

**Résultat attendu**: Une application robuste, performante et sécurisée avec une confiance maximale dans le code déployé.
