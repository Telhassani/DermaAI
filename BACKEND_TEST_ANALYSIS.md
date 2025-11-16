# DermAI Backend - Comprehensive API Endpoints & Test Coverage Analysis

## Executive Summary

The DermAI backend is a FastAPI application with 6 main API modules providing 45+ endpoints across 5 domains. Currently, only **1 test file exists** with minimal coverage. To achieve 80%+ test coverage, **150+ additional tests** are needed.

**Current Status:**
- API Endpoints: 45+ routes
- Test Files: 1 (test_appointments.py - incomplete)
- Estimated Tests Needed: 150-200 tests
- Current Coverage: <5%

---

## Part 1: API Endpoints Analysis

### Module 1: Authentication (`auth.py`) - 5 Endpoints

| HTTP Method | Path | Function | Key Logic | Dependencies |
|---|---|---|---|---|
| POST | `/auth/register` | `register` | User registration, email validation, password hashing | User model, get_password_hash, rate limiter (5/hour) |
| POST | `/auth/login` | `login` | Email/password verification, JWT token generation | User model, verify_password, create tokens, rate limiter (10/hour) |
| GET | `/auth/me` | `get_current_user_info` | Get authenticated user data | get_current_active_user dependency |
| POST | `/auth/refresh` | `refresh_token` | Refresh expired access token | decode_token, verify_token_type, create_access_token, rate limiter (20/hour) |
| POST | `/auth/logout` | `logout` | Logout and clear httpOnly cookies | get_current_active_user dependency |

**Key Business Logic:**
- Password hashing with bcrypt
- JWT token generation (access + refresh tokens)
- httpOnly secure cookie handling
- Rate limiting to prevent brute force
- Audit event logging for security events
- Email uniqueness validation

**Security Functions Tested:**
- `verify_password()` - Password verification
- `get_password_hash()` - Password hashing
- `create_access_token()` - Access token generation
- `create_refresh_token()` - Refresh token generation
- `decode_token()` - Token validation
- `verify_token_type()` - Token type verification

---

### Module 2: Patients (`patients.py`) - 6 Endpoints

| HTTP Method | Path | Function | Key Logic | Dependencies |
|---|---|---|---|---|
| GET | `/patients` | `list_patients` | List patients with pagination, filtering, sorting | Patient model, pagination, authorization check |
| POST | `/patients` | `create_patient` | Create new patient, validate identification uniqueness | Patient model, email/insurance/ID validation |
| GET | `/patients/{patient_id}` | `get_patient` | Get patient by ID with authorization | check_patient_ownership utility |
| PUT | `/patients/{patient_id}` | `update_patient` | Update patient data, re-validate unique fields | Patient model, authorization check |
| DELETE | `/patients/{patient_id}` | `delete_patient` | Soft delete for HIPAA compliance | Patient model, soft delete flag |
| GET | `/patients/{patient_id}/stats` | `get_patient_stats` | Get patient statistics (TODO: aggregations) | Patient model, related data queries |

**Key Business Logic:**
- Multi-field search (name, email, phone, insurance, ID)
- Age filtering (calculated from date_of_birth)
- Soft delete for GDPR/HIPAA compliance
- Authorization: Doctors can only see their own patients
- Unique constraint validation (identification_number, email, insurance_number)
- Mock data fallback for development

**Authorization Functions:**
- `check_patient_ownership()` - Verify doctor owns patient

---

### Module 3: Appointments (`appointments.py`) - 11 Endpoints

