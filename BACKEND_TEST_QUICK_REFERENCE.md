# DermAI Backend - Quick Reference for Test Coverage

## File Structure

```
backend/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── auth.py              ✓ 5 endpoints
│   │   │   ├── patients.py          ✓ 6 endpoints
│   │   │   ├── appointments.py      ✓ 11 endpoints
│   │   │   ├── consultations.py     ✓ 6 endpoints
│   │   │   ├── prescriptions.py     ✓ 8 endpoints
│   │   │   └── images.py            ✓ 6 endpoints
│   │   ├── deps.py                  ✓ 4 dependencies
│   │   └── utils.py                 ✓ 6 utilities
│   ├── core/
│   │   ├── security.py              ✓ 6 security functions
│   │   ├── config.py                ✓ Settings class
│   │   ├── logging.py               ✓ 2 logging functions
│   │   └── rate_limiter.py          ✓ Rate limiter class
│   ├── models/
│   │   ├── user.py                  ✓ User model
│   │   ├── patient.py               ✓ Patient model
│   │   ├── appointment.py           ✓ Appointment model
│   │   ├── consultation.py          ✓ Consultation model
│   │   ├── prescription.py          ✓ Prescription model
│   │   └── image.py                 ✓ ConsultationImage model
│   ├── services/
│   │   └── appointments.py          ✓ AppointmentService
│   ├── schemas/                     ✓ 6 schema files
│   └── main.py                      ✓ FastAPI app setup
└── tests/
    └── api/
        └── v1/
            └── test_appointments.py  ✗ 99 lines (incomplete)
```

## Endpoint Summary (45 Total)

### Auth (5)
- POST /auth/register
- POST /auth/login
- GET /auth/me
- POST /auth/refresh
- POST /auth/logout

### Patients (6)
- GET /patients
- POST /patients
- GET /patients/{id}
- PUT /patients/{id}
- DELETE /patients/{id}
- GET /patients/{id}/stats

### Appointments (11)
- GET /appointments
- POST /appointments
- GET /appointments/{id}
- PUT /appointments/{id}
- PATCH /appointments/{id}/status
- DELETE /appointments/{id}
- POST /appointments/recurring
- GET /appointments/recurring/{series_id}
- DELETE /appointments/recurring/{series_id}
- POST /appointments/check-conflicts
- GET /appointments/stats/overview

### Consultations (6)
- GET /consultations
- POST /consultations
- GET /consultations/{id}
- PUT /consultations/{id}
- DELETE /consultations/{id}
- GET /consultations/patient/{patient_id}/history

### Prescriptions (8)
- GET /prescriptions
- POST /prescriptions
- GET /prescriptions/{id}
- PUT /prescriptions/{id}
- DELETE /prescriptions/{id}
- POST /prescriptions/{id}/mark-printed
- POST /prescriptions/{id}/mark-delivered
- GET /prescriptions/{id}/print-data

### Images (6)
- POST /images
- GET /images/consultation/{id}
- GET /images/patient/{id}
- GET /images/{id}
- PUT /images/{id}
- DELETE /images/{id}

## Models (7 Total)

1. **User** (46 lines)
   - Fields: email, hashed_password, full_name, role, is_active, is_verified, phone, mfa_enabled, mfa_secret
   - Roles: ADMIN, DOCTOR, SECRETARY, ASSISTANT

2. **Patient** (~50 lines)
   - Fields: identification_*, first_name, last_name, date_of_birth, gender, phone, email, address, city, postal_code, country, insurance_number, medical_history, allergies, doctor_id, is_deleted, deleted_at

3. **Appointment** (~100 lines)
   - Fields: patient_id, doctor_id, start_time, end_time, type, status, reason, notes, diagnosis, is_first_visit, reminder_sent, recurrence_rule (JSON), recurring_series_id
   - Types: CONSULTATION, FOLLOW_UP, PROCEDURE, EMERGENCY
   - Statuses: SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW

4. **Consultation** (~50 lines)
   - Fields: patient_id, doctor_id, consultation_date, consultation_time, chief_complaint, diagnosis, treatment_plan, notes, follow_up_required, images_taken, biopsy_performed, is_deleted, deleted_at

5. **Prescription** (~80 lines)
   - Fields: patient_id, doctor_id, consultation_id, prescription_date, valid_until, control_date, medications (JSON), instructions, notes, is_printed, is_delivered

6. **ConsultationImage** (~40 lines)
   - Fields: consultation_id, patient_id, image_data (base64), filename, file_size, mime_type, notes, uploaded_at

7. **BaseModel** (Inherited by all)
   - Fields: id (PK), created_at, updated_at

## Core Functions (40+ Total)

### Security (6)
- verify_password()
- get_password_hash()
- create_access_token()
- create_refresh_token()
- decode_token()
- verify_token_type()

### Config (1)
- Settings class with 50+ configuration variables

### Logging (2)
- setup_logging()
- log_audit_event()

### Rate Limiting (2)
- NoOpLimiter class
- rate_limit_handler()

### Dependencies (4)
- get_current_user()
- get_current_active_user()
- get_current_admin()
- get_current_doctor()

### Utilities (6)
- check_patient_ownership()
- check_consultation_ownership()
- check_prescription_ownership()
- check_image_ownership()
- get_mock_appointments()

