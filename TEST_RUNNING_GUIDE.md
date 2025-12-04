# Test Running Guide

Quick reference for running tests in the DermAI project.

## Backend Tests

### Prerequisites
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Run All Tests
```bash
# Basic run
pytest

# With verbose output
pytest -v

# With detailed output and short traceback
pytest -vv --tb=short
```

### Run with Coverage
```bash
# Generate HTML coverage report
pytest --cov=app --cov-report=html

# View coverage in browser
open htmlcov/index.html

# Terminal coverage report with missing lines
pytest --cov=app --cov-report=term-missing
```

### Run Specific Tests
```bash
# Run single test file
pytest tests/api/v1/test_patients.py

# Run single test class
pytest tests/api/v1/test_patients.py::TestPatientCreate

# Run single test
pytest tests/api/v1/test_patients.py::TestPatientCreate::test_create_patient_success

# Run tests matching pattern
pytest -k "test_create" -v
```

### Run Tests in Parallel
```bash
# Install pytest-xdist
pip install pytest-xdist

# Run with 4 workers
pytest -n 4
```

### Run Tests with Markers
```bash
# Mark tests in code with: @pytest.mark.slow
pytest -m slow           # Run only slow tests
pytest -m "not slow"     # Skip slow tests
```

### Stop on First Failure
```bash
pytest -x               # Stop on first failure
pytest --maxfail=3      # Stop after 3 failures
```

---

## Frontend Tests

### Prerequisites
```bash
cd frontend
npm install
```

### Run All Tests
```bash
# Basic run
npm test

# Watch mode (re-run on file changes)
npm test -- --watch

# Single run (CI mode)
npm test -- --run
```

### Run with Coverage
```bash
# Generate coverage report
npm test -- --coverage

# View coverage in browser
open coverage/index.html
```

### Run Specific Tests
```bash
# Run tests in specific file
npm test -- ChatMessage.test.tsx

# Run tests matching pattern
npm test -- -t "should render"

# Run tests in watch mode for specific file
npm test -- --watch ChatMessage.test.tsx
```

### UI Mode (Visual Test Runner)
```bash
npm test -- --ui
```

### Debug Mode
```bash
# Run with debugging output
npm test -- --reporter=verbose

# Run in debug mode (opens inspector)
npm test -- --inspect-brk
```

---

## Coverage Reports

### Backend Coverage Summary
After running `pytest --cov=app --cov-report=html`:

```
htmlcov/
├── index.html         # Main coverage dashboard
├── status.json        # Machine-readable coverage data
└── [module-name].html # Coverage for each module
```

**Key Coverage Files to Check:**
- `app/core/` - Security, validation, rate limiting (target: 90%+)
- `app/models/` - Data models (target: 100%)
- `app/schemas/` - Request/response validation (target: 95%+)
- `app/api/v1/` - API endpoints (target: 80%+)
- `app/services/` - Business logic (target: 70%+)

### Frontend Coverage
After running `npm test -- --coverage`:

```
coverage/
├── index.html         # Coverage dashboard
└── [file].js.html     # Coverage per file
```

**Key Components to Check:**
- `components/` - React components
- `lib/hooks/` - Custom hooks
- `lib/utils/` - Utility functions
- `lib/stores/` - State management

---

## Continuous Integration

### GitHub Actions / CI Pipeline
Tests should be run automatically on:
- Push to main/develop branches
- Pull requests
- Scheduled runs (daily/weekly)

**Command sequence:**
```bash
# Backend
cd backend && pytest --cov=app --cov-report=xml

# Frontend
cd frontend && npm test -- --coverage

# Type checking
cd frontend && npm run type-check
cd backend && mypy app/
```

---

## Troubleshooting

### Backend Tests Failing

#### Issue: "ModuleNotFoundError: No module named 'app'"
**Solution:** Make sure you're in the backend directory and venv is activated:
```bash
cd backend
source venv/bin/activate
```

#### Issue: "FAILED - TypeError: can't compare offset-naive and offset-aware datetimes"
**Solution:** Already fixed in latest version. If you see this, ensure you're using the latest test_security.py

#### Issue: "ValidationError - Invalid identification_number format"
**Solution:** Already fixed in latest conftest.py. Test data now uses valid formats:
- CIN: `AB123456789` (format: `[A-Z]{2}\d{6,12}`)
- Passport: `PASSPORT123456` (format: `[A-Z0-9]{6,15}`)

#### Issue: "Database connection error"
**Solution:** Ensure Docker containers are running:
```bash
docker-compose up -d postgres redis
```

### Frontend Tests Failing

#### Issue: "Cannot find module"
**Solution:** Run npm install and clear cache:
```bash
npm install
npm test -- --clearCache
```

#### Issue: "Tests timeout"
**Solution:** Increase timeout in vitest.config.ts:
```typescript
export default defineConfig({
  test: {
    testTimeout: 10000, // 10 seconds
  }
})
```

---

## Test Metrics & Goals

### Backend Test Goals
- **Pass Rate:** > 90% (currently 85.4%)
- **Coverage:** > 80% overall (currently 57%)
  - Core modules: > 90%
  - Models: 100%
  - Schemas: 95%+

### Frontend Test Goals
- **Pass Rate:** > 95% (currently running)
- **Coverage:** > 70% (target for MVP)

### Target Completion
- Phase 1: Fix remaining backend test failures → 90% pass rate
- Phase 2: Increase coverage to 70% → comprehensive integration tests
- Phase 3: Add E2E tests → 80%+ coverage

---

## Performance Profiling

### Backend Performance Tests
```bash
# Run tests with timing information
pytest --durations=10

# Run specific test with profiling
python -m cProfile -s cumtime -m pytest tests/api/v1/test_patients.py
```

### Frontend Performance Tests
```bash
# Build bundle analysis
npm run build -- --analyze

# Lighthouse performance audit
npm run lighthouse
```

---

## Best Practices

1. **Run tests before committing:**
   ```bash
   # Backend
   cd backend && pytest && flake8 app/ && black app/ && mypy app/

   # Frontend
   cd frontend && npm test && npm run lint && npm run type-check
   ```

2. **Use descriptive test names:**
   ```python
   def test_create_patient_with_valid_data_should_succeed():
       # Clear what's being tested and expected outcome
   ```

3. **Keep tests isolated:**
   - Use fixtures for setup
   - Clean up after tests
   - Mock external dependencies

4. **Test both happy and sad paths:**
   - Valid input → success
   - Invalid input → appropriate error
   - Missing required fields → validation error

5. **Update tests when requirements change:**
   - Don't skip/ignore failing tests
   - Update assertions to match new behavior
   - Add new tests for new features

---

## Useful Commands

```bash
# Backend quick health check
cd backend && pytest -q

# Frontend quick health check
cd frontend && npm test -- --run --reporter=verbose

# Full pre-commit check
./scripts/pre-commit-check.sh  # If available

# Run only failed tests from last run
pytest --lf

# Run only tests that have changed files
pytest --ff

# Generate detailed test report
pytest --html=report.html --self-contained-html

# Run tests in random order (catches hidden dependencies)
pytest --random-order
```

---

**Last Updated:** 2025-11-27