| HTTP Method | Path | Function | Key Logic | Dependencies |
|---|---|---|---|---|
| GET | `/appointments` | `list_appointments` | List appointments with 8+ filters, pagination | AppointmentService, complex query building |
| POST | `/appointments` | `create_appointment` | Create single appointment with conflict check | AppointmentService.create_appointment, conflict detection |
| GET | `/appointments/{appointment_id}` | `get_appointment` | Get appointment by ID with authorization | AppointmentService.get_appointment |
| PUT | `/appointments/{appointment_id}` | `update_appointment` | Update appointment (not past/completed) | AppointmentService.update_appointment |
| PATCH | `/appointments/{appointment_id}/status` | `update_appointment_status` | Update status only (simplified) | AppointmentService.update_appointment |
| DELETE | `/appointments/{appointment_id}` | `delete_appointment` | Delete single appointment | AppointmentService.delete_appointment |
| POST | `/appointments/recurring` | `create_recurring_appointment_series` | Create recurring series with RFC 5545 rules | AppointmentService.create_recurring_series |
| GET | `/appointments/recurring/{series_id}` | `get_recurring_series_instances` | Get all instances of recurring series | AppointmentService.get_series_instances |
| DELETE | `/appointments/recurring/{series_id}` | `delete_recurring_series` | Delete series (cascade or parent-only) | AppointmentService.delete_recurring_series |
| POST | `/appointments/check-conflicts` | `check_appointment_conflicts` | Check scheduling conflicts and return alternatives | AppointmentService.check_conflicts |
| GET | `/appointments/stats/overview` | `get_appointment_stats` | Get appointment statistics | AppointmentService.get_appointment_stats |

**Key Business Logic:**
- Conflict detection with alternative slot suggestions
- Recurring appointment series with RFC 5545 support
- Complex filtering (patient, doctor, type, status, date range, first visit, recurring)
- Appointment status lifecycle management
- Optimistic UI updates support
- Mock data fallback

**Service Functions:**
- `AppointmentService.create_appointment()`
- `AppointmentService.create_recurring_series()`
- `AppointmentService.check_conflicts()`
- `AppointmentService.delete_recurring_series()`
- `AppointmentService.get_appointment_stats()`
- `RecurrenceValidator` utility

---

### Module 4: Consultations (`consultations.py`) - 6 Endpoints

| HTTP Method | Path | Function | Key Logic | Dependencies |
|---|---|---|---|---|
| GET | `/consultations` | `list_consultations` | List consultations with pagination, filtering | Consultation model, eager loading (N+1 prevention) |
| POST | `/consultations` | `create_consultation` | Create new consultation, set doctor_id | Consultation model, verify patient exists |
| GET | `/consultations/{consultation_id}` | `get_consultation` | Get consultation by ID with authorization | check_consultation_ownership utility |
| PUT | `/consultations/{consultation_id}` | `update_consultation` | Update consultation fields | Consultation model, authorization check |
| DELETE | `/consultations/{consultation_id}` | `delete_consultation` | Soft delete for HIPAA compliance | Consultation model, soft delete flag |
| GET | `/consultations/patient/{patient_id}/history` | `get_patient_consultation_history` | Get patient consultation history paginated | Consultation model, eager loading, authorization |

**Key Business Logic:**
- Consultation history sorted by date (most recent first)
- Eager loading to prevent N+1 query problems
- Patient name enrichment from relationship
- Soft delete for compliance
- Authorization: Doctors only see own consultations
- Mock data fallback

**Authorization Functions:**
- `check_consultation_ownership()` - Verify doctor owns consultation
- `check_patient_ownership()` - Verify patient belongs to doctor

---

### Module 5: Prescriptions (`prescriptions.py`) - 8 Endpoints

| HTTP Method | Path | Function | Key Logic | Dependencies |
|---|---|---|---|---|
| GET | `/prescriptions` | `list_prescriptions` | List prescriptions with pagination, filtering | Prescription model, authorization check |
| POST | `/prescriptions` | `create_prescription` | Create prescription, validate consultation/patient match | Prescription model, medication dict conversion |
| GET | `/prescriptions/{prescription_id}` | `get_prescription` | Get prescription by ID with authorization | check_prescription_ownership utility |
| PUT | `/prescriptions/{prescription_id}` | `update_prescription` | Update prescription with medication dict handling | Prescription model, authorization check |
| DELETE | `/prescriptions/{prescription_id}` | `delete_prescription` | Delete prescription | Prescription model, authorization check |
| POST | `/prescriptions/{prescription_id}/mark-printed` | `mark_prescription_printed` | Mark prescription as printed | Prescription model, authorization check |
| POST | `/prescriptions/{prescription_id}/mark-delivered` | `mark_prescription_delivered` | Mark prescription as delivered | Prescription model, authorization check |
| GET | `/prescriptions/{prescription_id}/print-data` | `get_prescription_print_data` | Get prescription formatted for printing | Patient/User model joins, formatting logic |

