/**
 * Spinner Component
 * Modern loading spinner with variants
 */

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/theme'

interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'primary' | 'accent' | 'white'
  className?: string
}

const sizes = {
  xs: 'h-4 w-4',
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
}

const variants = {
  default: 'border-mono-300 border-t-mono-600',
  primary: 'border-mono-200 border-t-accent-600',
  accent: 'border-accent-200 border-t-accent-600',
  white: 'border-white/30 border-t-white',
}

export default function Spinner({ size = 'md', variant = 'default', className }: SpinnerProps) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
      className={cn(
        'rounded-full border-2',
        sizes[size],
        variants[variant],
        className
      )}
      role="status"
      aria-label="Loading"
    />
  )
}

/**
 * Page Loader Component
 * Full-screen loading overlay
 */
export function PageLoader({
  message = 'Chargement...',
  showMessage = true,
}: {
  message?: string
  showMessage?: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm dark:bg-mono-900/80">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        {/* Logo + Spinner */}
        <div className="relative mb-4 inline-flex items-center justify-center">
          {/* Outer ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="h-20 w-20 rounded-full border-4 border-accent-200 border-t-accent-600"
          />

          {/* Inner pulse */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute h-12 w-12 rounded-full bg-gradient-to-br from-accent-500 to-accent-600"
          />
        </div>

        {/* Message */}
        {showMessage && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-sm font-medium text-mono-600 dark:text-mono-400"
          >
            {message}
          </motion.p>
        )}

        {/* Animated dots */}
        <motion.div
          className="mt-2 flex justify-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -8, 0],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                delay: i * 0.1,
              }}
              className="h-2 w-2 rounded-full bg-accent-500"
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}

/**
 * Inline Loader Component
 * Centered loader for use inside containers
 */
export function InlineLoader({
  size = 'md',
  message,
}: {
  size?: 'sm' | 'md' | 'lg'
  message?: string
}) {
  const containerSizes = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16',
  }

  return (
    <div className={cn('flex flex-col items-center justify-center', containerSizes[size])}>
      <Spinner size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md'} variant="primary" />
      {message && (
        <p className="mt-4 text-sm text-mono-600 dark:text-mono-400">{message}</p>
      )}
    </div>
  )
}

/**
 * Button Spinner Component
 * Small spinner for use inside buttons
 */
export function ButtonSpinner({ className }: { className?: string }) {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: 'linear',
      }}
      className={cn('h-4 w-4 rounded-full border-2 border-current border-t-transparent', className)}
      role="status"
      aria-label="Loading"
    />
  )
}
