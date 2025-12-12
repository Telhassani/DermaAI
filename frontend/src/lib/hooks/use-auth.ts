/**
 * Authentication hook
 * Re-exports from unified auth-store for backward compatibility
 */

'use client'

import { useAuthStore } from '@/lib/stores/auth-store'

/**
 * useAuth hook - provides authentication state and methods
 * This is a simple re-export wrapper for backward compatibility
 */
export function useAuth() {
  const store = useAuthStore()

  return {
    user: store.user,
    session: store.session,
    isLoading: store.isLoading,
    isAuthenticated: store.isAuthenticated,
    login: store.login,
    logout: store.logout,
    checkAuth: store.checkAuth,
    setUser: store.setUser,
    setSession: store.setSession,
    setLoading: store.setLoading,
    isInitialized: store.isInitialized,
    getAccessToken: store.getAccessToken,
  }
}
