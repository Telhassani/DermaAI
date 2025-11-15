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
        if (token) {
          localStorage.setItem('access_token', token)
        } else {
          localStorage.removeItem('access_token')
        }
        set({ token })
      },

      setRefreshToken: (refreshToken) => {
        if (refreshToken) {
          localStorage.setItem('refresh_token', refreshToken)
        } else {
          localStorage.removeItem('refresh_token')
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
        } catch (error: any) {
          console.error('Login error:', error)
          toast.error(
            error.response?.data?.detail || 'Erreur de connexion. Vérifiez vos identifiants.'
          )
          throw error
        } finally {
          set({ isLoading: false })
        }
      },

      // Logout method
      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user')
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false, isInitialized: true })
        window.location.href = '/auth/login'
      },

      // Check authentication status
      checkAuth: async () => {
        try {
          const token = localStorage.getItem('access_token')

          if (!token) {
            set({ user: null, token: null, isAuthenticated: false, isInitialized: true })
            return
          }

          const response = await api.auth.me()
          const user = response.data

          set({ user, token, isAuthenticated: true, isInitialized: true })
        } catch (error) {
          console.error('Auth check failed:', error)
          localStorage.removeItem('access_token')
          localStorage.removeItem('user')
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
