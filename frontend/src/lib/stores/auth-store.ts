'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { User as SupabaseUser, Session } from '@supabase/supabase-js'

export interface User {
  id: string  // UUID from Supabase
  email: string
  full_name: string
  role: 'ADMIN' | 'DOCTOR' | 'SECRETARY' | 'ASSISTANT'
  is_active: boolean
  created_at: string
}

interface AuthStoreState {
  // State
  user: User | null
  supabaseUser: SupabaseUser | null
  session: Session | null
  isInitialized: boolean
  isAuthenticated: boolean
  isLoading: boolean

  // Setters
  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setInitialized: (isInitialized: boolean) => void
  setLoading: (isLoading: boolean) => void

  // Auth methods
  login: (credentials: { email: string; password: string }) => Promise<void>
  loginWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  getAccessToken: () => Promise<string | null>
}

// Use same logic as API client for consistency
const API_URL = typeof window === 'undefined'
  ? (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')

export const useAuthStore = create<AuthStoreState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      supabaseUser: null,
      session: null,
      isInitialized: false,
      isAuthenticated: false,
      isLoading: false,

      // Setter methods
      setUser: (user) => {
        set({ user, isAuthenticated: !!user })
      },

      setSession: (session) => {
        set({
          session,
          supabaseUser: session?.user ?? null,
          isAuthenticated: !!session
        })
      },

      setInitialized: (isInitialized) => {
        set({ isInitialized })
      },

      setLoading: (isLoading) => {
        set({ isLoading })
      },

      // Get access token for API calls
      getAccessToken: async () => {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()
        return session?.access_token ?? null
      },

      // Login method
      login: async (credentials) => {
        try {
          set({ isLoading: true })

          const supabase = createClient()

          // Sign in with Supabase
          const { data, error } = await supabase.auth.signInWithPassword({
            email: credentials.email,
            password: credentials.password,
          })

          if (error) {
            throw new Error(error.message)
          }

          if (!data.session) {
            throw new Error('No session returned from Supabase')
          }

          // Fetch app user data from backend using Supabase token
          const response = await fetch(`${API_URL}/api/v1/auth/me`, {
            headers: {
              'Authorization': `Bearer ${data.session.access_token}`,
              'Content-Type': 'application/json',
            },
          })

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}))
            throw new Error(errorData.detail || 'Failed to fetch user data from backend')
          }

          const appUser: User = await response.json()

          set({
            session: data.session,
            supabaseUser: data.user,
            user: appUser,
            isAuthenticated: true,
            isInitialized: true,
          })

          toast.success(`Bienvenue ${appUser.full_name} !`)
        } catch (error: unknown) {
          console.error('Login error:', error)
          const errorMessage = error instanceof Error ? error.message : 'Erreur de connexion'
          toast.error(errorMessage)
          throw error
        } finally {
          set({ isLoading: false })
        }
      },

      // Login with Google OAuth
      loginWithGoogle: async () => {
        try {
          set({ isLoading: true })

          const supabase = createClient()

          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: `${window.location.origin}/auth/callback`,
            },
          })

          if (error) {
            throw new Error(error.message)
          }

          // The redirect will happen automatically
        } catch (error: unknown) {
          console.error('Google login error:', error)
          const errorMessage = error instanceof Error ? error.message : 'Erreur de connexion Google'
          toast.error(errorMessage)
          set({ isLoading: false })
          throw error
        }
      },

      // Logout method
      logout: async () => {
        try {
          const supabase = createClient()
          await supabase.auth.signOut()
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          // Clear state regardless of API success
          set({
            user: null,
            supabaseUser: null,
            session: null,
            isAuthenticated: false,
            isInitialized: true,
          })
          window.location.href = '/login'
        }
      },

      // Check authentication status
      checkAuth: async () => {
        try {
          const supabase = createClient()
          const { data: { session }, error } = await supabase.auth.getSession()

          if (error || !session) {
            set({
              user: null,
              supabaseUser: null,
              session: null,
              isAuthenticated: false,
              isInitialized: true,
            })
            return
          }

          // Fetch app user data from backend
          const response = await fetch(`${API_URL}/api/v1/auth/me`, {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          })

          if (response.ok) {
            const appUser: User = await response.json()
            set({
              session,
              supabaseUser: session.user,
              user: appUser,
              isAuthenticated: true,
              isInitialized: true,
            })
          } else {
            // Backend rejected the token - clear auth state
            console.warn('Backend rejected Supabase token')
            set({
              user: null,
              supabaseUser: null,
              session: null,
              isAuthenticated: false,
              isInitialized: true,
            })
          }
        } catch (error) {
          console.error('Auth check failed:', error)
          set({
            user: null,
            supabaseUser: null,
            session: null,
            isAuthenticated: false,
            isInitialized: true,
          })
        }
      },
    }),
    {
      name: 'auth-store',
      partialize: () => ({
        // Don't persist any auth state - Supabase handles session persistence
        // We re-verify on each page load via checkAuth()
      }),
    }
  )
)