**Key Business Logic:**
- Medications stored as JSON array in database
- Prescription validity tracking (valid_until field)
- Print tracking (is_printed, is_delivered flags)
- Control date for follow-up (control_date field)
- Consultation validation (patient must match)
- Authorization: Doctors only see own prescriptions
- Print data formatting with patient/doctor info
- Mock data fallback

**Authorization Functions:**
- `check_prescription_ownership()` - Verify doctor owns prescription
- `check_consultation_ownership()` - Verify consultation exists

---

### Module 6: Images (`images.py`) - 6 Endpoints

| HTTP Method | Path | Function | Key Logic | Dependencies |
|---|---|---|---|---|
| POST | `/images` | `upload_image` | Upload consultation image, validate consultation ownership | ConsultationImage model, base64 handling |
| GET | `/images/consultation/{consultation_id}` | `get_consultation_images` | Get images for consultation with pagination | ConsultationImage model, authorization |
| GET | `/images/patient/{patient_id}` | `get_patient_images` | Get all images for patient with pagination | ConsultationImage model, patient authorization |
| GET | `/images/{image_id}` | `get_image` | Get specific image with authorization | check_image_ownership utility |
| PUT | `/images/{image_id}` | `update_image` | Update image notes field | ConsultationImage model, authorization |
| DELETE | `/images/{image_id}` | `delete_image` | Delete image | ConsultationImage model, authorization |

**Key Business Logic:**
- Base64 image data storage
- MIME type validation
- File size tracking
- Consultation association
- Patient-level image grouping
- Authorization: Doctors only see own patient images
- Pagination support

**Authorization Functions:**
- `check_image_ownership()` - Verify doctor owns image via consultation

---

## Part 2: Models Analysis

### 7 Database Models (683 total lines)

#### User Model (`user.py`) - 46 lines
```
Attributes:
- id: Primary key (auto-increment)
- email: Unique, indexed
- hashed_password: bcrypt hash
- full_name: User name
- role: ADMIN, DOCTOR, SECRETARY, ASSISTANT (Enum)
- is_active: Account active flag
- is_verified: Email verified flag
- phone: Contact number
- mfa_enabled: Multi-factor auth flag
- mfa_secret: TOTP secret (for future MFA)
- created_at, updated_at: Timestamps (from BaseModel)

Properties:
- is_admin: Check if admin
- is_doctor: Check if doctor
- can_prescribe: Check if can create prescriptions
```

#### Patient Model (`patient.py`) - TBD
Relationships:
- doctor_id: Foreign key to User
- Soft delete support (is_deleted, deleted_at)
- Identification validation
- Gender enum
- Medical history, allergies tracking

#### Appointment Model (`appointment.py`) - 100+ lines
```
Attributes:
- patient_id: FK to Patient
- doctor_id: FK to User
- start_time: Indexed for queries
- end_time: End time
- type: CONSULTATION, FOLLOW_UP, PROCEDURE, EMERGENCY (Enum)
- status: SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW (Enum)
- reason: Visit reason
- notes: Doctor notes
- diagnosis: Diagnosis made
- is_first_visit: Boolean flag
- reminder_sent: Reminder tracking
- recurrence_rule: JSON for RFC 5545 rules
- recurring_series_id: Parent series ID
- created_at, updated_at: Timestamps
```

#### Consultation Model (`consultation.py`) - TBD
- doctor_id, patient_id: Foreign keys
- consultation_date, consultation_time: Timestamps
- chief_complaint, diagnosis, treatment_plan: Medical data
- follow_up_required, images_taken, biopsy_performed: Procedure tracking
- Soft delete support

#### Prescription Model (`prescription.py`) - TBD
- doctor_id, patient_id, consultation_id: Foreign keys
- prescription_date: Date issued
- valid_until: Expiration date
- control_date: Follow-up date
- medications: JSON array of medication objects
- is_printed, is_delivered: Status flags
- instructions, notes: Text fields

