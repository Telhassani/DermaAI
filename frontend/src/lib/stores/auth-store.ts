'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@/lib/api/client'
import { toast } from 'sonner'

export interface User {
  id: number
  email: string
  full_name: string
  role: 'admin' | 'doctor' | 'secretary' | 'assistant'
  is_active: boolean
  created_at: string
}

interface AuthStoreState {
  // State
  user: User | null
  token: string | null
  refreshToken: string | null
  isInitialized: boolean
  isAuthenticated: boolean
  isLoading: boolean

  // Setters
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setRefreshToken: (refreshToken: string | null) => void
  setInitialized: (isInitialized: boolean) => void
  setLoading: (isLoading: boolean) => void
  setState: (state: Partial<AuthStoreState>) => void

  // Auth methods
  login: (credentials: { username: string; password: string }) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      token: null,
      refreshToken: null,
      isInitialized: false,
      isAuthenticated: false,
      isLoading: false,

      // Setter methods
      setUser: (user) => {
        set({ user, isAuthenticated: !!user })
      },

      setToken: (token) => {
        // Prefer httpOnly cookies set by backend
        // Keep localStorage as fallback for backward compatibility with older deployments
        if (token) {
          try {
            localStorage.setItem('access_token', token)
          } catch {
            // localStorage may be disabled or full; httpOnly cookies will handle auth
          }
        } else {
          try {
            localStorage.removeItem('access_token')
          } catch {
            // Ignore localStorage errors
          }
        }
        set({ token })
      },

      setRefreshToken: (refreshToken) => {
        // Prefer httpOnly cookies set by backend
        // Keep localStorage as fallback for backward compatibility
        if (refreshToken) {
          try {
            localStorage.setItem('refresh_token', refreshToken)
          } catch {
            // localStorage may be disabled; httpOnly cookies will handle auth
          }
        } else {
          try {
            localStorage.removeItem('refresh_token')
          } catch {
            // Ignore localStorage errors
          }
        }
        set({ refreshToken })
      },

      setInitialized: (isInitialized) => {
        set({ isInitialized })
      },

      setLoading: (isLoading) => {
        set({ isLoading })
      },

      setState: (newState) => {
        set(newState)
      },

      // Login method
      login: async (credentials) => {
        try {
          set({ isLoading: true })
          // Pass credentials directly - api.auth.login handles FormData conversion
          const response = await api.auth.login(credentials)
          const { access_token, refresh_token } = response.data

          get().setToken(access_token)
          get().setRefreshToken(refresh_token)

          const userResponse = await api.auth.me()
          const user = userResponse.data

          get().setUser(user)
          get().setInitialized(true)

          toast.success(`Bienvenue ${user.full_name} !`)
          // Return success - caller will handle navigation with Next.js router
          return
        } catch (error: unknown) {
          console.error('Login error:', error)
          const errorMessage = error instanceof Error ? error.message : 'Erreur de connexion. Vérifiez vos identifiants.'
          toast.error(errorMessage)
          throw error
        } finally {
          set({ isLoading: false })
        }
      },

      // Logout method
      logout: () => {
        // Clear localStorage as fallback
        try {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          localStorage.removeItem('user')
        } catch {
          // Ignore localStorage errors
        }
        // Clear state
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isInitialized: true })
        // Backend will clear httpOnly cookies via /logout endpoint
        window.location.href = '/auth/login'
      },

      // Check authentication status
      checkAuth: async () => {
        try {
          // Try to get user info - if httpOnly cookies are valid, this will work
          // If not, the backend will return 401 and we'll catch it
          const response = await api.auth.me()
          const user = response.data
          // Treat httpOnly cookie as valid if /me endpoint succeeds
          set({ user, isAuthenticated: true, isInitialized: true })
        } catch (error) {
          // Auth failed - clear local state but trust httpOnly cookie clearing
          console.error('Auth check failed:', error)
          try {
            localStorage.removeItem('access_token')
            localStorage.removeItem('user')
          } catch {
            // Ignore localStorage errors
          }
          set({ user: null, token: null, isAuthenticated: false, isInitialized: true })
        }
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isInitialized: state.isInitialized,
      }),
    }
  )
)
