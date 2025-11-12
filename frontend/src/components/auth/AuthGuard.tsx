'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth-store'

interface AuthGuardProps {
  children: React.ReactNode
}

/**
 * AuthGuard - Ensures pages wait for authentication initialization before rendering
 * Prevents race conditions where pages try to fetch data before auth is ready
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const { user, isInitialized } = useAuthStore()

  useEffect(() => {
    // If initialization is complete and user is not authenticated, redirect to login
    if (isInitialized && !user) {
      router.push('/auth/login')
    }
  }, [isInitialized, user, router])

  // Show loading state while initializing auth
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">Initializing...</p>
        </div>
      </div>
    )
  }

  // If initialized but no user, return null (router redirect is happening)
  if (!user) {
    return null
  }

  // User is authenticated, render children
  return <>{children}</>
}
