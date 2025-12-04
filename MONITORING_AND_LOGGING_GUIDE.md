# Monitoring and Logging Infrastructure Guide

Comprehensive guide to monitoring, logging, and observability in DermAI.

## Overview

DermAI implements three-tier monitoring strategy:

1. **Application Logging** - Structured logs with audit trails
2. **Error Tracking** - Sentry integration for real-time error monitoring
3. **Performance Monitoring** - Application metrics and dashboards
4. **Infrastructure Monitoring** - System resource utilization

---

## Application Logging

### Logging Architecture

**Implemented Components:**
- ✅ Console handler (development)
- ✅ File handler with JSON format (production)
- ✅ Audit logger for HIPAA compliance
- ✅ Structured logging with context

**Log Files Location:**
```
logs/
├── app.log              # Application logs (JSON format in production)
└── audit/
    └── audit.log        # HIPAA compliance audit trail
```

### Configuration

Located in `app/core/logging.py` and configured via `app/core/config.py`:

```python
# Environment variables
LOG_LEVEL=INFO                      # DEBUG, INFO, WARNING, ERROR, CRITICAL
HIPAA_AUDIT_ENABLED=True           # Enable audit logging
HIPAA_AUDIT_LOG_DIR=./logs/audit   # Audit log directory
```

### Log Levels

| Level | Purpose | Examples |
|-------|---------|----------|
| DEBUG | Development info | Variable values, function entry/exit |
| INFO | General info | User login, API requests, data syncs |
| WARNING | Potential issues | Deprecated API usage, high response time |
| ERROR | Error conditions | Failed database query, invalid input |
| CRITICAL | Severe issues | System failure, database connection lost |

### Using the Logger

```python
from app.core.logging import logger

# Log at different levels
logger.debug("Processing patient data")
logger.info("User logged in", extra={"user_id": 123})
logger.warning("High memory usage detected")
logger.error("Failed to save appointment", exc_info=True)
logger.critical("Database connection lost")
```

### Structured Logging with Context

```python
from app.core.logging import logger
import logging

# Create context logger
logger = logging.getLogger("app")

# Log with structured data
logger.info(
    "Patient created",
    extra={
        "user_id": 123,
        "patient_id": 456,
        "action": "create",
        "details": {
            "name": "John Doe",
            "age": 45,
            "email": "john@example.com"
        }
    }
)
```

### Audit Logging

For HIPAA compliance, use the audit logging utility:

```python
from app.core.logging import log_audit_event

# Log user action
log_audit_event(
    user_id="doc_123",
    action="UPDATE",
    resource="patient_456",
    details={
        "field": "diagnosis",
        "old_value": "eczema",
        "new_value": "psoriasis"
    },
    success=True
)
```

**Audit Event Format:**
```json
{
  "timestamp": "2025-11-27T10:30:45.123Z",
  "user": "doc_123",
  "action": "UPDATE",
  "resource": "patient_456",
  "details": {
    "field": "diagnosis",
    "old_value": "eczema",
    "new_value": "psoriasis"
  },
  "success": true
}
```

---

## Error Tracking (Sentry)

See [SENTRY_INTEGRATION_GUIDE.md](./SENTRY_INTEGRATION_GUIDE.md) for detailed setup.

### Quick Setup

1. Set `SENTRY_DSN` in `.env`
2. Errors are automatically captured
3. View dashboard at https://sentry.io/

### Manual Error Reporting

```python
import sentry_sdk

try:
    # risky operation
except Exception as e:
    sentry_sdk.capture_exception(e)
    raise
```

---

## Performance Monitoring

### Request/Response Metrics

Automatically tracked via Sentry:
- Response time
- HTTP status codes
- Error rates
- Database query time

### Custom Performance Tracking

```python
import time
from app.core.logging import logger

@app.post("/api/v1/appointments")
async def create_appointment(data: AppointmentCreate):
    start_time = time.time()

    try:
        appointment = create_appointment_in_db(data)
        duration = time.time() - start_time

        logger.info(
            "Appointment created",
            extra={
                "appointment_id": appointment.id,
                "duration_ms": duration * 1000,
                "patient_id": data.patient_id,
            }
        )

        return appointment
    except Exception as e:
        duration = time.time() - start_time
        logger.error(
            "Failed to create appointment",
            extra={
                "duration_ms": duration * 1000,
                "error": str(e),
            },
            exc_info=True
        )
        raise
```

### Database Query Monitoring

Slow query logging is configured via SQLAlchemy:

