'use client'

import { useEffect, useRef } from 'react'
import { useAuth } from './use-auth'
import { useAuthStore } from '@/lib/stores/auth-store'

export function useAuthInit() {
  const { checkAuth } = useAuth()
  const hasInitialized = useRef(false)

  useEffect(() => {
    // Prevent running initialization multiple times
    if (hasInitialized.current) return
    hasInitialized.current = true

    const initializeAuth = async () => {
      try {
        // Wait for store to be fully hydrated from localStorage
        // The persist middleware takes a moment to restore state
        await new Promise(resolve => setTimeout(resolve, 50))

        const token = localStorage.getItem('access_token')
        console.log('[useAuthInit] Token from localStorage:', token ? token.substring(0, 20) + '...' : 'NOT FOUND')

        if (token) {
          // Token exists, verify it with the backend
          console.log('[useAuthInit] Token found, calling checkAuth()...')
          await checkAuth()
        } else {
          // No token, mark as initialized and unauthenticated
          console.log('[useAuthInit] No token found, marking initialized as unauthenticated')
          useAuthStore.setState({ isInitialized: true })
        }
      } catch (error) {
        console.error('[useAuthInit] Error during auth initialization:', error)
        // Ensure we always mark as initialized even on error
        useAuthStore.setState({ isInitialized: true })
      }
    }

    initializeAuth()
  }, [checkAuth]) // Include checkAuth in dependencies to ensure proper binding
}
