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
    token: store.token,
    isLoading: store.isLoading,
    isAuthenticated: store.isAuthenticated,
    login: store.login,
    logout: store.logout,
    checkAuth: store.checkAuth,
    setUser: store.setUser,
    setToken: store.setToken,
    setLoading: store.setLoading,
    isInitialized: store.isInitialized,
  }
}
