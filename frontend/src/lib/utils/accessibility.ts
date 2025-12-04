/**
 * Accessibility utilities for WCAG 2.1 compliance
 * Provides tools for ARIA labels, keyboard navigation, focus management, etc.
 */

/**
 * Announce a message to screen readers
 * Useful for dynamic content updates
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
) {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only' // Screen reader only
  announcement.textContent = message

  document.body.appendChild(announcement)

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * Manage focus trap for modals/dialogs
 * Keeps focus within the modal while it's open
 */
export class FocusTrap {
  private element: HTMLElement
  private previousActiveElement: Element | null
  private handleKeyDown: (e: KeyboardEvent) => void

  constructor(element: HTMLElement) {
    this.element = element
    this.previousActiveElement = document.activeElement
    this.handleKeyDown = this.onKeyDown.bind(this)
  }

  activate() {
    // Save currently focused element
    this.previousActiveElement = document.activeElement

    // Focus first focusable element in the trap
    const focusableElements = this.getFocusableElements()
    if (focusableElements.length > 0) {
      focusableElements[0].focus()
    }

    // Add keyboard listener
    this.element.addEventListener('keydown', this.handleKeyDown)

    // Set aria-modal for screen readers
    if (!this.element.hasAttribute('role')) {
      this.element.setAttribute('role', 'dialog')
    }
  }

  deactivate() {
    // Remove keyboard listener
    this.element.removeEventListener('keydown', this.handleKeyDown)

    // Restore focus to previously focused element
    if (this.previousActiveElement instanceof HTMLElement) {
      this.previousActiveElement.focus()
    }
  }

  private onKeyDown(e: KeyboardEvent) {
    if (e.key !== 'Tab') {
      return
    }

    const focusableElements = this.getFocusableElements()
    if (focusableElements.length === 0) {
      return
    }

    const firstElement = focusableElements[0] as HTMLElement
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
    const activeElement = document.activeElement

    // Shift + Tab on first element
    if (e.shiftKey && activeElement === firstElement) {
      e.preventDefault()
      lastElement.focus()
    }
    // Tab on last element
    else if (!e.shiftKey && activeElement === lastElement) {
      e.preventDefault()
      firstElement.focus()
    }
  }

  private getFocusableElements(): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'textarea:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(', ')

    return Array.from(this.element.querySelectorAll(focusableSelectors))
  }
}

/**
 * Generate unique IDs for ARIA associations
 */
export function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Check if element is visible to screen readers
 */
export function isAccessible(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element)

  // Check for display: none
  if (style.display === 'none') {
    return false
  }

  // Check for visibility: hidden
  if (style.visibility === 'hidden') {
    return false
  }

  // Check for aria-hidden="true"
  if (element.getAttribute('aria-hidden') === 'true') {
    return false
  }

  // Check if element has width and height
  if (element.offsetWidth === 0 && element.offsetHeight === 0) {
    return false
  }

  // Check parent elements
  let parent = element.parentElement
  while (parent) {
    const parentStyle = window.getComputedStyle(parent)
    if (parentStyle.display === 'none') {
      return false
    }
    parent = parent.parentElement
  }

  return true
}

/**
 * Get accessible name of an element (for debugging/testing)
 */
export function getAccessibleName(element: HTMLElement): string {
  // Check for aria-label
  const ariaLabel = element.getAttribute('aria-label')
  if (ariaLabel) {
    return ariaLabel
  }

  // Check for aria-labelledby
  const labelledBy = element.getAttribute('aria-labelledby')
  if (labelledBy) {
    const label = document.getElementById(labelledBy)
    if (label) {
      return label.textContent || ''
    }
  }

  // Check for associated label
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`)
    if (label) {
      return label.textContent || ''
    }
  }

  // Check for placeholder
  if (element instanceof HTMLInputElement && element.placeholder) {
    return element.placeholder
  }

  // Check for title
  const title = element.getAttribute('title')
  if (title) {
    return title
  }

  // Fall back to text content
  return element.textContent || ''
}

/**
 * Skip link generator
 * Creates a "Skip to main content" link for keyboard navigation
 */
export function createSkipLink(): HTMLElement {
  const skipLink = document.createElement('a')
  skipLink.href = '#main-content'
  skipLink.textContent = 'Skip to main content'
  skipLink.className = 'sr-only focus:not-sr-only'
  skipLink.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    background: #000;
    color: #fff;
    padding: 0.5rem 1rem;
    text-decoration: none;
    z-index: 9999;
  `

  return skipLink
}

