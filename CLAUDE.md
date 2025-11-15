# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**DermAI** is a full-stack SaaS application for dermatology clinic management with integrated AI capabilities. It enables dermatologists to analyze images, verify drug interactions, and interpret lab results efficiently.

Stack: **Next.js 15 (React 19) + FastAPI + PostgreSQL + Redis** with Claude 3.5 Sonnet for AI analysis.

---

## Quick Start Commands

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev          # Start dev server on http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint check
npm run lint:fix     # Auto-fix linting issues
npm run type-check   # TypeScript type checking
npm run format       # Prettier formatting
npm run test         # Run Vitest unit tests
npm run test:ui      # Open Vitest UI
npm run test:coverage # Generate coverage report
npm run test:e2e     # Run Playwright E2E tests
npm run test:e2e:ui  # Interactive Playwright testing
npm run storybook    # Start Storybook at http://localhost:6006
```

### Backend (FastAPI)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Database migrations
alembic upgrade head
alembic downgrade -1

# Start API server
uvicorn app.main:app --reload   # http://localhost:8000
uvicorn app.main:app --reload --port 8001  # Alternative port

# Code quality
black app/ tests/                # Format code
flake8 app/ tests/              # Linting
mypy app/                        # Type checking
isort app/ tests/               # Sort imports

# Testing
pytest                          # Run all tests
pytest tests/test_auth.py       # Run specific test file
pytest -k "test_login"          # Run tests matching pattern
pytest -v --cov=app --cov-report=html  # Coverage report (opens as HTML)
pytest -x                       # Stop on first failure
pytest -vv --tb=short           # Detailed output
```

### Docker & Local Development
```bash
docker-compose up -d            # Start PostgreSQL + Redis
docker-compose down             # Stop services
docker-compose logs postgres    # View logs for specific service

# Database connection from CLI
psql postgresql://dermai_user:dermai_pass_dev_only@localhost:5432/dermai_db
```

### Initialize Database
```bash
cd backend
python init_db.py  # Create tables and seed initial data
```

---

## Architecture Overview

### Frontend Architecture (`frontend/src`)

```
app/                    # Next.js 15 App Router
├── (auth)/            # Authentication routes (login, register)
├── (dashboard)/       # Protected routes (patients, appointments, etc.)
├── layout.tsx         # Root layout with providers
└── page.tsx          # Landing page

components/           # UI Components
├── ui/               # Shadcn/UI components (button, dialog, form, etc.)
├── auth/             # Authentication components
├── calendar/         # Calendar and appointment features (19 files)
├── consultations/    # Consultation features
├── forms/            # Reusable form components
├── images/           # Image upload/display components
├── patients/         # Patient-related components
├── prescriptions/    # Prescription components
└── layout/           # Layout components (sidebar, header)

lib/
├── api/              # API client for backend communication
├── hooks/            # Custom React hooks (useAuth, usePatients, etc.)
├── stores/           # Zustand state management
├── utils/            # Helper utilities
└── validations/      # Zod schemas for form validation

types/                # TypeScript type definitions
styles/               # Global CSS + Tailwind
```

**Key Technologies:**
- **State Management:** Zustand (stores/) for global state
- **Data Fetching:** TanStack Query v5 (@tanstack/react-query)
- **Forms:** React Hook Form + Zod validation
- **UI Framework:** Shadcn/UI + TailwindCSS 4.0
- **Animations:** Framer Motion
- **Charts:** Recharts
- **Drag & Drop:** dnd-kit
- **Routing:** Next.js 15 App Router with protected routes

### Backend Architecture (`backend/app`)

```
api/v1/              # API endpoints
├── auth.py         # Authentication (login, register)
├── patients.py     # Patient CRUD operations
├── appointments.py # Appointment scheduling (recurring, conflicts, drag-drop)
├── consultations.py # Consultation management
├── prescriptions.py # Prescription management
└── images.py       # Image upload + AI analysis

models/             # SQLAlchemy ORM models
├── user.py         # User with roles (doctor, assistant, admin)
├── patient.py      # Patient data
├── appointment.py  # Appointments + recurrence rules
├── consultation.py # Consultation notes
├── prescription.py # Prescriptions
└── image.py        # Uploaded images with metadata

schemas/            # Pydantic validation schemas (request/response models)

core/
├── config.py       # Settings, environment variables
├── security.py     # JWT token handling, password hashing
├── logging.py      # Structured logging with Sentry integration
└── rate_limiter.py # API rate limiting

db/                 # Database session management
main.py             # FastAPI app initialization, CORS, middleware
```

