/**
 * Toast Component & System
 * Modern toast notifications with animations
 */

'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/theme'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'default'
export type ToastPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right'

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => string
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined)

/**
 * Toast Provider
 */
export function ToastProvider({
  children,
  position = 'bottom-right',
  maxToasts = 5,
}: {
  children: React.ReactNode
  position?: ToastPosition
  maxToasts?: number
}) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = Math.random().toString(36).substring(7)
      const newToast: Toast = {
        id,
        variant: 'default',
        duration: 5000,
        ...toast,
      }

      setToasts((prev) => {
        const updated = [...prev, newToast]
        // Limit number of toasts
        return updated.slice(-maxToasts)
      })

      // Auto remove after duration
      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          removeToast(id)
        }, newToast.duration)
      }

      return id
    },
    [maxToasts]
  )

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} position={position} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

/**
 * Toast Hook
 */
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }

  const toast = useCallback(
    (options: Omit<Toast, 'id'>) => {
      return context.addToast(options)
    },
    [context]
  )

  // Convenience methods
  toast.success = useCallback(
    (title: string, description?: string) => {
      return context.addToast({ title, description, variant: 'success' })
    },
    [context]
  )

  toast.error = useCallback(
    (title: string, description?: string) => {
      return context.addToast({ title, description, variant: 'error' })
    },
    [context]
  )

  toast.warning = useCallback(
    (title: string, description?: string) => {
      return context.addToast({ title, description, variant: 'warning' })
    },
    [context]
  )

  toast.info = useCallback(
    (title: string, description?: string) => {
      return context.addToast({ title, description, variant: 'info' })
    },
    [context]
  )

  toast.dismiss = useCallback(
    (id: string) => {
      context.removeToast(id)
    },
    [context]
  )

  return toast
}

/**
 * Toast Container
 */
function ToastContainer({
  toasts,
  position,
  onRemove,
}: {
  toasts: Toast[]
  position: ToastPosition
  onRemove: (id: string) => void
}) {
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
  }

  return (
    <div
      className={cn(
        'pointer-events-none fixed z-[100] flex flex-col gap-2',
        positionClasses[position],
        'max-w-md'
      )}
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
        ))}
      </AnimatePresence>
    </div>
  )
}

/**
 * Toast Item
 */
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const variantConfig = {
    success: {
      icon: CheckCircle,
      className: 'border-success/30 bg-gradient-to-br from-success/10 to-white',
      iconClassName: 'text-success',
    },
    error: {
      icon: AlertCircle,
      className: 'border-danger/30 bg-gradient-to-br from-danger/10 to-white',
      iconClassName: 'text-danger',
    },
    warning: {
      icon: AlertTriangle,
      className: 'border-warning/30 bg-gradient-to-br from-warning/10 to-white',
      iconClassName: 'text-warning',
    },
    info: {
      icon: Info,
      className: 'border-accent-300 bg-gradient-to-br from-accent-50 to-white',
      iconClassName: 'text-accent-600',
    },
    default: {
      icon: Info,
      className: 'border-mono-200 bg-white',
      iconClassName: 'text-mono-600',
    },
  }

  const config = variantConfig[toast.variant || 'default']
  const Icon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'pointer-events-auto w-full rounded-2xl border p-4',
        'shadow-[0_10px_40px_rgba(0,0,0,0.12)]',
        'backdrop-blur-xl',
        config.className
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl',
            'bg-white/50'
          )}
        >
          <Icon className={cn('h-5 w-5', config.iconClassName)} />
        </div>

        {/* Content */}
        <div className="flex-1">
          {toast.title && (
            <h4 className="font-semibold text-mono-900">{toast.title}</h4>
          )}
          {toast.description && (
            <p className="mt-1 text-sm text-mono-600">{toast.description}</p>
          )}

          {/* Action */}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className={cn(
                'mt-3 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                'bg-mono-900 text-white hover:bg-mono-800',
                'active:scale-95'
              )}
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={() => onRemove(toast.id)}
          className={cn(
            'flex-shrink-0 rounded-lg p-1.5 transition-colors',
            'text-mono-400 hover:bg-mono-100 hover:text-mono-700',
            'active:scale-95'
          )}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress bar */}
      {toast.duration && toast.duration > 0 && (
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: toast.duration / 1000, ease: 'linear' }}
          className={cn(
            'mt-3 h-1 rounded-full',
            toast.variant === 'success' && 'bg-success',
            toast.variant === 'error' && 'bg-danger',
            toast.variant === 'warning' && 'bg-warning',
            toast.variant === 'info' && 'bg-accent-500',
            toast.variant === 'default' && 'bg-mono-300'
          )}
        />
      )}
    </motion.div>
  )
}
