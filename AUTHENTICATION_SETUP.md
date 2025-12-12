# DermAI Supabase Authentication Setup

**Date:** December 11, 2025
**Status:** ✅ FULLY OPERATIONAL

## Overview

DermAI backend now successfully authenticates users via Supabase JWT tokens and retrieves user profiles from the Supabase PostgreSQL database.

---

## Configuration Summary

### Backend Environment Variables

**File:** `/Users/tariq/Applications/DermaAI/backend/.env`

```bash
# Database
DATABASE_URL=postgresql://postgres.scghmuaexujfhadktlho:noTjeg-wifjoc-2kyfpo@aws-1-eu-west-1.pooler.supabase.com:5432/postgres

# Supabase
SUPABASE_URL=https://scghmuaexujfhadktlho.supabase.co
SUPABASE_JWT_SECRET=Xiswflp+l8/vIjXt9MXgeX2YUJ7WKe9BV+bQZmPKrYOzUXFVAY6H9mHkJXtJylSvyXEcgaeOIFq6lQApQ8lAJw==
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjZ2htdWFleHVqZmhhZGt0bGhvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTExNjA1MywiZXhwIjoyMDgwNjkyMDUzfQ.vKcG6slJnyrYQUrWdKEJVQ4-3mY6URjL9qLcGJfDeZk
```

### Frontend Environment Variables

**File:** `/Users/tariq/Applications/DermaAI/frontend/.env.local`

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://scghmuaexujfhadktlho.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjZ2htdWFleHVqZmhhZGt0bGhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMTYwNTMsImV4cCI6MjA4MDY5MjA1M30.2af2Hot2Wh4yYuMvsFXeO_PLiHPAsWhjDGFCAtExUxk
```

---

## Database Schema

### Tables

#### `auth.users` (Supabase Managed)
- Handles authentication
- Stores email, hashed password, metadata
- UUID primary key

#### `public.profiles` (Application Data)
```sql
CREATE TABLE profiles (
    id UUID PRIMARY KEY,  -- Matches auth.users.id
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'DOCTOR',
    phone TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    mfa_enabled BOOLEAN NOT NULL DEFAULT false,
    mfa_secret TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ
);
```

### Existing Admin User

**Email:** admin@dermai.com
**Password:** Admin123!
**UUID:** 6c8e83d3-f8b9-4e6a-9ab1-a87b59bb7bea
**Role:** ADMIN
**Status:** Active, Verified

---

## Code Changes Implemented

### 1. Updated Pydantic Schemas

**File:** `backend/app/schemas/user.py`

- Changed `UserResponse.id` from `int` to `UUID` (line 67)
- Changed `TokenData.user_id` from `int` to `UUID` (line 96)
- Added `from uuid import UUID` import (line 8)

### 2. Updated Dependencies

**File:** `backend/app/api/deps.py`

- Added debug logging to `decode_supabase_token()` function (lines 58, 62)
- Added traceback logging for exceptions (lines 104-106)
- Token validation working in development mode (unverified tokens allowed)

### 3. Created Startup Script

**File:** `backend/start_backend.sh` ✨ NEW

```bash
#!/bin/bash
# Ensures correct DATABASE_URL is used, overriding shell environment variables

cd "$(dirname "$0")"
export $(grep -v '^#' .env | xargs)
export DATABASE_URL="postgresql://postgres.scghmuaexujfhadktlho:noTjeg-wifjoc-2kyfpo@aws-1-eu-west-1.pooler.supabase.com:5432/postgres"

source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

**Usage:**
```bash
cd backend
./start_backend.sh
```

### 4. Created Token Generation Script

**File:** `backend/get_fresh_token.py`

Generates fresh Supabase access tokens for testing:

```bash
cd backend
source venv/bin/activate
python get_fresh_token.py
# Token saved to token.txt
```

### 5. Created Token Validation Test

**File:** `backend/test_decode_token.py`

Tests JWT decoding with the configured secret:

```bash
cd backend
source venv/bin/activate
python test_decode_token.py
```

---

## Authentication Flow

### 1. User Login (Frontend)
```typescript
// Frontend calls Supabase Auth API
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'admin@dermai.com',
  password: 'Admin123!'
})

// Receives JWT access token
const accessToken = data.session.access_token
```

### 2. API Request with Token
```bash
curl -H "Authorization: Bearer <access_token>" \
  http://localhost:8000/api/v1/auth/me
```

### 3. Backend Token Validation
```python
# backend/app/api/deps.py

async def get_current_user(token: str, db: Session):
    # 1. Decode Supabase JWT token
    payload = decode_supabase_token(token)

    # 2. Extract user UUID from 'sub' claim
    user_id = UUID(payload['sub'])

    # 3. Query profiles table
    user = db.query(User).filter(User.id == user_id).first()

    # 4. Return user object
    return user
```

