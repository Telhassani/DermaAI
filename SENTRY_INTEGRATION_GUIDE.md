# Sentry Integration Guide

This document explains how to set up and use Sentry for error tracking and monitoring in DermAI.

## What is Sentry?

Sentry is a real-time error tracking and performance monitoring platform that helps you identify and fix errors in production.

**Key Features:**
- Real-time error alerts
- Performance monitoring
- Release tracking
- Team collaboration
- Source maps for stack traces
- Session replays (Pro)

## Setup Instructions

### 1. Create Sentry Account

1. Go to https://sentry.io/
2. Sign up for a free account (50,000 errors/month free tier)
3. Create a new project:
   - Platform: **Python**
   - Framework: **FastAPI**
4. Get your **DSN** (Data Source Name)

Example DSN format:
```
https://key@sentry.io/project-id
```

### 2. Configure Backend Environment

Add to `.env` file:
```bash
# Sentry Configuration
SENTRY_DSN=https://your-key@sentry.io/your-project-id
SENTRY_ENVIRONMENT=development  # or staging, production
SENTRY_TRACES_SAMPLE_RATE=0.1   # 10% of transactions in production
```

**Environment Values:**
- `development` - Local development
- `staging` - Staging/Testing environment
- `production` - Production environment

### 3. Verify Installation

The backend now has Sentry enabled in `app/main.py`. Check:

```python
if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        environment=settings.ENVIRONMENT,
        traces_sample_rate=1.0 if settings.DEBUG else 0.1,
        integrations=[
            sentry_sdk.integrations.fastapi.FastApiIntegration(),
            sentry_sdk.integrations.sqlalchemy.SqlalchemyIntegration(),
        ],
    )
```

### 4. Frontend Integration (Optional)

For frontend error tracking, add to `frontend/src/main.tsx`:

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_ENVIRONMENT || "development",
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Replay({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
});
```

Add to `.env`:
```
VITE_SENTRY_DSN=https://your-key@sentry.io/your-frontend-project-id
VITE_ENVIRONMENT=development
```

## How It Works

### Automatic Error Capture

Sentry automatically captures:
- Unhandled exceptions
- Failed HTTP requests
- Database errors
- Authentication failures
- Rate limit violations

### Example: Manual Error Reporting

```python
import sentry_sdk

# In your route handler
@app.get("/api/v1/risky-operation")
async def risky_operation():
    try:
        # Do something that might fail
        result = perform_risky_operation()
        return result
    except ValueError as e:
        # Capture and report the error
        sentry_sdk.capture_exception(e)
        raise HTTPException(status_code=400, detail=str(e))
```

### Adding Context

```python
import sentry_sdk

@app.get("/api/v1/patients/{patient_id}")
async def get_patient(patient_id: int):
    # Add user context
    sentry_sdk.set_user({
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
    })

    # Add breadcrumb (like a log entry)
    sentry_sdk.capture_message(
        f"Fetching patient {patient_id}",
        level="info"
    )

    # Add tags for filtering
    sentry_sdk.set_tag("patient_id", patient_id)
    sentry_sdk.set_tag("operation", "fetch_patient")

    # Add extra data
    sentry_sdk.set_context("request_data", {
        "path": "/api/v1/patients/{patient_id}",
        "method": "GET",
    })

    try:
        patient = get_patient_from_db(patient_id)
        return patient
    except Exception as e:
        sentry_sdk.capture_exception(e)
        raise
```

## Using the Sentry Dashboard

### 1. Issues View

**Alerts** → Shows new errors grouped by error type
- Click an issue to see full stack trace
- View affected users
- See when it started
- Track fix status

### 2. Performance View

**Performance** → Monitor slow endpoints
- Transaction duration
- Database query time
- External API calls
- Error rate

### 3. Releases View

**Releases** → Track errors per version
- Tag your releases
- See which version introduced a bug
- Compare error rates between versions

### 4. Alerts & Notifications

**Alerts** → Set up notifications for:
- New error types
- Error spike (100+ errors in 10 min)
- Specific projects/environments
- High frequency errors

## Production Configuration

### Environment Variables for Production

```bash
# .env.production
SENTRY_DSN=https://your-key@sentry.io/your-project-id
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1      # Only 10% of transactions to reduce quota usage
SENTRY_ERROR_RATE_LIMIT=200        # Max errors per minute
```

### Release Tracking

Tag your releases for better error tracking:

```bash
# After deploying a version
sentry-cli releases -o your-org -p your-project create 1.0.0
sentry-cli releases -o your-org -p your-project set-commits 1.0.0 --auto
sentry-cli releases -o your-org -p your-project finalize 1.0.0
```

### Source Maps

Upload source maps for better stack traces:

```bash
# Build frontend
npm run build

# Upload source maps to Sentry
sentry-cli releases -o your-org -p your-frontend-project files upload-sourcemaps dist/

# After uploading, remove source maps from production build
rm dist/**/*.map
```

## Best Practices

### 1. Set User Context

Always set user context for logged-in requests:

```python
from app.api.deps import get_current_user

@app.get("/api/v1/data")
async def get_data(current_user = Depends(get_current_user)):
    sentry_sdk.set_user({
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
    })
    # ... rest of endpoint