**Key Technologies:**
- **ORM:** SQLAlchemy 2.0 + Alembic for migrations
- **Validation:** Pydantic v2
- **Authentication:** JWT tokens with refresh tokens
- **Rate Limiting:** slowapi
- **Monitoring:** Sentry SDK
- **Background Jobs:** Celery + APScheduler (configured but not yet used)

### Database Schema

**Core Tables:**
- `users` - Doctors, assistants, admins (with password hashing)
- `patients` - Patient demographics, medical history
- `appointments` - Scheduled appointments with recurrence support
- `consultations` - Medical consultation notes
- `prescriptions` - Drug prescriptions with interaction checking
- `images` - Uploaded dermatology images for AI analysis
- `audit_logs` - All user actions (HIPAA compliance)

**Key Features:**
- Soft deletes for GDPR compliance
- Recurrence rules stored as JSON (recurrence_rule field in appointments)
- Timestamps for audit trails

---

## Important Architectural Patterns

### API Patterns
1. **Dependency Injection** - `api/deps.py` provides current_user, db_session
2. **Versioning** - All routes under `/api/v1/`
3. **Authentication** - Bearer token in Authorization header
4. **Rate Limiting** - Per-endpoint decorators using `@limiter.limit()`
5. **Response Format** - Standard error/success responses with status codes

### Frontend Patterns
1. **Protected Routes** - Layout-based authentication checks
2. **Zustand Stores** - Persist state across components
3. **React Query** - Server state management with automatic caching
4. **Form Validation** - Zod schemas for client + server validation
5. **Type Safety** - Strict TypeScript for all components

### Key Features to Understand

**Appointment Management (Recent Focus)**
- Calendar with multiple view modes (month, week, day)
- Drag-and-drop rescheduling
- Recurring appointments with series management
- Conflict detection and suggestions
- Optimistic UI updates
- Real-time conflict detection

**AI Integration Points**
- Image analysis: `/api/v1/images/analyze` (Claude 3.5 Sonnet)
- Drug interactions: `/api/v1/prescriptions/check-interactions`
- Lab results: `/api/v1/consultations/analyze-labs`

---

## Development Guidelines

### Frontend Development
- **Use Absolute Imports:** `import { Button } from '@/components/ui/button'`
- **Component Organization:** One component per file in features/
- **Props Typing:** Always define interface for component props
- **Hooks:** Create custom hooks in `lib/hooks/` for reusable logic
- **State:** Use Zustand for global state, React Query for server state
- **Styling:** TailwindCSS + `cn()` utility for conditional classes
- **Tests:** Vitest for unit tests, Playwright for E2E tests

### Backend Development
- **Code Style:** Black formatter (90 char line length), isort for imports
- **Type Hints:** mypy enabled - all functions must have type hints
- **Async:** Use async/await for database operations
- **Error Handling:** Raise HTTPException with appropriate status codes
- **Validation:** Use Pydantic schemas for all request/response bodies
- **Logging:** Use configured logger, avoid print()
- **Testing:** pytest with asyncio mode auto

### Environment Variables
Required for development (see `.env.example`):

**Backend:**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection with password
- `SECRET_KEY` - 32-byte hex key for JWT (generate: `openssl rand -hex 32`)
- `ANTHROPIC_API_KEY` - Claude API key
- `OPENAI_API_KEY` - GPT-4o fallback

