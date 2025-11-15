'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/stores/auth-store'

interface AuthGuardProps {
  children: React.ReactNode
}

/**
 * AuthGuard - Ensures pages wait for authentication initialization before rendering
 * Prevents race conditions where pages try to fetch data before auth is ready
 * Has a 5-second timeout fallback to prevent infinite spinners
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter()
  const user = useAuthStore((state) => state.user)
  const isInitialized = useAuthStore((state) => state.isInitialized)
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    // Timeout fallback - if initialization takes too long, redirect to login
    const timeout = setTimeout(() => {
      if (!isInitialized && !user) {
        setTimedOut(true)
        router.push('/login')
      }
    }, 5000)

    return () => clearTimeout(timeout)
  }, [isInitialized, user, router])

  useEffect(() => {
    // If initialization is complete and user is not authenticated, redirect to login
    if (isInitialized && !user) {
      router.push('/login')
    }
  }, [isInitialized, user, router])

  // Show loading state only while initializing AND no user data exists
  // If we have user data, show content even if initialization is pending
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">
            {!isInitialized ? 'Initializing...' : 'Redirecting...'}
          </p>
        </div>
      </div>
    )
  }

  // User exists, render children (even if initialization not yet complete)
  return <>{children}</>
}
