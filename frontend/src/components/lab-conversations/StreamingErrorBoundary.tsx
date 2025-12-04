'use client'

import React, { ErrorInfo, ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/utils/logger'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorCount: number
}

/**
 * Error Boundary for streaming components
 * Catches errors in streaming chat messages and displays graceful fallback UI
 * Logs errors to Sentry for monitoring
 */
export class StreamingErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorCount: 0,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('StreamingErrorBoundary caught error:', error, errorInfo)
    }

    // Log to external service (Sentry)
    logger.error('StreamingErrorBoundary', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      context: 'streaming_chat',
    })

    // Update error count
    this.setState((prevState) => ({
      errorCount: prevState.errorCount + 1,
    }))

    // If too many errors, might indicate a critical issue
    if (this.state.errorCount > 3) {
      logger.error('StreamingErrorBoundary: Multiple errors detected', {
        count: this.state.errorCount + 1,
        context: 'streaming_chat',
      })
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorCount: 0,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <StreamingErrorFallback
            error={this.state.error}
            onReset={this.handleReset}
          />
        )
      )
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error: Error | null
  onReset: () => void
}

/**
 * Fallback UI displayed when streaming encounters an error
 */
export function StreamingErrorFallback({
  error,
  onReset,
}: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-red-200 bg-red-50 p-6">
      <div className="flex items-center gap-3">
        <AlertCircle className="h-6 w-6 text-red-600" />
        <div>
          <h3 className="font-semibold text-red-900">Streaming Error</h3>
          <p className="text-sm text-red-700">
            {error?.message || 'An unexpected error occurred while streaming the response.'}
          </p>
        </div>
      </div>

      {process.env.NODE_ENV === 'development' && error?.stack && (
        <details className="w-full text-left">
          <summary className="cursor-pointer text-sm font-mono text-red-600 hover:text-red-700">
            Stack trace
          </summary>
          <pre className="mt-2 overflow-auto rounded bg-red-100 p-2 text-xs text-red-900">
            {error.stack}
          </pre>
        </details>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try Again
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            // Could redirect to support or reload page
            window.location.reload()
          }}
        >
          Reload Page
        </Button>
      </div>

      <p className="text-xs text-red-600">
        If the problem persists, please contact support.
      </p>
    </div>
  )
}

/**
 * Hook to use error boundary functionality
 * Allows child components to trigger error boundary programmatically
 */
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null)

  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])

  return {
    captureError: setError,
    resetError: () => setError(null),
  }
}