#### ConsultationImage Model (`image.py`) - TBD
- consultation_id, patient_id: Foreign keys
- image_data: Base64 encoded image
- filename, file_size: File metadata
- mime_type: Image type
- notes: User notes
- uploaded_at: Timestamp

---

## Part 3: Core Modules Analysis

### Security Module (`core/security.py`) - 6 Functions

| Function | Purpose | Test Coverage Needed |
|---|---|---|
| `verify_password()` | Compare plain text with bcrypt hash | Hash matching, mismatch cases |
| `get_password_hash()` | Hash password with bcrypt | Hash generation, consistency |
| `create_access_token()` | Generate JWT access token | Token encoding, expiration, custom expiry |
| `create_refresh_token()` | Generate JWT refresh token (7-day expiry) | Token encoding, "refresh" type flag |
| `decode_token()` | Validate and decode JWT | Valid tokens, expired tokens, invalid signatures |
| `verify_token_type()` | Check token type (access vs refresh) | Type matching, default behavior |

**Test Coverage Gaps:**
- Edge cases: very long passwords, special characters
- Token expiration timing
- Token signature tampering
- Algorithm mismatch

### Configuration Module (`core/config.py`) - Settings Class

| Setting Category | Variables | Test Coverage Needed |
|---|---|---|
| Application | PROJECT_NAME, VERSION, ENVIRONMENT, DEBUG, API_V1_PREFIX | Environment loading, defaults |
| Database | DATABASE_URL | Connection string parsing |
| Redis | REDIS_URL | Connection string parsing |
| Security | SECRET_KEY, ALGORITHM, token expiry | Validation, defaults |
| CORS | ALLOWED_ORIGINS, ALLOWED_HOSTS | Parsing from JSON string |
| AI APIs | ANTHROPIC_API_KEY, OPENAI_API_KEY, KANTESTI_API_KEY | Optional fields, None handling |
| Email | SMTP_* settings | Configuration loading |
| File Storage | UPLOAD_DIR, MAX_UPLOAD_SIZE_MB, AWS_* | S3 config parsing |
| Monitoring | SENTRY_DSN, LOG_LEVEL | Optional fields |
| Rate Limiting | RATE_LIMIT_PER_MINUTE, RATE_LIMIT_PER_HOUR | Rate limit values |
| HIPAA | HIPAA_AUDIT_ENABLED, DATA_RETENTION_DAYS | Compliance settings |

**Test Coverage Gaps:**
- .env file loading
- Invalid configuration values
- Missing required fields
- JSON parsing of ALLOWED_ORIGINS

### Logging Module (`core/logging.py`) - 2 Functions

| Function | Purpose | Test Coverage Needed |
|---|---|---|
| `setup_logging()` | Configure root logger, console handler, file handler, audit logger | Logger creation, directory creation, handler attachment |
| `log_audit_event()` | Log HIPAA-compliant audit events | Audit log creation, JSON formatting, disabled when HIPAA_AUDIT_ENABLED=False |

**Test Coverage Gaps:**
- Log directory creation
- Handler attachment
- Audit log JSON formatting
- Disabled audit logging
- Log level configuration

### Rate Limiter Module (`core/rate_limiter.py`) - 1 Class + 1 Handler

| Component | Purpose | Test Coverage Needed |
|---|---|---|
| `NoOpLimiter` | No-op limiter for development mode | Development mode limiter behavior |
| `limiter` | slowapi Limiter for production | Production mode rate limiting |
| `rate_limit_handler()` | Custom error response for rate limit exceeded | 429 status code, JSON response format |

**Test Coverage Gaps:**
- Development vs production mode switching
- Rate limit error responses
- Custom error handler formatting

### API Dependencies (`api/deps.py`) - 4 Dependency Functions

| Function | Purpose | Test Coverage Needed |
|---|---|---|
| `get_current_user()` | Extract and validate user from JWT token | Valid token, invalid token, missing user, demo user fallback |
| `get_current_active_user()` | Verify user is active | Active user, inactive user |
| `get_current_admin()` | Verify user has admin role | Admin user, non-admin user |
| `get_current_doctor()` | Verify user has doctor or admin role | Doctor, admin, non-doctor users |

