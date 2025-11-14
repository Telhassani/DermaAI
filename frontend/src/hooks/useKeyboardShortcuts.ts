/**
 * Keyboard Shortcuts Hook
 * Register and handle keyboard shortcuts
 */

'use client'

import { useEffect, useCallback, useRef } from 'react'

export interface KeyboardShortcut {
  key: string
  ctrl?: boolean
  shift?: boolean
  alt?: boolean
  meta?: boolean
  description?: string
  callback: (event: KeyboardEvent) => void
}

/**
 * useKeyboardShortcut
 * Register a single keyboard shortcut
 */
export function useKeyboardShortcut(shortcut: KeyboardShortcut) {
  const callbackRef = useRef(shortcut.callback)

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = shortcut.callback
  }, [shortcut.callback])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const {
        key,
        ctrl = false,
        shift = false,
        alt = false,
        meta = false,
      } = shortcut

      // Check if key matches
      const keyMatches = event.key.toLowerCase() === key.toLowerCase()

      // Check modifiers
      const ctrlMatches = ctrl === (event.ctrlKey || event.metaKey)
      const shiftMatches = shift === event.shiftKey
      const altMatches = alt === event.altKey
      const metaMatches = meta === event.metaKey

      if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
        event.preventDefault()
        callbackRef.current(event)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [shortcut.key, shortcut.ctrl, shortcut.shift, shortcut.alt, shortcut.meta])
}

/**
 * useKeyboardShortcuts
 * Register multiple keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  const shortcutsRef = useRef(shortcuts)

  // Update shortcuts ref when they change
  useEffect(() => {
    shortcutsRef.current = shortcuts
  }, [shortcuts])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      for (const shortcut of shortcutsRef.current) {
        const {
          key,
          ctrl = false,
          shift = false,
          alt = false,
          meta = false,
          callback,
        } = shortcut

        // Check if key matches
        const keyMatches = event.key.toLowerCase() === key.toLowerCase()

        // Check modifiers (ctrl or meta for Mac compatibility)
        const ctrlMatches = ctrl === (event.ctrlKey || event.metaKey)
        const shiftMatches = shift === event.shiftKey
        const altMatches = alt === event.altKey
        const metaMatches = meta === event.metaKey

        if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
          event.preventDefault()
          callback(event)
          break // Only trigger one shortcut
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])
}

/**
 * Common keyboard shortcuts
 */
export const CommonShortcuts = {
  SEARCH: { key: 'k', ctrl: true, description: 'Recherche globale' },
  NEW_PATIENT: { key: 'n', ctrl: true, description: 'Nouveau patient' },
  SETTINGS: { key: ',', ctrl: true, description: 'Paramètres' },
  HELP: { key: '/', shift: true, description: 'Aide et raccourcis' },
  THEME_TOGGLE: { key: 'd', ctrl: true, shift: true, description: 'Basculer thème' },
  CLOSE: { key: 'Escape', description: 'Fermer' },
  SAVE: { key: 's', ctrl: true, description: 'Enregistrer' },
  REFRESH: { key: 'r', ctrl: true, description: 'Actualiser' },
}

/**
 * Format keyboard shortcut for display
 */
export function formatShortcut(shortcut: Pick<KeyboardShortcut, 'key' | 'ctrl' | 'shift' | 'alt' | 'meta'>): string {
  const parts: string[] = []

  // Detect Mac
  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0

  if (shortcut.ctrl) parts.push(isMac ? '⌘' : 'Ctrl')
  if (shortcut.shift) parts.push(isMac ? '⇧' : 'Shift')
  if (shortcut.alt) parts.push(isMac ? '⌥' : 'Alt')
  if (shortcut.meta) parts.push('⌘')

  parts.push(shortcut.key.toUpperCase())

  return parts.join(' + ')
}

/**
 * Hook to detect if user is on Mac
 */
export function useIsMac(): boolean {
  return typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0
}