```

### 2. Add Meaningful Tags

```python
sentry_sdk.set_tag("endpoint", "create_appointment")
sentry_sdk.set_tag("patient_id", patient_id)
sentry_sdk.set_tag("doctor_id", doctor_id)
sentry_sdk.set_tag("operation_type", "create")
```

### 3. Breadcrumbs for Debugging

```python
# Track important operations
sentry_sdk.capture_message("Patient created successfully", level="info")
sentry_sdk.capture_message("Email sent to admin", level="info")
sentry_sdk.capture_message("Database transaction committed", level="info")
```

### 4. Use Severity Levels

```python
import sentry_sdk

# Critical - immediate attention needed
sentry_sdk.capture_exception(e, level="fatal")

# High priority issues
sentry_sdk.capture_exception(e, level="error")

# Less urgent
sentry_sdk.capture_message("Low disk space", level="warning")

# Informational
sentry_sdk.capture_message("API version upgraded", level="info")
```

### 5. Sensitive Data Filtering

Use Sentry's before-send hook to remove sensitive data:

```python
def before_send(event, hint):
    # Remove email from breadcrumbs
    if "breadcrumbs" in event:
        for breadcrumb in event["breadcrumbs"]:
            if "data" in breadcrumb:
                breadcrumb["data"].pop("email", None)
                breadcrumb["data"].pop("password", None)
    return event

sentry_sdk.init(
    dsn=settings.SENTRY_DSN,
    before_send=before_send,
)
```

## Monitoring Critical Endpoints

### Create Custom Transactions

```python
import sentry_sdk
from sentry_sdk import start_transaction

@app.post("/api/v1/ai-analysis/analyze")
async def analyze_image(file: UploadFile):
    with start_transaction(
        op="analyze",
        name="AI Analysis",
        sampled=True,
    ) as transaction:
        # This transaction will show in Performance dashboard

        # Add child spans
        with transaction.start_child(
            op="db.query",
            description="Save analysis to database",
        ):
            # Save to database
            pass

        with transaction.start_child(
            op="ai.request",
            description="Call Claude API",
        ):
            # Call AI API
            pass

        return {"analysis": result}
```

## Troubleshooting

### Issue: Sentry events not appearing

1. Check SENTRY_DSN is set correctly:
   ```bash
   echo $SENTRY_DSN
   ```

2. Verify connection:
   ```bash
   python -c "import sentry_sdk; sentry_sdk.init('your-dsn'); sentry_sdk.capture_message('test')"
   ```

3. Check logs:
   ```bash
   tail -f logs/app.log | grep -i sentry
   ```

### Issue: Too many events/quota exceeded

1. Reduce sample rate in production:
   ```bash
   SENTRY_TRACES_SAMPLE_RATE=0.01  # 1% instead of 10%
   ```

2. Set error rate limit:
   ```bash
   SENTRY_ERROR_RATE_LIMIT=100
   ```

3. Filter out specific errors:
   ```python
   def before_send(event, hint):
       # Ignore specific errors
       if event["exception"]["values"][0]["type"] == "HTTPException":
           return None
       return event
   ```

### Issue: Source maps not uploading

1. Ensure frontend is built:
   ```bash
   npm run build
   ```

2. Check source maps exist:
   ```bash
   ls -la dist/**/*.map
   ```

3. Verify sentry-cli is installed:
   ```bash
   npm install -g @sentry/cli
   ```

## Testing Sentry Integration

### Test Backend

```bash
cd backend
source venv/bin/activate

# Create test error
python -c "
import sentry_sdk
from app.core.config import settings

sentry_sdk.init(settings.SENTRY_DSN)
try:
    1 / 0
except Exception as e:
    sentry_sdk.capture_exception(e)
    print('Error sent to Sentry')
"
```

### Test Frontend

```javascript
import * as Sentry from "@sentry/react";

// Trigger a test error
Sentry.captureException(new Error("Test error from frontend"));
```

Check Sentry dashboard - error should appear within 1-2 seconds.

## Security & Privacy

### Sensitive Data

By default, Sentry captures:
- ✅ Stack traces
- ✅ Error messages
- ✅ Request headers
- ✅ HTTP body

Make sure to:
- ❌ Don't send passwords
- ❌ Don't send credit cards
- ❌ Don't send API keys
- ❌ Don't send PHI (if in healthcare)

### HIPAA Compliance Note

If handling PHI (Protected Health Information), you should:
1. Use Sentry's Business/Enterprise plan (HIPAA-eligible)
2. Implement data scrubbing for patient data
3. Store audit logs separately
4. Consider on-premise Sentry option

## Cost Optimization

### Free Tier Limits
- 50,000 errors/month
- Performance monitoring (5,000 transactions/month)
- Unlimited team members
- 7-day data retention

### Upgrade Options
- **Team Plan:** $29/month (100K errors/month)
- **Business Plan:** Custom pricing + HIPAA compliance
- **Self-Hosted:** Deploy on your infrastructure

## Useful Links

- **Sentry Documentation:** https://docs.sentry.io/
- **FastAPI Integration:** https://docs.sentry.io/platforms/python/integrations/fastapi/
- **Sentry CLI:** https://docs.sentry.io/product/cli/
- **Performance Monitoring:** https://docs.sentry.io/product/performance/

---

**Status:** ✅ Enabled in backend (app/main.py)
**Last Updated:** 2025-11-27
