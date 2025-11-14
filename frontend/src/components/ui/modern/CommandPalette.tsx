/**
 * Command Palette Component
 * Quick search and navigation (Cmd+K)
 */

'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Search,
  Users,
  Calendar,
  FileText,
  Settings,
  Home,
  ArrowRight,
  Command,
  Hash,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/theme'
import { useKeyboardShortcuts, formatShortcut } from '@/hooks/useKeyboardShortcuts'

interface CommandItem {
  id: string
  title: string
  description?: string
  icon?: LucideIcon
  shortcut?: string
  category?: string
  action: () => void
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export default function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Commands/actions
  const commands: CommandItem[] = [
    {
      id: 'home',
      title: 'Tableau de bord',
      description: 'Retour à l\'accueil',
      icon: Home,
      category: 'Navigation',
      action: () => {
        router.push('/dashboard')
        onClose()
      },
    },
    {
      id: 'patients',
      title: 'Liste des patients',
      description: 'Voir tous les patients',
      icon: Users,
      category: 'Navigation',
      action: () => {
        router.push('/dashboard/patients')
        onClose()
      },
    },
    {
      id: 'new-patient',
      title: 'Nouveau patient',
      description: 'Créer un nouveau dossier patient',
      icon: Users,
      shortcut: '⌘N',
      category: 'Actions',
      action: () => {
        router.push('/dashboard/patients/new')
        onClose()
      },
    },
    {
      id: 'appointments',
      title: 'Rendez-vous',
      description: 'Gérer les rendez-vous',
      icon: Calendar,
      category: 'Navigation',
      action: () => {
        router.push('/dashboard/appointments')
        onClose()
      },
    },
    {
      id: 'prescriptions',
      title: 'Ordonnances',
      description: 'Gérer les ordonnances',
      icon: FileText,
      category: 'Navigation',
      action: () => {
        router.push('/dashboard/prescriptions')
        onClose()
      },
    },
    {
      id: 'settings',
      title: 'Paramètres',
      description: 'Configurer l\'application',
      icon: Settings,
      shortcut: '⌘,',
      category: 'Système',
      action: () => {
        router.push('/dashboard/settings')
        onClose()
      },
    },
  ]

  // Filter commands based on query
  const filteredCommands = commands.filter((cmd) => {
    const searchText = query.toLowerCase()
    return (
      cmd.title.toLowerCase().includes(searchText) ||
      cmd.description?.toLowerCase().includes(searchText) ||
      cmd.category?.toLowerCase().includes(searchText)
    )
  })

