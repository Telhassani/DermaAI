/**
 * Error handling utilities
 * Provides type-safe error handling across the application
 */

import { AxiosError } from 'axios'
import { ErrorResponse, ValidationError } from '@/types/api'

/**
 * Type guard to check if an error is an AxiosError
 */
export function isAxiosError(error: unknown): error is AxiosError<ErrorResponse> {
  return error instanceof AxiosError
}

/**
 * Type guard to check if an error is a ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'loc' in error &&
    'msg' in error &&
    'type' in error
  )
}

/**
 * Type guard to check if an error is an array of ValidationErrors
 */
export function isValidationErrorArray(
  error: unknown
): error is ValidationError[] {
  return (
    Array.isArray(error) &&
    error.length > 0 &&
    error.every(isValidationError)
  )
}

/**
 * Get error message from various error types
 * Safely extracts error information with proper type checking
 */
export function getErrorMessage(error: unknown): string {
  // Handle AxiosError
  if (isAxiosError(error)) {
    const data = error.response?.data

    // Check for detail field (common in FastAPI errors)
    if (data?.detail) {
      // If detail is an array, it's validation errors
      if (isValidationErrorArray(data.detail)) {
        const messages = data.detail.map((err) => {
          const field = err.loc?.join(' > ') || 'Field'
          return `${field}: ${err.msg}`
        })
        return messages.join('; ')
      }

      // If detail is a string
      if (typeof data.detail === 'string') {
        return data.detail
      }
    }

    // Check for message field
    if (data?.message && typeof data.message === 'string') {
      return data.message
    }

    // Fallback to status text or generic message
    if (error.response?.status) {
      return getStatusCodeMessage(error.response.status)
    }

    if (error.message) {
      return error.message
    }
  }

  // Handle standard Error
  if (error instanceof Error) {
    return error.message
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error
  }

  // Fallback
  return 'Une erreur inattendue est survenue'
}

/**
 * Get user-friendly message for HTTP status codes
 */
export function getStatusCodeMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'Requête invalide',
    401: 'Session expirée. Veuillez vous reconnecter.',
    403: 'Accès refusé. Permissions insuffisantes.',
    404: 'Ressource non trouvée',
    409: 'Conflit détecté',
    422: 'Erreur de validation',
    500: 'Erreur serveur. Veuillez réessayer plus tard.',
    503: 'Service indisponible. Veuillez réessayer plus tard.',
  }

  return messages[status] || 'Une erreur est survenue'
}

/**
 * Extract validation errors from error response
 * Returns a map of field names to error messages
 */
export function getValidationErrors(
  error: unknown
): Record<string, string> | null {
  if (!isAxiosError(error)) {
    return null
  }

  const data = error.response?.data

  if (!data?.detail || !isValidationErrorArray(data.detail)) {
    return null
  }

  const errors: Record<string, string> = {}

  data.detail.forEach((validationError) => {
    const fieldPath = validationError.loc
      ?.filter((item) => typeof item === 'string')
      .join('.') || 'unknown'

    errors[fieldPath] = validationError.msg
  })

  return Object.keys(errors).length > 0 ? errors : null
}

/**
 * Check if error is due to network issues
 */
export function isNetworkError(error: unknown): boolean {
  if (isAxiosError(error)) {
    return error.message === 'Network Error' || !error.response
  }

  return false
}

/**
 * Check if error is due to timeout
 */
export function isTimeoutError(error: unknown): boolean {
  if (isAxiosError(error)) {
    return error.code === 'ECONNABORTED'
  }

  return false
}

/**
 * Check if error is a client error (4xx)
 */
export function isClientError(error: unknown): boolean {
  if (isAxiosError(error)) {
    const status = error.response?.status
    return status ? status >= 400 && status < 500 : false
  }

  return false
}

/**
 * Check if error is a server error (5xx)
 */
export function isServerError(error: unknown): boolean {
  if (isAxiosError(error)) {
    const status = error.response?.status
    return status ? status >= 500 && status < 600 : false
  }

  return false
}

/**
 * Safely get nested error property with fallback
 */
export function getErrorProperty(
  error: unknown,
  property: string,
  fallback: string = ''
): string {
  try {
    if (isAxiosError(error) && error.response?.data) {
      const value = (error.response.data as any)[property]
      if (typeof value === 'string') {
        return value
      }
    }
  } catch (e) {
    // Silently fail
  }

  return fallback
}

/**
 * Format error for logging while hiding sensitive data
 */
export function formatErrorForLogging(error: unknown): object {
  if (isAxiosError(error)) {
    return {
      status: error.response?.status,
      message: error.message,
      // Don't log full response data due to potential sensitive info
      hasData: !!error.response?.data,
      method: error.config?.method,
      url: error.config?.url,
    }
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack?.split('\n').slice(0, 3), // First 3 stack lines
    }
  }

  return { error: String(error) }
}