**Test Coverage Gaps:**
- Token validation failures
- User not found in database
- Demo user creation for development
- Role-based authorization
- Invalid token formats

### API Utilities (`api/utils.py`) - 6 Utility Functions

| Function | Purpose | Test Coverage Needed |
|---|---|---|
| `check_patient_ownership()` | Verify doctor owns patient (404 or 403) | Patient found, not found, authorization |
| `check_consultation_ownership()` | Verify doctor owns consultation (404 or 403) | Consultation found, not found, authorization |
| `check_prescription_ownership()` | Verify doctor owns prescription (404 or 403) | Prescription found, not found, authorization |
| `check_image_ownership()` | Verify doctor owns image via consultation | Image found, not found, authorization |
| `get_mock_appointments()` | Generate mock appointment data | Mock data generation, recurring patterns |

**Test Coverage Gaps:**
- All authorization checks (404 vs 403 responses)
- Mock data validity
- Database error handling with mock fallback

---

## Part 4: Service Layer Analysis

### AppointmentService Class (`services/appointments.py`)

#### CRUD Operations
| Method | Purpose | Test Coverage Needed |
|---|---|---|
| `create_appointment()` | Create single appointment | Appointment creation, validation, error cases |
| `get_appointment()` | Retrieve appointment by ID | Found, not found cases |
| `list_appointments()` | List with filters and pagination | Filtering, sorting, pagination, total count |
| `update_appointment()` | Update appointment fields | Partial updates, validation |
| `delete_appointment()` | Delete appointment | Single deletion, error handling |

#### Recurring Operations
| Method | Purpose | Test Coverage Needed |
|---|---|---|
| `create_recurring_series()` | Create recurring appointment instances | RFC 5545 parsing, instance generation, series linking |
| `get_series_instances()` | Get all instances of recurring series | Pagination, total count |
| `delete_recurring_series()` | Delete series (cascade or parent-only) | Cascade deletion, parent-only deletion |

#### Advanced Features
| Method | Purpose | Test Coverage Needed |
|---|---|---|
| `check_conflicts()` | Detect scheduling conflicts | Overlapping times, available slots, exclusions |
| `get_appointment_stats()` | Get statistics by status/period | Aggregation, filtering |

**Test Coverage Gaps:**
- All service methods have 0% test coverage
- ~200+ tests needed for complete coverage

---

## Part 5: Test Coverage Gap Analysis

### Currently Tested
- test_appointments.py exists but is incomplete (only 99 lines, mostly fixtures)

### Not Tested (0% coverage)
1. **Authentication Endpoints** (5 endpoints, 0 tests)
   - Register: email validation, password hashing, duplicate handling
   - Login: credential validation, token generation, inactive accounts
   - Logout: cookie clearing, audit logging
   - Refresh: token validation, type checking
   - Me: user info retrieval

2. **Patient Endpoints** (6 endpoints, 0 tests)
   - List: pagination, filtering, sorting, authorization
   - Create: validation, unique constraints, mock data
   - Get: authorization, 404 handling
   - Update: field updates, re-validation
   - Delete: soft delete
   - Stats: aggregation queries

3. **Appointment Endpoints** (11 endpoints, ~5% coverage)
   - Single CRUD: create, read, update, delete
   - Recurring: series creation, instance retrieval, cascade delete
   - Conflict checking: overlap detection, alternatives
   - Statistics: status aggregation

4. **Consultation Endpoints** (6 endpoints, 0 tests)
   - List: pagination, filtering, eager loading
   - Create: patient validation
   - Get: authorization
   - Update: field updates
   - Delete: soft delete
   - History: pagination, sorting

5. **Prescription Endpoints** (8 endpoints, 0 tests)
   - CRUD operations
   - Print/delivery tracking
   - Print data formatting
   - Medication JSON handling

6. **Image Endpoints** (6 endpoints, 0 tests)
   - Upload: base64 handling
   - List: pagination, consultation/patient filtering
   - Get/Update: authorization
   - Delete: cleanup

7. **Security Functions** (6 functions, 0 tests)
   - Password hashing/verification
   - Token generation/validation
   - Token type verification

8. **Configuration** (1 class, 0 tests)
   - Settings loading
   - Environment variable parsing
   - Defaults and validation

