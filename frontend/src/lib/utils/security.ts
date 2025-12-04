/**
 * Security utilities for frontend input sanitization and CSRF protection
 * Provides tools to prevent XSS, injection attacks, and CSRF
 */

/**
 * Sanitize user input to prevent XSS attacks
 * Removes potentially dangerous HTML/JavaScript
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') {
    return ''
  }

  // Create a temporary element to leverage browser's HTML parsing
  const tempDiv = document.createElement('div')
  tempDiv.textContent = input

  // This converts dangerous characters to their HTML entity equivalents
  return tempDiv.innerHTML
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (char) => map[char])
}

/**
 * Validate and sanitize message content
 * Removes scripts and potentially harmful content
 */
export function sanitizeMessageContent(content: string): string {
  // Remove script tags and their content
  let sanitized = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

  // Remove event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '')

  // Remove iframe tags
  sanitized = sanitized.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')

  // Remove dangerous attributes
  sanitized = sanitized.replace(
    /\b(action|background|codebase|classid|data|dynsrc|formaction|href|longdesc|manifest|poster|src|srcdoc|usemap)\s*=\s*["']javascript:[^"']*["']/gi,
    ''
  )

  return sanitized.trim()
}

/**
 * Validate file upload safety
 */
export function validateFileUploadSafety(
  file: File
): { isValid: boolean; error?: string } {
  // Check file size
  const maxSize = 25 * 1024 * 1024 // 25 MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File too large (max ${maxSize / 1024 / 1024}MB)`,
    }
  }

  // Check file size minimum (prevent empty files)
  if (file.size < 100) {
    return {
      isValid: false,
      error: 'File too small (minimum 100 bytes)',
    }
  }

  // Whitelist allowed MIME types
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
  ]

  if (!allowedMimeTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type not allowed. Allowed: ${allowedMimeTypes.join(', ')}`,
    }
  }

  // Validate filename
  const filename = file.name
  if (!filename || filename.length > 255) {
    return {
      isValid: false,
      error: 'Invalid filename',
    }
  }

  // Check for dangerous characters in filename
  if (/[<>:"|?*\x00-\x1f]/.test(filename)) {
    return {
      isValid: false,
      error: 'Filename contains invalid characters',
    }
  }

  return { isValid: true }
}

/**
 * Generate CSRF token from meta tag
 * Should be in HTML: <meta name="csrf-token" content="...">
 */
export function getCsrfToken(): string | null {
  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
  return token || null
}

/**
 * Add CSRF token to request headers
 */
export function withCsrfToken(headers: Record<string, string>): Record<string, string> {
  const csrfToken = getCsrfToken()
  if (csrfToken) {
    return {
      ...headers,
      'X-CSRF-Token': csrfToken,
    }
  }
  return headers
}

/**
 * Validate URL to prevent open redirect attacks
 */
export function isValidRedirectUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }

  // Only allow relative URLs or URLs on the same domain
  if (url.startsWith('/')) {
    return true
  }

  try {
    const urlObj = new URL(url, window.location.origin)
    return urlObj.origin === window.location.origin
  } catch {
    return false
  }
}

/**
 * Sanitize URL parameters
 */
export function sanitizeUrlParams(params: Record<string, unknown>): Record<string, string> {
  const sanitized: Record<string, string> = {}

  for (const [key, value] of Object.entries(params)) {
    // Sanitize key
    if (!/^[a-zA-Z0-9_-]+$/.test(key)) {
      continue
    }

    // Sanitize value
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value)
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      sanitized[key] = String(value)
    }
  }

  return sanitized
}

/**
 * Rate limit check (client-side)
 * Returns true if action should be rate limited
 */
export class ClientRateLimiter {
  private attempts: Map<string, number[]> = new Map()
  private limit: number
  private windowMs: number

  constructor(limit: number = 10, windowMs: number = 60000) {
    this.limit = limit
    this.windowMs = windowMs
  }

  isRateLimited(key: string): boolean {
    const now = Date.now()
    const attempts = this.attempts.get(key) || []

    // Remove old attempts outside the window
    const recentAttempts = attempts.filter((time) => now - time < this.windowMs)

    if (recentAttempts.length >= this.limit) {
      return true
    }

    // Add new attempt
    recentAttempts.push(now)
    this.attempts.set(key, recentAttempts)

    return false
  }

  reset(key: string): void {
    this.attempts.delete(key)
  }
}

/**
 * Content Security Policy helper
 * Provides utility functions for CSP compliance
 */
export function isCSPCompliant(element: HTMLElement): boolean {
  // Check if element uses inline styles (CSP would block these)
  if (element.getAttribute('style')) {
    console.warn('CSP Warning: Inline styles detected on element:', element)
    return false
  }

  // Check for inline event handlers
  const inlineHandlers = [
    'onclick',
    'onchange',
    'onsubmit',
    'onload',
    'onerror',
    'onmouseover',
    'onmouseout',
  ]

  for (const handler of inlineHandlers) {
    if (element.getAttribute(handler)) {
      console.warn(`CSP Warning: Inline event handler (${handler}) detected on element:`, element)
      return false
    }
  }

  return true
}