  // Group by category
  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    const category = cmd.category || 'Autres'
    if (!acc[category]) acc[category] = []
    acc[category].push(cmd)
    return acc
  }, {} as Record<string, CommandItem[]>)

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((prev) => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          filteredCommands[selectedIndex]?.action()
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, filteredCommands, onClose])

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Reset state when closed
  useEffect(() => {
    if (!isOpen) {
      setQuery('')
      setSelectedIndex(0)
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-mono-900/50 backdrop-blur-sm"
          />

          {/* Command Palette */}
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-[20vh]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'w-full max-w-2xl overflow-hidden rounded-2xl',
                'border border-mono-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.2)]',
                'dark:border-mono-800 dark:bg-mono-900'
              )}
            >
              {/* Search Input */}
              <div className="border-b border-mono-200 p-4 dark:border-mono-800">
                <div className="flex items-center gap-3">
                  <Search className="h-5 w-5 text-mono-400" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Rechercher des actions, pages..."
                    className={cn(
                      'flex-1 bg-transparent text-lg outline-none',
                      'text-mono-900 placeholder:text-mono-400',
                      'dark:text-mono-100 dark:placeholder:text-mono-600'
                    )}
                  />
                  <kbd
                    className={cn(
                      'hidden rounded-lg bg-mono-100 px-2 py-1 font-mono text-xs text-mono-600',
                      'sm:inline-block',
                      'dark:bg-mono-800 dark:text-mono-400'
                    )}
                  >
                    ESC
                  </kbd>
                </div>
              </div>

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto p-2">
                {filteredCommands.length === 0 ? (
                  <div className="py-12 text-center">
                    <Hash className="mx-auto mb-3 h-12 w-12 text-mono-300 dark:text-mono-700" />
                    <p className="text-sm text-mono-500 dark:text-mono-400">
                      Aucun résultat trouvé
                    </p>
                  </div>
                ) : (
                  Object.entries(groupedCommands).map(([category, items]) => (
                    <div key={category} className="mb-4">
                      {/* Category Header */}
                      <div className="mb-2 px-3 py-1">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-mono-400 dark:text-mono-600">
                          {category}
                        </h3>
                      </div>

                      {/* Items */}
                      <div className="space-y-1">
                        {items.map((item, itemIndex) => {
                          const globalIndex = filteredCommands.indexOf(item)
                          const isSelected = selectedIndex === globalIndex
                          const Icon = item.icon || ArrowRight

                          return (
                            <button
                              key={item.id}
                              onClick={item.action}
                              onMouseEnter={() => setSelectedIndex(globalIndex)}
                              className={cn(
                                'group flex w-full items-center gap-3 rounded-xl px-3 py-3',
                                'text-left transition-all duration-150',
                                'active:scale-98',
                                isSelected
                                  ? 'bg-accent-50 dark:bg-accent-900/30'
                                  : 'hover:bg-mono-50 dark:hover:bg-mono-800'
                              )}
                            >
                              {/* Icon */}
                              <div
                                className={cn(
                                  'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
                                  'transition-colors',
                                  isSelected
                                    ? 'bg-accent-100 text-accent-600 dark:bg-accent-800 dark:text-accent-400'
                                    : 'bg-mono-100 text-mono-500 dark:bg-mono-800 dark:text-mono-400'
                                )}
                              >
                                <Icon className="h-5 w-5" />
                              </div>

                              {/* Content */}
                              <div className="flex-1">
                                <div className="font-medium text-mono-900 dark:text-mono-100">
                                  {item.title}
                                </div>
                                {item.description && (
                                  <div className="text-sm text-mono-500 dark:text-mono-400">
                                    {item.description}
                                  </div>
                                )}
                              </div>

                              {/* Shortcut */}
                              {item.shortcut && (
                                <kbd
                                  className={cn(
                                    'rounded-lg bg-mono-100 px-2 py-1 font-mono text-xs',
                                    'text-mono-600',
                                    'dark:bg-mono-800 dark:text-mono-400'
                                  )}
                                >
                                  {item.shortcut}
                                </kbd>
                              )}

                              {/* Arrow on hover/selected */}
                              {isSelected && (
                                <ArrowRight className="h-4 w-4 text-accent-600 dark:text-accent-400" />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-mono-200 px-4 py-3 dark:border-mono-800">
                <div className="flex items-center justify-between text-xs text-mono-500 dark:text-mono-400">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <kbd className="rounded bg-mono-100 px-1.5 py-0.5 font-mono dark:bg-mono-800">↑</kbd>
                      <kbd className="rounded bg-mono-100 px-1.5 py-0.5 font-mono dark:bg-mono-800">↓</kbd>
                      Naviguer
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="rounded bg-mono-100 px-1.5 py-0.5 font-mono dark:bg-mono-800">↵</kbd>
                      Sélectionner
                    </span>
                  </div>
                  <span className="hidden sm:inline">
                    <kbd className="rounded bg-mono-100 px-1.5 py-0.5 font-mono dark:bg-mono-800">⌘K</kbd>
                    {' '}pour ouvrir
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

/**
 * Hook to use command palette
 */
export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)

  // Register Cmd+K shortcut
  useKeyboardShortcuts([
    {
      key: 'k',
      ctrl: true,
      description: 'Ouvrir la palette de commandes',
      callback: () => setIsOpen((prev) => !prev),
    },
  ])

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((prev) => !prev),
  }
}
