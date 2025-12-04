# Rate Limiting Configuration Guide

Comprehensive guide to configure and manage rate limiting in DermAI for production environments.

## Overview

DermAI uses **slowapi** library for per-IP rate limiting to prevent:
- Brute force attacks
- DOS (Denial of Service) attempts
- API abuse
- Resource exhaustion

**Current Implementation:**
- ✅ Rate limiter configured in `app/core/rate_limiter.py`
- ✅ Disabled in development (for ease of testing)
- ✅ Custom error handler for rate limit responses
- ✅ Decorators applied to critical endpoints

---

## Architecture

### Rate Limiter Modes

| Mode | Environment | Status | Behavior |
|------|-------------|--------|----------|
| NoOpLimiter | Development | ✅ Active | All requests allowed (testing) |
| slowapi Limiter | Production | ✅ Active | Per-IP rate limiting enforced |
| slowapi Limiter | Staging | ✅ Active | Per-IP rate limiting enforced |

### Configuration in `app/core/rate_limiter.py`

```python
# Disables in development for testing
if settings.ENVIRONMENT == "development":
    limiter = NoOpLimiter()  # No limits
else:
    limiter = Limiter(key_func=get_remote_address)  # Per-IP limits
```

---

## Production Rate Limit Thresholds

### Recommended Limits by Endpoint Category

#### 1. Authentication Endpoints
```python
@app.post("/api/v1/auth/login")
@limiter.limit("5/minute")  # 5 attempts per minute
async def login(credentials: LoginRequest):
    ...

@app.post("/api/v1/auth/register")
@limiter.limit("3/minute")  # 3 attempts per minute
async def register(user_data: UserCreate):
    ...

@app.post("/api/v1/auth/reset-password")
@limiter.limit("3/minute")  # Prevent password reset spam
async def reset_password(email: str):
    ...

@app.post("/api/v1/auth/refresh")
@limiter.limit("10/minute")  # Token refresh
async def refresh_token(refresh_token: str):
    ...
```

#### 2. Resource Creation Endpoints
```python
@app.post("/api/v1/patients")
@limiter.limit("20/minute")  # Create patients
async def create_patient(data: PatientCreate):
    ...

@app.post("/api/v1/appointments")
@limiter.limit("15/minute")  # Create appointments
async def create_appointment(data: AppointmentCreate):
    ...

@app.post("/api/v1/consultations")
@limiter.limit("10/minute")  # Create consultations
async def create_consultation(data: ConsultationCreate):
    ...

@app.post("/api/v1/prescriptions")
@limiter.limit("10/minute")  # Create prescriptions
async def create_prescription(data: PrescriptionCreate):
    ...
```

#### 3. Lab Conversation Endpoints
```python
@app.post("/api/v1/lab-conversations")
@limiter.limit("10/minute")  # Create conversation
async def create_conversation(data: ConversationCreate):
    ...

@app.post("/api/v1/lab-conversations/{id}/messages")
@limiter.limit("20/minute")  # Send message
async def send_message(id: int, data: MessageCreate):
    ...

@app.post("/api/v1/lab-conversations/{id}/stream-response")
@limiter.limit("10/minute")  # Stream AI response
async def stream_ai_response(id: int):
    ...
```

#### 4. File Upload Endpoints
```python
@app.post("/api/v1/images")
@limiter.limit("5/minute")  # Image uploads
async def upload_image(file: UploadFile):
    ...

@app.post("/api/v1/images/analyze")
@limiter.limit("10/minute")  # AI analysis
async def analyze_image(image_id: int):
    ...
```

#### 5. Search/Read Endpoints (Lenient)
```python
@app.get("/api/v1/patients")
@limiter.limit("100/minute")  # List/search patients
async def list_patients():
    ...

@app.get("/api/v1/appointments")
@limiter.limit("100/minute")  # List appointments
async def list_appointments():
    ...

@app.get("/api/v1/lab-conversations")
@limiter.limit("100/minute")  # List conversations
async def list_conversations():
    ...
```

#### 6. Update/Delete Endpoints
```python
@app.put("/api/v1/patients/{id}")
@limiter.limit("30/minute")  # Update patient
async def update_patient(id: int, data: PatientUpdate):
    ...

@app.delete("/api/v1/patients/{id}")
@limiter.limit("5/minute")  # Delete patient (destructive)
async def delete_patient(id: int):
    ...

@app.put("/api/v1/lab-conversations/{id}/messages/{msg_id}")
@limiter.limit("30/minute")  # Edit message
async def edit_message(id: int, msg_id: int, data: MessageEdit):
    ...
```

### Summary Table

