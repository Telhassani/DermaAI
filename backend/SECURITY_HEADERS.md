# Security Headers Implementation

## Overview

This document describes the Security Headers Middleware implemented in DermAI to protect against common web vulnerabilities.

## Security Headers Implemented

### 1. Content-Security-Policy (CSP)
**Purpose**: Prevent XSS (Cross-Site Scripting) attacks

- **Development**: Lenient policy allowing `unsafe-inline` and `unsafe-eval` for debugging
- **Production**: Strict policy restricting scripts to `'self'` only

```
default-src 'self';
script-src 'self' [+ 'unsafe-inline' + 'unsafe-eval' in dev];
style-src 'self' [+ 'unsafe-inline' in dev];
img-src 'self' data: https:;
font-src 'self' data:;
connect-src 'self' [+ http: + https: in dev];
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
```

### 2. X-Frame-Options
**Purpose**: Prevent clickjacking attacks

- **Value**: `DENY`
- **Effect**: Prevents page from being framed by any site
- **Alternative**: `SAMEORIGIN` (allows framing from same domain)

### 3. X-Content-Type-Options
**Purpose**: Prevent MIME type sniffing

- **Value**: `nosniff`
- **Effect**: Forces browsers to respect Content-Type header
- **Protection**: Prevents IE from executing images as scripts

### 4. Strict-Transport-Security (HSTS)
**Purpose**: Force HTTPS usage

- **Production Only**: `max-age=31536000; includeSubDomains; preload`
- **Duration**: 1 year (31536000 seconds)
- **Effect**: Browsers will force HTTPS for all future connections
- **Preload**: Allows inclusion in browser HSTS preload list

### 5. X-XSS-Protection
**Purpose**: Legacy XSS protection for older browsers

- **Value**: `1; mode=block`
- **Effect**: Enables XSS filter in older browsers
- **Modern Browsers**: Largely superseded by CSP but still useful for legacy support

### 6. Referrer-Policy
**Purpose**: Control what referrer information is sent

- **Value**: `strict-origin-when-cross-origin`
- **Effect**: Sends origin only for cross-origin requests
- **Privacy**: Reduces information leak about navigation

### 7. Permissions-Policy
**Purpose**: Control browser feature access

- **Restricted Features**:
  - `geolocation`: Disable geolocation access
  - `microphone`: Disable microphone access
  - `camera`: Disable camera access

## CSRF Protection

### Token Generation
- Cryptographically secure tokens using `secrets.token_hex(32)`
- 64-character hexadecimal tokens
- Unique for each GET request

### Token Usage
1. Server generates token in GET responses via `X-CSRF-Token` header
2. Client includes token in forms via hidden field or request header
3. Server validates token on POST/PUT/DELETE requests
4. Token is one-time use (deleted after validation)

### Implementation Details
- **Location**: `app/core/security_headers.py`
- **Middleware**: `SecurityHeadersMiddleware` applies headers to all responses
- **Helper Functions**:
  - `generate_csrf_token()`: Generate new token
  - `validate_csrf_token(token)`: Validate and consume token
  - `verify_csrf_token_for_request(request)`: Extract and validate from request
  - `is_safe_method(method)`: Check if method needs CSRF protection

## Environment-Specific Behavior

### Development (DEBUG=True)
- CSP allows `unsafe-inline` and `unsafe-eval`
- Permits more flexible content loading (useful for debugging)
- No HSTS enforcement

### Production (DEBUG=False)
- Strict CSP with no unsafe directives
- HSTS enabled with 1-year max-age
- Full security enforcement

## Integration

### Installation
The middleware is automatically integrated in `app/main.py`:

```python
from app.core.security_headers import SecurityHeadersMiddleware

# Add to middleware stack (early in chain for all responses)
app.add_middleware(SecurityHeadersMiddleware, settings=settings)
```

### API Usage

#### For Form Submissions
```javascript
// 1. Get CSRF token from response header
const csrfToken = response.headers['x-csrf-token'];

// 2. Include in form submission
form.innerHTML += `<input type="hidden" name="csrf_token" value="${csrfToken}">`;

// 3. Or send in request header
fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken,
  },
  body: formData,
});
```

#### For API Requests (JWT)
- CSRF protection automatically bypassed for requests with valid JWT
- API clients don't need to handle CSRF tokens
- Token-based auth is considered CSRF-safe

## Testing

Comprehensive test suite included in `tests/core/test_security_headers.py`:

### Test Coverage
- **27 tests** covering all security headers
- **88% code coverage** of middleware code
- **All tests passing** ✅

### Key Test Cases
1. Headers present in all responses
2. CSP policy varies by environment
3. CSRF token generation and validation
4. One-time use enforcement
5. Error responses include headers
6. Safe method detection

### Running Tests
```bash
pytest tests/core/test_security_headers.py -v
```

## Security Benefits

| Vulnerability | Header(s) | Protection |
|---|---|---|
| XSS Attacks | CSP, X-XSS-Protection | Restrict script sources |
| Clickjacking | X-Frame-Options | Prevent embedding |
| MIME Sniffing | X-Content-Type-Options | Force content type |
| CSRF Attacks | CSRF Token | Token validation |
| Man-in-Middle | HSTS | Force HTTPS |
| Feature Abuse | Permissions-Policy | Restrict features |

## Configuration

Headers are configured via `SecurityHeadersMiddleware` which reads from `settings`:

### Available Settings
- `DEBUG`: Controls CSP strictness and HSTS
- `ALLOWED_ORIGINS`: CORS configuration (separate middleware)
- `ALLOWED_HOSTS`: TrustedHost configuration (production)

### Customization
To modify CSP policy, edit `SecurityHeadersMiddleware._build_csp_policy()`:

```python
def _build_csp_policy(self) -> str:
    """Build Content Security Policy based on environment."""
    if self.settings.DEBUG:
        # Development policy here
    else:
        # Production policy here
```

## Production Deployment Checklist

- [ ] Set `DEBUG=False`
- [ ] Enable HTTPS/TLS certificates
- [ ] Add domain to HSTS preload list (optional)
- [ ] Test headers with curl: `curl -I https://api.example.com`
- [ ] Monitor for CSP violations (errors will appear in browser console)
- [ ] Consider using Report-Only mode initially: `Content-Security-Policy-Report-Only`

## Future Enhancements

1. **CSP Violation Reporting**
   - Add `report-uri` to CSP for violation monitoring
   - Send violations to logging service

2. **CSRF Token Storage**
   - Move from in-memory to Redis for distributed systems
   - Allow cross-domain token validation

3. **Sub-resource Integrity (SRI)**
   - Add for external script/style loading
   - Protect against CDN compromises

4. **Additional Headers**
   - `Accept-CH`: Client hints
   - `Cross-Origin-Opener-Policy`: Cross-origin isolation
   - `Cross-Origin-Resource-Policy`: Cross-origin resource sharing

## References

- [OWASP Top 10 Security Headers](https://owasp.org/www-project-secure-headers/)
- [CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
- [MDN Web Docs - Security Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)

## Support

For questions or issues with security headers:
1. Check test suite for usage examples
2. Review OWASP documentation
3. Test headers with curl or online tools like securityheaders.com
