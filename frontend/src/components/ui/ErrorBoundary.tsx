/**
 * Error Boundary Component
 * Catches React errors and displays fallback UI
 */

'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { cn } from '@/lib/theme'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo)

    this.setState({
      error,
      errorInfo,
    })
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleGoHome = () => {
    window.location.href = '/dashboard'
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="flex min-h-screen items-center justify-center bg-mono-50 p-4 dark:bg-mono-950">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={cn(
              'w-full max-w-2xl rounded-3xl border border-mono-200 bg-white p-12',
              'shadow-soft-lg',
              'dark:border-mono-800 dark:bg-mono-900'
            )}
          >
            {/* Icon */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, duration: 0.3 }}
              className="mb-6 flex justify-center"
            >
              <div
                className={cn(
                  'flex h-24 w-24 items-center justify-center rounded-3xl',
                  'bg-gradient-to-br from-danger/20 to-danger/10',
                  'border border-danger/30'
                )}
              >
                <AlertTriangle className="h-12 w-12 text-danger" />
              </div>
            </motion.div>

            {/* Title */}
            <h1 className="mb-3 text-center text-3xl font-bold text-mono-900 dark:text-mono-100">
              Oups, une erreur est survenue
            </h1>

            {/* Description */}
            <p className="mb-8 text-center text-mono-600 dark:text-mono-400">
              Nous sommes désolés, quelque chose s'est mal passé. Veuillez réessayer ou
              retourner à l'accueil.
            </p>

            {/* Error details (development only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={cn(
                  'mb-8 rounded-2xl border border-mono-200 bg-mono-50 p-6',
                  'dark:border-mono-800 dark:bg-mono-950'
                )}
              >
                <h3 className="mb-2 font-semibold text-mono-900 dark:text-mono-100">
                  Détails de l'erreur (mode développement)
                </h3>
                <div className="max-h-64 overflow-auto rounded-lg bg-mono-900 p-4 font-mono text-xs text-mono-100">
                  <pre className="whitespace-pre-wrap">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={this.handleReset}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-xl px-6 py-3',
                  'bg-gradient-to-r from-accent-600 to-accent-500 text-white',
                  'font-medium shadow-[0_4px_14px_0_rgba(100,116,139,0.39)]',
                  'transition-all duration-200 hover:shadow-[0_6px_20px_rgba(100,116,139,0.5)]',
                  'active:scale-95'
                )}
              >
                <RefreshCw className="h-5 w-5" />
                Réessayer
              </button>

              <button
                onClick={this.handleGoHome}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-xl px-6 py-3',
                  'border border-mono-200 bg-white text-mono-700',
                  'font-medium transition-all duration-200',
                  'hover:border-mono-300 hover:bg-mono-50',
                  'active:scale-95',
                  'dark:border-mono-700 dark:bg-mono-800 dark:text-mono-200',
                  'dark:hover:border-mono-600 dark:hover:bg-mono-700'
                )}
              >
                <Home className="h-5 w-5" />
                Retour à l'accueil
              </button>
            </div>
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Functional wrapper for use in function components
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}