**Frontend:**
- `NEXT_PUBLIC_API_URL` - Backend API URL (e.g., http://localhost:8000)

---

## Testing Strategy

### Backend Testing
```bash
# Run all tests with coverage
pytest --cov=app --cov-report=html

# Test output: htmlcov/index.html
# Target: 80%+ coverage

# Run specific test:
pytest tests/api/test_patients.py -v
```

Configuration in `pyproject.toml`:
- Test files: `test_*.py` in `tests/` directory
- Async mode: auto (handles async functions)
- Coverage: excludes migrations, __init__.py

### Frontend Testing
- **Unit Tests:** Vitest + React Testing Library
- **E2E Tests:** Playwright
- Target coverage: 60%+

### Test Data
- Fixtures in `conftest.py`
- Faker for random data generation
- Seeded database: run `python init_db.py`

---

## Common Tasks

### Adding a New API Endpoint
1. Create Pydantic schema in `schemas/`
2. Add route in `api/v1/module.py`
3. Extract business logic to separate functions if needed
4. Add rate limiter: `@limiter.limit("10/minute")`
5. Write tests in `tests/api/test_module.py`
6. Update API documentation in docstring

### Adding a New Frontend Component
1. Create component in `components/features/` with TypeScript
2. Export from `components/index.ts` if commonly used
3. Create Zod schema in `lib/validations/` if form
4. Write Vitest unit test in `src/__tests__/`
5. Add Storybook story if UI component

### Database Migrations
```bash
# Create migration
alembic revision --autogenerate -m "description"

# Review migration file: backend/alembic/versions/

# Apply migration
alembic upgrade head

# Rollback
alembic downgrade -1
```

### Debugging
**Frontend:**
- VSCode debugger with Next.js extension
- React DevTools browser extension
- Zustand DevTools for state inspection

**Backend:**
- VSCode Python debugger
- Sentry for production errors
- Structured logging via `logger.info()`, `logger.error()`

---

## Key Project Details

### HIPAA/RGPD Compliance
- Audit logs: All user actions stored in database
- Encryption: TLS 1.3 in transit, bcrypt for passwords
- Data retention: Soft deletes with retention policies
- MFA: Structure ready, not yet fully implemented
- Role-based access: users.role field (doctor/assistant/admin)

### Performance Considerations
- Redis caching for patient searches
- Database indexes on frequently queried fields (user_id, patient_id)
- Optimistic UI updates for faster perceived performance
- Image compression before storage
- API response timeouts set appropriately

### Known Limitations/TODOs
- Mobile app (React Native) not yet implemented
- Advanced analytics dashboard incomplete
- Some background task processing (Celery) not activated
- 3rd-party drug database (RxNav) integration ready but basic
- Kantesti lab analysis integration scaffolded

---

## Git Workflow

**Branch Naming:** `feature/name` or `fix/issue-name`

**Commit Format:**
```
feat: add appointment conflict detection
fix: prevent double-booking in calendar
docs: update API documentation
```

**Before Pushing:**
- `npm run lint:fix && npm run type-check` (frontend)
- `black app/ && flake8 app/ && mypy app/` (backend)
- Run relevant tests
- Verify no console errors in dev tools

---

## Useful Commands Reference

| Task | Command |
|------|---------|
| Start everything | `docker-compose up -d && cd backend && uvicorn app.main:app --reload` (in another terminal: `cd frontend && npm run dev`) |
| Check git status | `git status` |
| View logs | `docker-compose logs -f postgres` or `docker-compose logs -f redis` |
| Reset DB | `docker-compose down -v && docker-compose up -d` then `python backend/init_db.py` |
| Type check both | `cd frontend && npm run type-check && cd ../backend && mypy app/` |
| Format all code | `cd frontend && npm run format && cd ../backend && black app/ && isort app/` |

---

## Deployment Notes

- **Frontend:** Configured for Vercel (see `next.config.ts`)
- **Backend:** Docker container ready, Kubernetes manifests in `/docs/deployment/`
- **Database:** PostgreSQL 16, must run migrations on deployment
- **Secrets:** Never commit `.env`, use environment-specific `.env` files

---

## Recent Project History

Recent commits show focus on:
- 🗓️ Calendar module refinement (recurring appointments, drag-drop, conflict detection)
- 📋 Comprehensive test coverage (backend + frontend)
- 🎨 UI/UX improvements (optimistic updates, animations)
- 📚 Documentation (testing guides, quick start)

Previous phases completed:
- Phase 1: Foundations (auth, users, DB)
- Phase 2: Core features (patients, appointments UI)
- Phase 3: Consultation management
- Phase 4: Advanced calendar with recurrence (current)

---

## Getting Help

- API Docs: `http://localhost:8000/docs` (when backend running)
- README.md: Full project overview and roadmap
- Test files: See `tests/` for usage examples
- Type definitions: Check `src/types/` for data structures