9. **Logging** (2 functions, 0 tests)
   - Logger setup
   - Audit event logging

10. **Rate Limiting** (1 class + 1 handler, 0 tests)
    - Development mode limiter
    - Rate limit error handling

11. **Dependencies** (4 functions, 0 tests)
    - User extraction from token
    - Active user validation
    - Role-based access (admin, doctor)
    - Demo user creation

12. **Utilities** (6 functions, 0 tests)
    - Patient/consultation/prescription/image ownership
    - Authorization checks
    - Mock data generation

---

## Part 6: Testing Strategy & Recommendations

### Testing Framework Stack
```
pytest                          # Test runner
pytest-asyncio                  # Async test support
sqlalchemy (sqlite in-memory)   # Test database
fastapi.testclient             # API testing
```

### Test Categories

#### 1. Unit Tests (120+ tests)
- Security functions: 20 tests
- Configuration loading: 15 tests
- Logging/audit: 15 tests
- Service layer methods: 70+ tests

#### 2. Integration Tests (80+ tests)
- Auth endpoints: 15 tests
- Patient CRUD: 15 tests
- Appointment CRUD + recurring: 25 tests
- Consultation CRUD: 15 tests
- Prescription CRUD: 15 tests
- Image CRUD: 10 tests
- Database transactions: 10 tests

#### 3. Authorization Tests (30+ tests)
- Patient ownership: 5 tests
- Consultation ownership: 5 tests
- Prescription ownership: 5 tests
- Image ownership: 5 tests
- Role-based access (doctor, admin): 10 tests

#### 4. Edge Case Tests (20+ tests)
- Token expiration
- Rate limiting
- Soft delete queries
- Pagination boundaries
- Conflict detection edge cases

### Test Fixtures Needed
```python
# Database
- test_db: In-memory SQLite database
- Base.metadata setup/teardown

# Users
- test_doctor: Doctor user
- test_admin: Admin user
- test_secretary: Secretary user

# Data
- test_patient: Patient record
- test_appointment: Single appointment
- test_consultation: Consultation record
- test_prescription: Prescription with medications
- test_image: Consultation image

# Authentication
- auth_headers: Bearer token headers
- admin_headers: Admin user token
- doctor_headers: Doctor user token

# Utilities
- client: FastAPI TestClient
```

### Coverage Targets

```
Target: 80%+ overall coverage

By module:
- app/api/v1/*.py:        85%+ (all endpoints tested)
- app/core/*.py:          80%+ (all functions tested)
- app/models/*.py:        100% (model creation only)
- app/schemas/*.py:       80%+ (validation tested)
- app/services/*.py:      85%+ (business logic tested)
- app/utils.py:          90%+ (all utilities tested)
- app/api/deps.py:       90%+ (all dependencies tested)
```

### High-Priority Test Files to Create

```
1. tests/api/v1/test_auth.py                    (50+ tests)
2. tests/api/v1/test_patients.py                (40+ tests)
3. tests/api/v1/test_consultations.py           (30+ tests)
4. tests/api/v1/test_prescriptions.py           (30+ tests)
5. tests/api/v1/test_images.py                  (25+ tests)
6. tests/core/test_security.py                  (20+ tests)
7. tests/core/test_config.py                    (15+ tests)
8. tests/core/test_logging.py                   (15+ tests)
9. tests/api/test_deps.py                       (20+ tests)
10. tests/api/test_utils.py                      (20+ tests)
11. tests/services/test_appointments.py          (50+ tests)
12. tests/conftest.py                            (Shared fixtures)
```

---

## Part 7: Dependency Mapping for Comprehensive Testing

### Auth Endpoint Dependencies
```
POST /register:
  ├─ User model
  ├─ get_password_hash() → pwd_context.hash()
  ├─ db.query().filter().first()
  ├─ log_audit_event()
  └─ Rate limiter (5/hour)

POST /login:
  ├─ User model
  ├─ OAuth2PasswordRequestForm
  ├─ verify_password() → pwd_context.verify()
  ├─ create_access_token() → jwt.encode()
  ├─ create_refresh_token() → jwt.encode()
  ├─ log_audit_event()
  └─ Rate limiter (10/hour)

POST /refresh:
  ├─ decode_token() → jwt.decode()
  ├─ verify_token_type()
  ├─ create_access_token()
  ├─ create_refresh_token()
  ├─ log_audit_event()
  └─ Rate limiter (20/hour)
```

