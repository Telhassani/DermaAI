'use client'

import { useAuthInit } from '@/lib/hooks/use-auth-init'

/**
 * AuthInitializer Component
 * Initializes authentication on app startup by fetching user data from stored token
 * This ensures user info is available even after page refresh
 */
export function AuthInitializer() {
  useAuthInit()
  return null // This component doesn't render anything, just runs the initialization hook
}
