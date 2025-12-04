/**
 * Logging utility for frontend error tracking and monitoring
 * Supports both console logging and external services like Sentry
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: any
}

/**
 * Logger class for structured logging
 * Can be extended to integrate with Sentry or other monitoring services
 */
class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'

  /**
   * Log a debug message (development only)
   */
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, context)
    }
  }

  /**
   * Log an info message
   */
  info(message: string, context?: LogContext) {
    console.info(`[INFO] ${message}`, context)
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext) {
    console.warn(`[WARN] ${message}`, context)
  }

  /**
   * Log an error message and optionally send to external service
   */
  error(message: string, context?: LogContext) {
    console.error(`[ERROR] ${message}`, context)

    // Send to external error tracking service (e.g., Sentry)
    // This would be configured in a production environment
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(new Error(message), {
        contexts: {
          application: context,
        },
      })
    }
  }

  /**
   * Capture an exception
   */
  captureException(error: Error, context?: LogContext) {
    console.error('[EXCEPTION]', error, context)

    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          application: context,
        },
      })
    }
  }

  /**
   * Clear all log context
   */
  clearContext() {
    // Implementation depends on logger backend
  }
}

// Create singleton instance
export const logger = new Logger()

/**
 * Error tracking decorator for async functions
 * Useful for automatically catching and logging errors in event handlers
 */
export function withErrorTracking<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context?: LogContext
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args)
    } catch (error) {
      logger.captureException(error instanceof Error ? error : new Error(String(error)), {
        ...context,
        args: args.length > 0 ? `${args.length} arguments` : 'no arguments',
      })
      throw error
    }
  }) as T
}

/**
 * Error boundary for try-catch blocks
 * Returns error or undefined on success
 */
export async function tryAsync<T>(
  fn: () => Promise<T>,
  onError?: (error: Error) => void
): Promise<[Error | null, T | null]> {
  try {
    const result = await fn()
    return [null, result]
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    if (onError) {
      onError(err)
    }
    logger.error(err.message)
    return [err, null]
  }
}

/**
 * Create a structured log entry
 */
export function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext
) {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    context,
  }
}
