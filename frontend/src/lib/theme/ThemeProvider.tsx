/**
 * Theme Provider
 * Context provider for light/dark mode management
 */

'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

const STORAGE_KEY = 'dermaai-theme'

/**
 * Get system theme preference
 */
function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light'

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Get stored theme or default to system
 */
function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'system'

  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
  return stored || 'system'
}

/**
 * Resolve theme to actual light/dark value
 */
function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === 'system') {
    return getSystemTheme()
  }
  return theme
}

/**
 * Theme Provider Component
 */
export function ThemeProvider({
  children,
  defaultTheme = 'system',
}: {
  children: React.ReactNode
  defaultTheme?: Theme
}) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light')
  const [mounted, setMounted] = useState(false)

  // Initialize theme on mount
  useEffect(() => {
    const storedTheme = getStoredTheme()
    setThemeState(storedTheme)
    setResolvedTheme(resolveTheme(storedTheme))
    setMounted(true)
  }, [])

  // Update resolved theme when theme changes
  useEffect(() => {
    const resolved = resolveTheme(theme)
    setResolvedTheme(resolved)

    // Update document class
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(resolved)

    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]')
    if (metaThemeColor) {
      metaThemeColor.setAttribute(
        'content',
        resolved === 'dark' ? '#09090b' : '#ffffff'
      )
    }
  }, [theme])

  // Listen to system theme changes
  useEffect(() => {
    if (theme !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const handleChange = () => {
      setResolvedTheme(getSystemTheme())
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  // Set theme function
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem(STORAGE_KEY, newTheme)
  }

  // Toggle between light and dark
  const toggleTheme = () => {
    const newTheme = resolvedTheme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }

  // Prevent flash of wrong theme
  if (!mounted) {
    return (
      <>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('${STORAGE_KEY}') || 'system';
                  var resolved = theme === 'system'
                    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                    : theme;
                  document.documentElement.classList.add(resolved);
                } catch (e) {}
              })();
            `,
          }}
        />
        {children}
      </>
    )
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

/**
 * useTheme Hook
 */
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