### Services (10+)
- AppointmentService.create_appointment()
- AppointmentService.get_appointment()
- AppointmentService.list_appointments()
- AppointmentService.update_appointment()
- AppointmentService.delete_appointment()
- AppointmentService.create_recurring_series()
- AppointmentService.get_series_instances()
- AppointmentService.delete_recurring_series()
- AppointmentService.check_conflicts()
- AppointmentService.get_appointment_stats()

## Test Coverage Status

| Module | Endpoints | Functions | Current | Target | Gap |
|--------|-----------|-----------|---------|--------|-----|
| auth.py | 5 | - | 0% | 85% | 25 tests |
| patients.py | 6 | - | 0% | 85% | 30 tests |
| appointments.py | 11 | - | 5% | 85% | 60 tests |
| consultations.py | 6 | - | 0% | 85% | 25 tests |
| prescriptions.py | 8 | - | 0% | 85% | 30 tests |
| images.py | 6 | - | 0% | 85% | 20 tests |
| security.py | - | 6 | 0% | 80% | 20 tests |
| config.py | - | 1 | 0% | 80% | 15 tests |
| logging.py | - | 2 | 0% | 80% | 15 tests |
| rate_limiter.py | - | 2 | 0% | 80% | 10 tests |
| deps.py | - | 4 | 0% | 90% | 20 tests |
| utils.py | - | 6 | 0% | 90% | 15 tests |
| services/appointments.py | - | 10+ | 0% | 85% | 60 tests |
| **TOTAL** | **45+** | **40+** | **<5%** | **80%+** | **185 tests** |

## Key Testing Priorities

### Tier 1 - Critical (Do First)
1. Authentication endpoints (register, login, refresh, logout)
2. Security functions (password hashing, token generation)
3. Patient CRUD endpoints
4. Authorization checks (all ownership utilities)

### Tier 2 - High Value
1. Appointment endpoints (single + recurring)
2. Consultation endpoints
3. AppointmentService methods
4. Dependencies (get_current_user variants)

### Tier 3 - Supporting
1. Prescription endpoints
2. Image endpoints
3. Configuration loading
4. Logging/audit events
5. Rate limiting

## Example Test Structure

```python
# tests/api/v1/test_auth.py
import pytest
from fastapi.testclient import TestClient

@pytest.fixture
def client():
    """FastAPI test client"""
    return TestClient(app)

@pytest.fixture
def test_user(db):
    """Create test user"""
    user = User(email="test@doctor.com", ...)
    db.add(user)
    db.commit()
    return user

class TestAuthRegister:
    def test_register_success(self, client):
        response = client.post("/api/v1/auth/register", json={
            "email": "new@doctor.com",
            "password": "Test123!",
            "full_name": "Test Doctor",
            "role": "doctor"
        })
        assert response.status_code == 201
        assert response.json()["email"] == "new@doctor.com"
    
    def test_register_duplicate_email(self, client, test_user):
        response = client.post("/api/v1/auth/register", json={
            "email": test_user.email,
            "password": "Test123!",
            "full_name": "Another Doctor",
            "role": "doctor"
        })
        assert response.status_code == 400

class TestAuthLogin:
    def test_login_success(self, client, test_user):
        response = client.post("/api/v1/auth/login", data={
            "username": test_user.email,
            "password": "Test123!"
        })
        assert response.status_code == 200
        assert "access_token" in response.json()
```

## Key Test Categories

### 1. Happy Path (60% of tests)
- Successful operations with valid inputs
- Standard CRUD operations
- Normal authentication flow

### 2. Validation & Error Cases (20% of tests)
- Invalid input data
- Constraint violations (duplicate email, etc.)
- Missing required fields
- Type mismatches

### 3. Authorization & Security (15% of tests)
- Access control (doctor can only see own patients)
- Role-based access (doctor vs admin)
- Token validation
- Ownership verification

### 4. Edge Cases (5% of tests)
- Boundary conditions (max/min values)
- Pagination edge cases
- Date/time calculations
- Concurrency/race conditions

## Database for Tests

Use SQLite in-memory for speed:
```python
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///./test.db"
# Or: "sqlite:///:memory:" for in-memory (faster)
```

## Important Endpoints to Test

### Must Test (Critical Business Logic)
1. POST /auth/login - Authentication core
2. POST /patients - Patient creation with unique constraints
3. POST /appointments - Conflict detection logic
4. POST /appointments/recurring - RFC 5545 parsing
5. POST /consultations - Patient validation
6. POST /prescriptions - Medication JSON handling

### Must Test (Authorization)
1. GET /patients/{id} - Patient ownership check
2. PUT /patients/{id} - Doctor can only edit own patients
3. DELETE /consultations/{id} - Soft delete compliance
4. POST /images - Consultation ownership via relationship
5. GET /prescriptions - Doctor only sees own prescriptions

### Edge Cases to Test
1. /appointments/check-conflicts - Overlapping time slots
2. /appointments/recurring - Complex RFC 5545 rules
3. /patients?min_age=X&max_age=Y - Age calculation
4. /consultations/patient/{id}/history - Sorting and pagination
5. /prescriptions/{id}/print-data - Data formatting for printing

