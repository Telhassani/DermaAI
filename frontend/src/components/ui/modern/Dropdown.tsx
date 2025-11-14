/**
 * Dropdown Component
 * Modern dropdown menu with animations
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronRight, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/theme'

export interface DropdownItem {
  id: string
  label: string
  icon?: LucideIcon
  description?: string
  onClick?: () => void
  disabled?: boolean
  destructive?: boolean
  divider?: boolean
  badge?: string | number
  shortcut?: string
}

interface DropdownProps {
  trigger: React.ReactNode
  items: DropdownItem[]
  align?: 'start' | 'center' | 'end'
  side?: 'top' | 'bottom'
  className?: string
  menuClassName?: string
  closeOnSelect?: boolean
}

export default function Dropdown({
  trigger,
  items,
  align = 'end',
  side = 'bottom',
  className,
  menuClassName,
  closeOnSelect = true,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Close on escape
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen])

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled) return

    item.onClick?.()

    if (closeOnSelect) {
      setIsOpen(false)
    }
  }

  const alignClasses = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  }

  const sideClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
  }

  return (
    <div ref={dropdownRef} className={cn('relative inline-block', className)}>
      {/* Trigger */}
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      {/* Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: side === 'bottom' ? -10 : 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: side === 'bottom' ? -10 : 10 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              'absolute z-50 min-w-[12rem]',
              alignClasses[align],
              sideClasses[side],
              'rounded-2xl border border-mono-200 bg-white p-2',
              'shadow-[0_10px_40px_rgba(0,0,0,0.12)]',
              'backdrop-blur-xl',
              menuClassName
            )}
          >
            {items.map((item, index) => {
              if (item.divider) {
                return (
                  <div
                    key={`divider-${index}`}
                    className="my-2 h-px bg-mono-200"
                  />
                )
              }

              const Icon = item.icon

              return (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  disabled={item.disabled}
                  className={cn(
                    'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5',
                    'text-left text-sm transition-all duration-150',
                    'active:scale-98',
                    item.disabled
                      ? 'cursor-not-allowed opacity-50'
                      : cn(
                          item.destructive
                            ? 'text-danger hover:bg-danger/10'
                            : 'text-mono-700 hover:bg-accent-50 hover:text-accent-700'
                        )
                  )}
                >
                  {/* Icon */}
                  {Icon && (
                    <Icon
                      className={cn(
                        'h-4 w-4 transition-colors',
                        item.destructive
                          ? 'text-danger'
                          : 'text-mono-400 group-hover:text-accent-600'
                      )}
                    />
                  )}

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.label}</span>
                      {item.badge !== undefined && (
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-semibold',
                            item.destructive
                              ? 'bg-danger/20 text-danger'
                              : 'bg-accent-100 text-accent-700'
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p className="mt-0.5 text-xs text-mono-500">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Shortcut */}
                  {item.shortcut && (
                    <kbd
                      className={cn(
                        'ml-auto rounded-md px-2 py-1 font-mono text-xs',
                        'bg-mono-100 text-mono-500',
                        'group-hover:bg-accent-100 group-hover:text-accent-700'
                      )}
                    >
                      {item.shortcut}
                    </kbd>
                  )}

                  {/* Hover indicator */}
                  <div
                    className={cn(
                      'pointer-events-none absolute inset-y-1 left-1 w-1 rounded-full',
                      'scale-y-0 bg-gradient-to-b from-accent-500 to-accent-600',
                      'transition-transform duration-150',
                      'group-hover:scale-y-100'
                    )}
                  />
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Dropdown Trigger Helper
 */
export function DropdownTrigger({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center gap-2 rounded-xl px-4 py-2',
        'border border-mono-200 bg-white transition-all duration-150',
        'hover:border-accent-300 hover:bg-accent-50',
        'active:scale-98',
        className
      )}
    >
      {children}
    </button>
  )
}