```python
# In database configuration
from sqlalchemy import event, create_engine

engine = create_engine(DATABASE_URL)

@event.listens_for(engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    conn.info.setdefault('query_start_time', []).append(time.time())

@event.listens_for(engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    total_time = time.time() - conn.info['query_start_time'].pop(-1)

    # Log slow queries (> 1 second)
    if total_time > 1.0:
        logger.warning(
            "Slow database query",
            extra={
                "query": statement[:100],  # First 100 chars
                "duration_ms": total_time * 1000,
                "parameters": str(parameters)[:100],
            }
        )
```

### API Endpoint Metrics

Middleware for tracking endpoint metrics:

```python
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
import time

class MetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time

        # Log endpoint metrics
        logger.info(
            "API request",
            extra={
                "method": request.method,
                "path": request.url.path,
                "status_code": response.status_code,
                "duration_ms": process_time * 1000,
                "client": request.client.host if request.client else "unknown",
            }
        )

        # Add metrics header
        response.headers["X-Process-Time"] = str(process_time)
        return response

# Add middleware to app
app.add_middleware(MetricsMiddleware)
```

---

## System Monitoring

### CPU & Memory Usage

For production, monitor system resources:

```bash
# Install monitoring tools
pip install psutil

# Monitor in code
import psutil

def check_system_health():
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')

    health = {
        "cpu": cpu_percent,
        "memory_percent": memory.percent,
        "disk_percent": disk.percent,
        "healthy": (
            cpu_percent < 80 and
            memory.percent < 85 and
            disk.percent < 90
        )
    }

    if not health["healthy"]:
        logger.warning("System health degraded", extra=health)

    return health
```

Health check endpoint:

```python
@app.get("/health/system")
async def system_health():
    return check_system_health()
```

### Database Connection Pool Monitoring

```python
from app.db.session import SessionLocal

@app.get("/health/database")
async def database_health():
    try:
        db = SessionLocal()
        db.execute("SELECT 1")
        db.close()

        pool = db.engine.pool
        return {
            "status": "healthy",
            "connections": {
                "size": pool.size(),
                "checkedout": pool.checkedout(),
            }
        }
    except Exception as e:
        logger.error("Database health check failed", exc_info=True)
        return {
            "status": "unhealthy",
            "error": str(e)
        }
```

---

## Dashboard Setup (Optional)

### Using Grafana (Recommended)

1. **Install Grafana:**
   ```bash
   docker run -d \
     --name grafana \
     -p 3000:3000 \
     -e GF_SECURITY_ADMIN_PASSWORD=admin \
     grafana/grafana
   ```

2. **Add Data Sources:**
   - Prometheus (for metrics)
   - Loki (for logs)
   - PostgreSQL (direct queries)

3. **Create Dashboards:**
   - API performance metrics
   - Error rates and trends
   - Database performance
   - System resource usage

### Using Prometheus

1. **Install Prometheus integration:**
   ```bash
   pip install prometheus-client
   ```

2. **Add metrics endpoint:**
   ```python
   from prometheus_client import Counter, Histogram, generate_latest

   # Define metrics
   request_count = Counter(
       'api_requests_total',
       'Total API requests',
       ['method', 'endpoint', 'status']
   )

   request_duration = Histogram(
       'api_request_duration_seconds',
       'API request duration',
       ['method', 'endpoint']
   )

   @app.middleware("http")
   async def metrics_middleware(request: Request, call_next):
       start = time.time()
       response = await call_next(request)
       duration = time.time() - start

       request_count.labels(
           method=request.method,
           endpoint=request.url.path,
           status=response.status_code
       ).inc()

       request_duration.labels(
           method=request.method,
           endpoint=request.url.path
       ).observe(duration)

       return response

   @app.get("/metrics")
   async def metrics():
       return generate_latest()
   ```

3. **Configure Prometheus** (`prometheus.yml`):
   ```yaml
   global:
     scrape_interval: 15s

   scrape_configs:
     - job_name: 'dermai-api'
       static_configs:
         - targets: ['localhost:8000']
       metrics_path: '/metrics'
   ```

---

## Alerting Strategy

### Alert Channels

**Email:**
```bash
# Configure SMTP in config.py
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

**Slack:**
```python
import requests

def send_slack_alert(message: str, severity: str = "warning"):
    """Send alert to Slack channel"""
    webhook_url = os.getenv("SLACK_WEBHOOK_URL")

    color = {
        "critical": "danger",
        "warning": "warning",
        "info": "good"
    }.get(severity, "warning")

    payload = {
        "attachments": [{
            "color": color,
            "title": f"Alert: {severity.upper()}",
            "text": message,
            "ts": int(time.time())
        }]
    }

    requests.post(webhook_url, json=payload)