/**
 * Keyboard shortcut helper
 * Registers keyboard shortcuts with accessible descriptions
 */
export class KeyboardShortcuts {
  private shortcuts: Map<string, () => void> = new Map()
  private handleKeyDown: (e: KeyboardEvent) => void

  constructor() {
    this.handleKeyDown = this.onKeyDown.bind(this)
  }

  register(
    key: string,
    ctrl: boolean = false,
    shift: boolean = false,
    callback: () => void
  ) {
    const shortcutKey = this.buildKey(key, ctrl, shift)
    this.shortcuts.set(shortcutKey, callback)
  }

  activate() {
    document.addEventListener('keydown', this.handleKeyDown)
  }

  deactivate() {
    document.removeEventListener('keydown', this.handleKeyDown)
  }

  private onKeyDown(e: KeyboardEvent) {
    const shortcutKey = this.buildKey(e.key, e.ctrlKey || e.metaKey, e.shiftKey)
    const callback = this.shortcuts.get(shortcutKey)

    if (callback) {
      e.preventDefault()
      callback()
    }
  }

  private buildKey(key: string, ctrl: boolean, shift: boolean): string {
    const parts = []
    if (ctrl) parts.push('ctrl')
    if (shift) parts.push('shift')
    parts.push(key.toLowerCase())
    return parts.join('+')
  }

  getDescription(): string {
    const descriptions: string[] = []

    this.shortcuts.forEach((_, key) => {
      descriptions.push(`${key}: ${key}`)
    })

    return descriptions.join(', ')
  }
}

/**
 * ARIA live region announcer
 * Useful for dynamic updates that should be announced to screen readers
 */
export class AriaLiveRegion {
  private element: HTMLElement
  private timeout: NodeJS.Timeout | null = null

  constructor(priority: 'polite' | 'assertive' = 'polite') {
    this.element = document.createElement('div')
    this.element.setAttribute('role', 'status')
    this.element.setAttribute('aria-live', priority)
    this.element.setAttribute('aria-atomic', 'true')
    this.element.className = 'sr-only'
    this.element.id = `aria-live-${Math.random().toString(36).slice(2)}`
    document.body.appendChild(this.element)
  }

  announce(message: string, duration: number = 1000) {
    // Clear existing timeout
    if (this.timeout) {
      clearTimeout(this.timeout)
    }

    // Update content
    this.element.textContent = message

    // Clear after duration
    this.timeout = setTimeout(() => {
      this.element.textContent = ''
    }, duration)
  }

  remove() {
    if (this.timeout) {
      clearTimeout(this.timeout)
    }
    this.element.remove()
  }
}

/**
 * Test keyboard navigation on a component
 * Useful for accessibility testing
 */
export function testKeyboardNavigation(element: HTMLElement): boolean {
  const focusableElements = [
    'a[href]',
    'button',
    'input',
    'textarea',
    'select',
    '[tabindex]:not([tabindex="-1"])',
  ]
    .map((selector) => element.querySelectorAll(selector))
    .reduce((acc, list) => [...acc, ...list], [])

  if (focusableElements.length === 0) {
    console.warn('No keyboard-navigable elements found')
    return false
  }

  // Test that all focusable elements are reachable
  for (const el of focusableElements) {
    if (isAccessible(el as HTMLElement)) {
      continue
    }
    console.warn('Found inaccessible focusable element:', el)
    return false
  }

  return true
}