### Patient Endpoint Dependencies
```
GET /patients:
  ├─ Patient model
  ├─ SQLAlchemy filtering (or_, and_)
  ├─ Age calculation from date_of_birth
  ├─ Pagination (offset, limit)
  ├─ Sorting (asc/desc)
  └─ get_current_active_user dependency

POST /patients:
  ├─ Patient model
  ├─ Unique constraint validation (3 fields)
  ├─ get_current_doctor dependency
  ├─ log_audit_event()
  └─ Status 201

PUT /patients/{id}:
  ├─ check_patient_ownership()
  ├─ Patient model update
  ├─ Re-validate unique fields
  ├─ get_current_doctor dependency
  └─ log_audit_event()

DELETE /patients/{id}:
  ├─ check_patient_ownership()
  ├─ Soft delete (is_deleted=True, deleted_at=now)
  ├─ get_current_doctor dependency
  └─ log_audit_event()
```

### Appointment Endpoint Dependencies (Complex)
```
POST /appointments:
  ├─ AppointmentService.create_appointment()
  ├─ AppointmentService.check_conflicts()
  │  ├─ Query overlapping appointments
  │  ├─ Find available slots
  │  └─ Return suggestions
  ├─ Patient model validation
  ├─ User (doctor) model validation
  ├─ Appointment model creation
  ├─ get_current_active_user dependency
  └─ log_audit_event()

POST /appointments/recurring:
  ├─ AppointmentService.create_recurring_series()
  │  ├─ RecurrenceValidator
  │  ├─ RFC 5545 rule parsing
  │  ├─ Generate instances
  │  └─ Link with recurring_series_id
  ├─ Patient/Doctor validation
  ├─ Multiple Appointment creations
  └─ log_audit_event()

POST /appointments/check-conflicts:
  ├─ AppointmentService.check_conflicts()
  ├─ Doctor validation
  ├─ Time range validation
  ├─ Return ConflictResponse with alternatives
  └─ get_current_active_user dependency
```

---

## Summary Table

| Category | Files | Endpoints | Functions | Current Tests | Tests Needed |
|----------|-------|-----------|-----------|---|---|
| Auth | 1 | 5 | - | 0 | 25 |
| Patients | 1 | 6 | - | 0 | 30 |
| Appointments | 1 | 11 | - | 5 | 60 |
| Consultations | 1 | 6 | - | 0 | 25 |
| Prescriptions | 1 | 8 | - | 0 | 30 |
| Images | 1 | 6 | - | 0 | 20 |
| Security | 1 | - | 6 | 0 | 20 |
| Config | 1 | - | 1 | 0 | 15 |
| Logging | 1 | - | 2 | 0 | 15 |
| Rate Limiter | 1 | - | 1 | 0 | 10 |
| Dependencies | 1 | - | 4 | 0 | 20 |
| Utilities | 1 | - | 6 | 0 | 15 |
| Services | 1 | - | 10+ | 0 | 60 |
| **TOTAL** | **15** | **45+** | **40+** | **5** | **185** |

---

## Recommendations

### Phase 1: Foundation (Weeks 1-2)
1. Set up pytest configuration and fixtures
2. Create conftest.py with reusable fixtures
3. Test all security/core functions (55 tests)
4. Test all dependencies and utilities (55 tests)

### Phase 2: API Endpoints (Weeks 3-4)
1. Test auth endpoints (25 tests)
2. Test patient endpoints (30 tests)
3. Test consultation endpoints (25 tests)

### Phase 3: Complex Features (Weeks 5-6)
1. Test appointment endpoints including recurring (60 tests)
2. Test prescription endpoints (30 tests)
3. Test image endpoints (20 tests)

### Phase 4: Services & Integration (Week 7)
1. Test service layer methods (60 tests)
2. End-to-end integration tests
3. Coverage reporting and refinement

