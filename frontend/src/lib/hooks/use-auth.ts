/**
 * Authentication hook
 * Provides authentication state and methods
 */

'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api/client'
import { toast } from 'sonner'

// User type
export interface User {
  id: number
  email: string
  full_name: string
  role: 'admin' | 'doctor' | 'secretary' | 'assistant'
  is_active: boolean
  created_at: string
}

// Auth state interface
interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setLoading: (loading: boolean) => void
  logout: () => void
  login: (credentials: { username: string; password: string }) => Promise<void>
  checkAuth: () => Promise<void>
}

// Create auth store with persistence
const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,

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

      setLoading: (isLoading) => {
        set({ isLoading })
      },

      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        set({ user: null, token: null, isAuthenticated: false })
        window.location.href = '/auth/login'
      },

      login: async (credentials) => {
        try {
          set({ isLoading: true })

          // Create form data for OAuth2 password flow
          const formData = new URLSearchParams()
          formData.append('username', credentials.username)
          formData.append('password', credentials.password)

          // Login request
          const response = await api.auth.login(formData as any)
          const { access_token } = response.data

          // Save token
          get().setToken(access_token)

          // Fetch user data
          const userResponse = await api.auth.me()
          const user = userResponse.data

          // Save user
          get().setUser(user)

          toast.success(`Bienvenue ${user.full_name} !`)

          // Redirect to dashboard
          window.location.href = '/dashboard'
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

      checkAuth: async () => {
        try {
          const token = localStorage.getItem('access_token')

          if (!token) {
            set({ user: null, token: null, isAuthenticated: false })
            return
          }

          // Verify token by fetching user data
          const response = await api.auth.me()
          const user = response.data

          set({ user, token, isAuthenticated: true })
        } catch (error) {
          console.error('Auth check failed:', error)
          localStorage.removeItem('access_token')
          localStorage.removeItem('user')
          set({ user: null, token: null, isAuthenticated: false })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
)

// Hook export
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
  }
}