| Endpoint Type | Limit | Reason |
|---------------|-------|--------|
| Login/Auth | 5/min | Prevent brute force |
| Register | 3/min | Prevent spam accounts |
| Reset Password | 3/min | Prevent abuse |
| Create Resource | 10-20/min | Reasonable creation rate |
| Send Message | 20/min | Allow rapid conversation |
| Stream AI | 10/min | Resource intensive |
| File Upload | 5/min | Limit bandwidth |
| Search/List | 100/min | Read-heavy operations |
| Update Resource | 30/min | Allow edits |
| Delete Resource | 5/min | Prevent accidental deletion |

---

## Implementation

### Adding Rate Limits to Endpoints

#### Example 1: Simple Rate Limit
```python
from app.core.rate_limiter import limiter

@app.post("/api/v1/auth/login")
@limiter.limit("5/minute")
async def login(credentials: LoginRequest):
    # Max 5 requests per minute per IP
    return {"token": "..."}
```

#### Example 2: Multiple Rate Limits
```python
@app.post("/api/v1/users")
@limiter.limit("3/minute")  # Hard limit per minute
@limiter.limit("20/hour")   # Softer limit per hour
async def create_user(data: UserCreate):
    return {"user_id": 123}
```

#### Example 3: Conditional Rate Limits
```python
from fastapi import Depends, Request

@app.get("/api/v1/sensitive-data")
@limiter.limit("10/minute")
async def get_sensitive_data(request: Request):
    # Can access request.state.limiter_status
    # Implement custom logic if needed
    return {"data": "..."}
```

### Rate Limit Response Format

When rate limit is exceeded, response is:

```json
HTTP/1.1 429 Too Many Requests

{
  "detail": "Rate limit exceeded",
  "message": "Too many requests. 5 per 1 minute"
}
```

**Response Headers:**
```
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1234567890
```

---

## Environment Configuration

### Development Environment
```bash
# .env.development
ENVIRONMENT=development
# Rate limiting disabled - all requests allowed
```

### Staging Environment
```bash
# .env.staging
ENVIRONMENT=staging
# Rate limiting enabled with production limits
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_PER_HOUR=1000
```

### Production Environment
```bash
# .env.production
ENVIRONMENT=production
# Strict rate limiting enforced
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_PER_HOUR=1000
```

---

## Advanced Configuration

### Custom Rate Limit Keys

Instead of IP-based limiting, use user-based:

```python
from app.core.rate_limiter import Limiter

def get_user_key(request: Request):
    # Rate limit by user ID if authenticated
    if hasattr(request.state, "user"):
        return f"user_{request.state.user.id}"
    # Fall back to IP for unauthenticated
    return request.client.host

limiter = Limiter(key_func=get_user_key)
```

### Dynamic Rate Limits

Adjust limits based on user tier:

```python
from fastapi import Depends

def get_rate_limit(current_user = Depends(get_current_user)):
    if current_user.role == "admin":
        return "1000/minute"  # Admins get higher limits
    elif current_user.subscription == "premium":
        return "100/minute"   # Premium users
    else:
        return "20/minute"    # Free tier
```

### Whitelist/Blacklist

```python
RATE_LIMIT_WHITELIST = [
    "127.0.0.1",      # localhost
    "192.168.1.1",    # internal network
]

RATE_LIMIT_BLACKLIST = [
    "10.0.0.1",       # Known bad actor
]

def check_rate_limit_status(ip: str):
    if ip in RATE_LIMIT_WHITELIST:
        return None  # No limit
    if ip in RATE_LIMIT_BLACKLIST:
        return "0/second"  # Permanent block
    return "normal"
```

---

## Monitoring Rate Limits

### Track Rate Limit Violations

```python
from app.core.logging import logger
from slowapi.errors import RateLimitExceeded

def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    """Custom handler that logs violations"""

    logger.warning(
        "Rate limit exceeded",
        extra={
            "ip": request.client.host,
            "path": request.url.path,
            "method": request.method,
            "limit": exc.detail,
        }
    )

    return JSONResponse(
        status_code=429,
        content={
            "detail": "Rate limit exceeded",
            "message": f"Too many requests. {exc.detail}",
        },
    )
```

### Monitor Abuse Patterns

```python
from collections import defaultdict
from datetime import datetime, timedelta

class AbuseDetector:
    def __init__(self):
        self.violations = defaultdict(list)
        self.suspicious_ips = set()

    def log_violation(self, ip: str):
        """Log rate limit violation"""
        self.violations[ip].append(datetime.now())

        # Check for abuse pattern
        violations = self.violations[ip]
        recent = [
            v for v in violations
            if v > datetime.now() - timedelta(minutes=10)
        ]

        # If > 50 violations in 10 minutes, mark as suspicious
        if len(recent) > 50:
            self.suspicious_ips.add(ip)
            logger.critical(f"Suspicious activity from {ip}")

    def is_suspicious(self, ip: str) -> bool:
        return ip in self.suspicious_ips

detector = AbuseDetector()
```