```

### Critical Alerts

Alert when:
- **Error rate > 5%** - More than 5% of requests failing
- **Response time > 2s** - API slow down detected
- **CPU > 80%** - High CPU usage
- **Memory > 85%** - Memory pressure
- **Disk > 90%** - Disk space running low
- **Database connection pool exhausted**
- **Scheduled backup failed**

### Example Alert Handler

```python
from app.core.logging import logger

async def monitor_system_health():
    """Periodic health check"""

    health = check_system_health()

    if health["cpu"] > 80:
        logger.critical(
            f"High CPU usage: {health['cpu']}%",
            extra={"alert": True}
        )
        send_slack_alert(
            f"CPU usage critical: {health['cpu']}%",
            severity="critical"
        )

    if health["memory_percent"] > 85:
        logger.critical(
            f"High memory usage: {health['memory_percent']}%",
            extra={"alert": True}
        )
        send_slack_alert(
            f"Memory usage critical: {health['memory_percent']}%",
            severity="critical"
        )
```

### Schedule Periodic Health Checks

```python
from apscheduler.schedulers.background import BackgroundScheduler

scheduler = BackgroundScheduler()

@app.on_event("startup")
async def startup():
    scheduler.add_job(
        monitor_system_health,
        "interval",
        minutes=5,
        id="health_check"
    )
    scheduler.start()

@app.on_event("shutdown")
async def shutdown():
    scheduler.shutdown()
```

---

## Log Retention & Archiving

### Rotation Policy

```python
from logging.handlers import RotatingFileHandler

# Rotate when file reaches 10MB or daily
handler = RotatingFileHandler(
    "logs/app.log",
    maxBytes=10_000_000,  # 10MB
    backupCount=10  # Keep 10 old files
)
```

### Archive Old Logs

```bash
# Move old logs to archive after 30 days
find logs/ -type f -mtime +30 -exec gzip {} \;
find logs/ -type f -mtime +30 -name "*.gz" -exec mv {} archive/ \;
```

### Cleanup Strategy

```python
import os
from datetime import datetime, timedelta

def cleanup_old_logs(days=90):
    """Delete logs older than specified days"""
    cutoff_time = datetime.now() - timedelta(days=days)

    for log_file in Path("logs").glob("**/*.log"):
        mtime = datetime.fromtimestamp(log_file.stat().st_mtime)
        if mtime < cutoff_time:
            log_file.unlink()
            logger.info(f"Deleted old log: {log_file}")
```

---

## Troubleshooting

### Issue: Logs not appearing

1. Check log level:
   ```bash
   echo $LOG_LEVEL
   # Should be INFO or lower (DEBUG)
   ```

2. Verify log directory:
   ```bash
   ls -la logs/
   ```

3. Check file permissions:
   ```bash
   chmod 755 logs/
   ```

### Issue: Log file too large

1. Rotate logs manually:
   ```bash
   mv logs/app.log logs/app.log.$(date +%Y-%m-%d)
   gzip logs/app.log.2025-11-27
   ```

2. Implement rotation in config

### Issue: Performance impact from logging

1. Reduce log level in production:
   ```bash
   LOG_LEVEL=WARNING  # Only log warnings and above
   ```

2. Use asynchronous logging:
   ```python
   from pythonjsonlogger import jsonlogger
   from logging.handlers import QueueHandler, QueueListener

   queue = Queue()
   handler = QueueHandler(queue)
   listener = QueueListener(queue, file_handler, respect_handler_level=True)
   listener.start()
   ```

---

## Best Practices

1. **Log important events:**
   - User login/logout
   - Data modifications (create, update, delete)
   - API errors
   - Performance issues

2. **Avoid logging sensitive data:**
   - ❌ Passwords
   - ❌ API keys
   - ❌ Credit cards
   - ✅ User IDs (anonymized)

3. **Use structured logging:**
   - ✅ JSON format for production
   - ✅ Include context (user_id, resource_id)
   - ✅ Add timestamps
   - ✅ Use consistent field names

4. **Set appropriate log levels:**
   - DEBUG: Development only
   - INFO: General operation info
   - WARNING: Potential issues
   - ERROR: Error conditions
   - CRITICAL: System failures

5. **Monitor metrics:**
   - Response times
   - Error rates
   - Database query duration
   - Cache hit rates

---

## Recommended Reading

- [Python Logging Documentation](https://docs.python.org/3/library/logging.html)
- [Structured Logging](https://www.kartar.net/2015/12/structured-logging/)
- [Observability Engineering (O'Reilly)](https://www.oreilly.com/library/view/observability-engineering/9781492076438/)
- [Grafana Documentation](https://grafana.com/docs/)

---

**Status:** ✅ Logging configured, Sentry enabled
**Last Updated:** 2025-11-27
