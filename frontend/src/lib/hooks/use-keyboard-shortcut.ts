import { useEffect } from 'react'

type KeyboardShortcut = {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
}

export function useKeyboardShortcut(
  shortcut: KeyboardShortcut | KeyboardShortcut[],
  callback: () => void,
  enabled = true
) {
  useEffect(() => {
    if (!enabled) return

    const shortcuts = Array.isArray(shortcut) ? shortcut : [shortcut]

    const handleKeyDown = (event: KeyboardEvent) => {
      const matchesShortcut = shortcuts.some((sc) => {
        const keyMatches = event.key.toLowerCase() === sc.key.toLowerCase()
        const ctrlMatches = sc.ctrlKey === undefined || event.ctrlKey === sc.ctrlKey
        const metaMatches = sc.metaKey === undefined || event.metaKey === sc.metaKey
        const shiftMatches = sc.shiftKey === undefined || event.shiftKey === sc.shiftKey
        const altMatches = sc.altKey === undefined || event.altKey === sc.altKey

        return keyMatches && ctrlMatches && metaMatches && shiftMatches && altMatches
      })

      if (matchesShortcut) {
        event.preventDefault()
        callback()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [shortcut, callback, enabled])
}

// Helper function to get keyboard shortcut text
export function getShortcutText(isMac: boolean = false): string {
  return isMac ? '⌘K' : 'Ctrl+K'
}

// Check if user is on Mac
export function isMacOS(): boolean {
  if (typeof window === 'undefined') return false
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform)
}