---

## Testing Rate Limits

### Load Testing Tool: Apache Bench

```bash
# Simulate 100 concurrent requests
ab -n 100 -c 10 http://localhost:8000/api/v1/patients

# Simulate sustained requests
for i in {1..20}; do
  curl http://localhost:8000/api/v1/auth/login -X POST -d '...'
done
```

### Load Testing Tool: wrk

```bash
# Install: brew install wrk
wrk -t4 -c100 -d30s http://localhost:8000/api/v1/patients

# With custom script:
wrk -t4 -c100 -d30s -s script.lua http://localhost:8000/api/v1/auth/login
```

### Python Test Script

```python
import requests
import time
from concurrent.futures import ThreadPoolExecutor

def test_rate_limit():
    """Test rate limiting"""
    url = "http://localhost:8000/api/v1/auth/login"
    data = {"email": "test@test.com", "password": "password"}

    # Send 10 requests rapidly
    responses = []
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = [
            executor.submit(requests.post, url, json=data)
            for _ in range(10)
        ]
        responses = [f.result() for f in futures]

    # Check for 429 rate limit responses
    rate_limited = [r for r in responses if r.status_code == 429]
    print(f"Rate limited responses: {len(rate_limited)}/{len(responses)}")

test_rate_limit()
```

---

## Troubleshooting

### Issue: Rate limit not working

1. Check environment is not "development":
   ```bash
   echo $ENVIRONMENT
   # Should be "production" or "staging"
   ```

2. Verify limiter is enabled:
   ```python
   from app.core.rate_limiter import limiter
   print(type(limiter).__name__)  # Should be "Limiter", not "NoOpLimiter"
   ```

3. Check decorator is applied:
   ```bash
   grep -n "@limiter.limit" app/api/v1/*.py
   ```

### Issue: Too strict limits causing problems

1. Adjust thresholds in endpoint decorator:
   ```python
   @limiter.limit("10/minute")  # Increase from 5 to 10
   async def my_endpoint():
       ...
   ```

2. Or configure globally:
   ```bash
   RATE_LIMIT_PER_MINUTE=100
   RATE_LIMIT_PER_HOUR=5000
   ```

### Issue: Legitimate traffic being blocked

1. Check if traffic comes from single IP:
   - Behind proxy: Use X-Forwarded-For header
   - Load balancer: Configure trusted proxies

2. Whitelist internal IPs:
   ```python
   RATE_LIMIT_WHITELIST = ["10.0.0.0/8"]  # Internal network
   ```

3. Implement per-user limits instead of per-IP:
   ```python
   # Limits per authenticated user, not IP
   def get_user_id(request: Request):
       return request.state.user.id if hasattr(request.state, "user") else request.client.host
   ```

---

## Best Practices

1. **Start with lenient limits:**
   - Monitor actual usage
   - Gradually tighten as needed
   - Don't over-restrict legitimate users

2. **Tier-based limiting:**
   - Free tier: Lower limits
   - Premium tier: Higher limits
   - Admin: No limits

3. **Exempt critical endpoints:**
   ```python
   @app.get("/health")  # No rate limit
   async def health_check():
       ...
   ```

4. **Log violations:**
   - Track which endpoints are rate limited
   - Monitor for abuse patterns
   - Alert on suspicious activity

5. **Communicate limits:**
   - Document in API documentation
   - Include `X-RateLimit-*` headers in responses
   - Provide clear error messages

---

## Production Deployment Checklist

- [ ] Set `ENVIRONMENT=production`
- [ ] Apply rate limit decorators to all write endpoints
- [ ] Test rate limits with load testing tools
- [ ] Configure logging for rate limit violations
- [ ] Set up alerts for abuse patterns
- [ ] Document limits in API documentation
- [ ] Monitor actual usage and adjust if needed
- [ ] Test from behind proxy/load balancer

---

## References

- [slowapi Documentation](https://github.com/laurenceisla/slowapi)
- [OWASP Rate Limiting](https://owasp.org/www-community/attacks/Application_Denial_of_Service_(DoS))
- [API Rate Limiting Best Practices](https://cloud.google.com/architecture/rate-limiting-strategies-techniques)

---

**Status:** ✅ Rate limiter configured and ready
**Last Updated:** 2025-11-27
