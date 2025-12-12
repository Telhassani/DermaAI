# Dashboard Loading Issue - Debugging Guide

**Date:** December 11, 2025
**Status:** 🔍 IN PROGRESS - Login works, dashboard redirect fails

## Current Situation

✅ **What's Working:**
- Login successful (backend logs confirm authentication)
- Supabase JWT token validation working
- Backend API responds correctly with user data
- CORS configured properly

❌ **What's Not Working:**
- After login, page redirects to `/dashboard`
- Dashboard loads briefly but then redirects back to `/login`
- User session not persisting after page reload

## Root Cause Analysis

The issue is in the authentication flow after login:

1. **Login happens** → User logs in at `/login` ✅
2. **Auth store updated** → `user` and `session` set in Zustand store ✅
3. **Redirect to dashboard** → `window.location.href = '/dashboard'` triggers full page reload ✅
4. **Page reloads** → `useAuthInit` hook runs on dashboard ✅
5. **Session check fails** → `checkAuth()` can't find Supabase session ❌
6. **Redirect to login** → AuthGuard sees no user, redirects back ❌

## The Problem

Looking at the code in `/frontend/src/lib/stores/auth-store.ts` (lines 189-243):

```typescript
checkAuth: async () => {
  const supabase = createClient()
  const { data: { session }, error } = await supabase.auth.getSession()

  if (error || !session) {
    // No session found - user not authenticated
    set({ isInitialized: true, isAuthenticated: false })
    return
  }

  // Fetch user from backend
  const response = await fetch(`${API_URL}/api/v1/auth/me`, {
    headers: { 'Authorization': `Bearer ${session.access_token}` }
  })

  if (response.ok) {
    const appUser = await response.json()
    set({ user: appUser, session, isAuthenticated: true, isInitialized: true })
  } else {
    set({ isInitialized: true, isAuthenticated: false })
  }
}
```

When `checkAuth()` runs after page reload, **`supabase.auth.getSession()` returns no session**, likely because:
- Supabase session cookies aren't being set correctly
- The Supabase client isn't storing sessions in localStorage/cookies properly

## Browser Console Investigation

Open your browser's developer console (F12) and check:

1. **Console Logs:**
   - Look for `[useAuthInit]` logs showing what's happening during initialization
   - Look for `[AuthGuard]` logs showing authentication state

2. **Application Storage:**
   - Open DevTools → Application → Local Storage → http://localhost:3000
   - Check if Supabase is storing session data (look for keys like `supabase.auth.token`)
   - Open Cookies → http://localhost:3000
   - Check if there are any Supabase session cookies

3. **Network Tab:**
   - Filter for requests to `/api/v1/auth/me`
   - Check if the Authorization header is being sent
   - Check the response status and body

## Expected Console Output

After successful login, you should see:
```
[LoginForm] Login successful, redirecting to dashboard...
[useAuthInit] Token from localStorage: eyJhbGciOiJIUzI1NiI...
[useAuthInit] Calling checkAuth() to verify session (cookie or token)...
[AuthGuard] State check: { isInitialized: true, hasUser: true }
```

If instead you see:
```
[useAuthInit] Token from localStorage: NOT FOUND
[AuthGuard] State check: { isInitialized: false, hasUser: false }
[AuthGuard] Timeout reached, redirecting to login...
```

This confirms that Supabase session is not persisting after page reload.

## Potential Solutions

### Solution 1: Store Access Token in LocalStorage (Temporary Fix)

Modify the login function to manually store the token:

**File:** `frontend/src/lib/stores/auth-store.ts` (line 86-138)

Add after line 104:
```typescript
// Store token in localStorage for persistence
localStorage.setItem('supabase.auth.token', JSON.stringify(data.session))
```

### Solution 2: Use Supabase's Built-in Session Persistence

Check if the Supabase client is configured for localStorage persistence:

**File:** `frontend/src/lib/supabase/client.ts`

Ensure it looks like this:
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,  // ← Ensure this is true
        storageKey: 'supabase.auth.token',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
    }
  )
}
```

### Solution 3: Skip Full Page Reload

Instead of `window.location.href = '/dashboard'`, use Next.js router:

**File:** `frontend/src/components/forms/login-form.tsx` (line 47)

Change from:
```typescript
window.location.href = '/dashboard'
```

To:
```typescript
router.push('/dashboard')
router.refresh() // Optional: refresh server components
```

This avoids the full page reload and preserves the Zustand store state.

## Next Steps for Debugging

1. **Open browser console** and log in again
2. **Check console logs** - share any error messages or unexpected output
3. **Check Application storage** - see if Supabase session data is stored
4. **Test Solution 3 first** (use router.push instead of window.location.href)

## Status Update Needed

Please share:
1. What you see in the browser console after login
2. What's in Local Storage under Application → Local Storage → http://localhost:3000
3. Any error messages in the console

---

**Last Updated:** December 11, 2025
**Next Action:** Check browser console and apply Solution 3