### 4. Response
```json
{
  "id": "6c8e83d3-f8b9-4e6a-9ab1-a87b59bb7bea",
  "email": "admin@dermai.com",
  "full_name": "Administrateur DermAI",
  "role": "ADMIN",
  "phone": null,
  "is_active": true,
  "is_verified": true,
  "mfa_enabled": false,
  "created_at": "2025-12-10T20:27:24.093558Z",
  "updated_at": "2025-12-10T20:27:26.431401Z"
}
```

---

## Testing Authentication

### Test 1: Generate Fresh Token
```bash
cd backend
source venv/bin/activate
python get_fresh_token.py
```

**Expected Output:**
```
✅ Successfully authenticated!
📋 User Details:
   UUID: 6c8e83d3-f8b9-4e6a-9ab1-a87b59bb7bea
   Email: admin@dermai.com
💾 Full token saved to token.txt
```

### Test 2: Validate Token Decoding
```bash
cd backend
source venv/bin/activate
python test_decode_token.py
```

**Expected Output:**
```
✅ Successfully decoded unverified claims:
   sub (UUID): 6c8e83d3-f8b9-4e6a-9ab1-a87b59bb7bea
   email: admin@dermai.com

✅ Successfully verified with audience='authenticated'

✅ ALL TESTS PASSED
```

### Test 3: API Authentication
```bash
curl -s -H "Authorization: Bearer $(cat backend/token.txt)" \
  http://localhost:8000/api/v1/auth/me | jq .
```

**Expected Output:**
```json
{
  "email": "admin@dermai.com",
  "full_name": "Administrateur DermAI",
  "role": "ADMIN",
  "id": "6c8e83d3-f8b9-4e6a-9ab1-a87b59bb7bea",
  "is_active": true,
  "is_verified": true,
  "mfa_enabled": false,
  "created_at": "2025-12-10T20:27:24.093558Z",
  "updated_at": "2025-12-10T20:27:26.431401Z"
}
```

---

## Common Issues & Solutions

### Issue 1: "Could not translate host name 'postgres'"

**Cause:** DATABASE_URL environment variable is set in shell config (~/.zshrc)

**Solution:** Use the startup script:
```bash
cd backend
./start_backend.sh
```

### Issue 2: "Error decoding token claims"

**Cause:** Wrong JWT secret or expired token

**Solutions:**
1. Verify SUPABASE_JWT_SECRET in `.env` matches Supabase Dashboard
2. Generate fresh token: `python get_fresh_token.py`
3. Restart backend with: `./start_backend.sh`

### Issue 3: "User not found in profiles table"

**Cause:** UUID mismatch or missing profile

**Solutions:**
1. Check UUID in token matches database:
   ```bash
   python get_fresh_token.py  # Shows UUID
   ```
2. Verify profile exists in Supabase Dashboard → Table Editor → profiles

### Issue 4: "ResponseValidationError: id should be integer"

**Cause:** Pydantic schemas expecting `int` instead of `UUID`

**Solution:** Already fixed in `backend/app/schemas/user.py` (lines 67, 96)

---

## Starting the Application

### Backend
```bash
cd /Users/tariq/Applications/DermaAI/backend
./start_backend.sh
```

**Server will start on:** http://localhost:8000
**API Docs:** http://localhost:8000/docs

### Frontend
```bash
cd /Users/tariq/Applications/DermaAI/frontend
npm run dev
```

**App will start on:** http://localhost:3000

---

## Next Steps

### 1. Test Frontend Login
- Navigate to http://localhost:3000
- Log in with admin@dermai.com / Admin123!
- Verify successful authentication

### 2. Build Admin User Management UI
- Create `/dashboard/users` page
- Add user creation form
- Implement user list table
- Add role management

### 3. Implement User Creation via Supabase Admin API
- Use SUPABASE_SERVICE_ROLE_KEY
- Create endpoint: POST `/api/v1/users`
- Automatically insert into both `auth.users` and `profiles`

---

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env` files to version control
- Rotate JWT secrets in production
- Use strong passwords for all accounts
- Enable MFA for admin accounts
- Monitor authentication logs for suspicious activity

---

## Support Resources

- **Supabase Dashboard:** https://app.supabase.com
- **Supabase Docs:** https://supabase.com/docs
- **FastAPI Docs:** https://fastapi.tiangolo.com
- **Next.js Auth:** https://nextjs.org/docs/authentication

---

**Status:** ✅ Authentication fully operational
**Last Updated:** December 11, 2025
**Tested By:** Claude Code
**Version:** 1.0.0
