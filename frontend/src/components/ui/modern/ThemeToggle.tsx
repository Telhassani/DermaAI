/**
 * Theme Toggle Component
 * Modern toggle for switching between light and dark mode
 */

'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/lib/theme'
import { useTheme, type Theme } from '@/lib/theme/ThemeProvider'

interface ThemeToggleProps {
  variant?: 'icon' | 'button' | 'dropdown'
  showLabel?: boolean
  className?: string
}

/**
 * Icon Only Toggle
 */
export default function ThemeToggle({
  variant = 'icon',
  showLabel = false,
  className,
}: ThemeToggleProps) {
  const { theme, resolvedTheme, toggleTheme } = useTheme()

  if (variant === 'icon') {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          'relative flex h-10 w-10 items-center justify-center rounded-xl',
          'border border-mono-200 bg-white transition-all duration-200',
          'hover:border-accent-300 hover:bg-accent-50',
          'active:scale-95',
          'dark:border-mono-700 dark:bg-mono-800',
          'dark:hover:border-accent-600 dark:hover:bg-accent-900/30',
          className
        )}
        aria-label="Toggle theme"
      >
        <AnimatePresence mode="wait">
          {resolvedTheme === 'light' ? (
            <motion.div
              key="sun"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ duration: 0.2 }}
            >
              <Sun className="h-5 w-5 text-amber-500" />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: -180 }}
              transition={{ duration: 0.2 }}
            >
              <Moon className="h-5 w-5 text-indigo-400" />
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    )
  }

  if (variant === 'button') {
    return (
      <button
        onClick={toggleTheme}
        className={cn(
          'flex items-center gap-2 rounded-xl px-4 py-2',
          'border border-mono-200 bg-white transition-all duration-200',
          'hover:border-accent-300 hover:bg-accent-50',
          'active:scale-98',
          'dark:border-mono-700 dark:bg-mono-800',
          'dark:hover:border-accent-600 dark:hover:bg-accent-900/30',
          className
        )}
      >
        <AnimatePresence mode="wait">
          {resolvedTheme === 'light' ? (
            <motion.div
              key="sun"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <Sun className="h-5 w-5 text-amber-500" />
              {showLabel && (
                <span className="text-sm font-medium text-mono-700 dark:text-mono-200">
                  Clair
                </span>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: -180 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <Moon className="h-5 w-5 text-indigo-400" />
              {showLabel && (
                <span className="text-sm font-medium text-mono-700 dark:text-mono-200">
                  Sombre
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    )
  }

  return <ThemeDropdown className={className} />
}

/**
 * Dropdown Variant with System option
 */
function ThemeDropdown({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = React.useState(false)

  const options: { value: Theme; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'Clair', icon: Sun },
    { value: 'dark', label: 'Sombre', icon: Moon },
    { value: 'system', label: 'Système', icon: Monitor },
  ]

  const currentOption = options.find((opt) => opt.value === theme) || options[0]
  const Icon = currentOption.icon

  return (
    <div className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 rounded-xl px-4 py-2',
          'border border-mono-200 bg-white transition-all duration-200',
          'hover:border-accent-300 hover:bg-accent-50',
          'active:scale-98',
          'dark:border-mono-700 dark:bg-mono-800',
          'dark:hover:border-accent-600 dark:hover:bg-accent-900/30'
        )}
      >
        <Icon className="h-5 w-5 text-mono-600 dark:text-mono-300" />
        <span className="text-sm font-medium text-mono-700 dark:text-mono-200">
          {currentOption.label}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'absolute right-0 top-full z-50 mt-2 min-w-[180px]',
                'rounded-2xl border border-mono-200 bg-white p-2',
                'shadow-[0_10px_40px_rgba(0,0,0,0.12)]',
                'dark:border-mono-700 dark:bg-mono-800'
              )}
            >
              {options.map((option) => {
                const OptionIcon = option.icon
                const isActive = theme === option.value

                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      setTheme(option.value)
                      setIsOpen(false)
                    }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-xl px-3 py-2.5',
                      'text-left text-sm transition-all duration-150',
                      'active:scale-98',
                      isActive
                        ? 'bg-accent-50 text-accent-700 dark:bg-accent-900/30 dark:text-accent-400'
                        : 'text-mono-700 hover:bg-mono-50 dark:text-mono-200 dark:hover:bg-mono-700'
                    )}
                  >
                    <OptionIcon
                      className={cn(
                        'h-5 w-5',
                        isActive
                          ? 'text-accent-600 dark:text-accent-400'
                          : 'text-mono-400 dark:text-mono-500'
                      )}
                    />
                    <span className="font-medium">{option.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="theme-active"
                        className="ml-auto h-2 w-2 rounded-full bg-accent-500"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                  </button>
                )
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
