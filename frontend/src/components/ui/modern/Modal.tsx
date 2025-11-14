/**
 * Modal Component
 * Modern modal dialog with animations and backdrop blur
 */

'use client'

import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/theme'
import { Button } from './Button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
  footer?: React.ReactNode
  className?: string
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-7xl',
}

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnBackdrop = true,
  closeOnEscape = true,
  footer,
  className,
}: ModalProps) {
  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose, closeOnEscape])

  // Prevent scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
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
            onClick={closeOnBackdrop ? onClose : undefined}
            className={cn(
              'fixed inset-0 z-50',
              'bg-mono-900/50 backdrop-blur-sm',
              'flex items-center justify-center p-4',
              'overflow-y-auto'
            )}
          >
            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'relative w-full',
                sizeClasses[size],
                'rounded-3xl border border-mono-200 bg-white',
                'shadow-[0_20px_60px_rgba(0,0,0,0.12)]',
                'my-8',
                className
              )}
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <div
                  className={cn(
                    'flex items-start justify-between',
                    'border-b border-mono-200 px-8 py-6'
                  )}
                >
                  <div className="flex-1">
                    {title && (
                      <h2 className="text-2xl font-bold text-mono-900">{title}</h2>
                    )}
                    {description && (
                      <p className="mt-1 text-sm text-mono-600">{description}</p>
                    )}
                  </div>

                  {/* Close Button */}
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className={cn(
                        'ml-4 rounded-xl p-2 transition-colors',
                        'text-mono-400 hover:bg-mono-100 hover:text-mono-700',
                        'active:scale-95'
                      )}
                      aria-label="Close modal"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="px-8 py-6">{children}</div>

              {/* Footer */}
              {footer && (
                <div
                  className={cn(
                    'flex items-center justify-end gap-3',
                    'border-t border-mono-200 px-8 py-6'
                  )}
                >
                  {footer}
                </div>
              )}

              {/* Decorative gradient */}
              <div
                className={cn(
                  'pointer-events-none absolute inset-x-0 top-0 h-px',
                  'bg-gradient-to-r from-transparent via-accent-500/20 to-transparent'
                )}
              />
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

/**
 * Modal Footer Helper Component
 */
export function ModalFooter({
  children,
  align = 'end',
}: {
  children: React.ReactNode
  align?: 'start' | 'center' | 'end' | 'between'
}) {
  const alignClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
  }

  return <div className={cn('flex items-center gap-3', alignClasses[align])}>{children}</div>
}

/**
 * Confirmation Modal Helper Component
 */
interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
  isLoading?: boolean
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'danger',
  isLoading = false,
}: ConfirmModalProps) {
  const variantConfig = {
    danger: {
      buttonVariant: 'danger' as const,
      icon: '⚠️',
    },
    warning: {
      buttonVariant: 'warning' as const,
      icon: '⚡',
    },
    info: {
      buttonVariant: 'primary' as const,
      icon: 'ℹ️',
    },
  }

  const config = variantConfig[variant]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      footer={
        <ModalFooter align="end">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={config.buttonVariant}
            onClick={onConfirm}
            loading={isLoading}
          >
            {confirmText}
          </Button>
        </ModalFooter>
      }
    >
      <div className="text-center">
        <div className="mb-4 text-5xl">{config.icon}</div>
        <h3 className="mb-2 text-lg font-semibold text-mono-900">{title}</h3>
        {description && <p className="text-sm text-mono-600">{description}</p>}
      </div>
    </Modal>
  )
}
