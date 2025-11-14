/**
 * Modern Button Component
 * Premium button with multiple variants and sizes
 */

import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/theme'
import { Loader2 } from 'lucide-react'

const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // Primary avec gradient subtil
        primary: cn(
          'bg-gradient-to-r from-mono-900 to-mono-800',
          'text-white',
          'shadow-soft hover:shadow-soft-md',
          'hover:from-mono-800 hover:to-mono-700',
          'active:scale-[0.98]',
          'focus-visible:ring-mono-600'
        ),

        // Secondary
        secondary: cn(
          'bg-mono-100 text-mono-900',
          'hover:bg-mono-200',
          'border border-mono-200',
          'hover:border-mono-300',
          'active:scale-[0.98]',
          'focus-visible:ring-mono-400'
        ),

        // Ghost moderne
        ghost: cn(
          'bg-transparent text-mono-700',
          'hover:bg-mono-100 hover:text-mono-900',
          'border border-transparent',
          'hover:border-mono-200',
          'focus-visible:ring-mono-400'
        ),

        // Outline élégant
        outline: cn(
          'bg-white/50 backdrop-blur-sm',
          'border-2 border-mono-300',
          'text-mono-800',
          'hover:bg-white hover:border-mono-400',
          'hover:shadow-soft',
          'active:scale-[0.98]',
          'focus-visible:ring-mono-400'
        ),

        // Accent
        accent: cn(
          'bg-gradient-to-r from-accent-600 to-accent-500',
          'text-white',
          'shadow-[0_4px_14px_0_rgba(100,116,139,0.39)]',
          'hover:shadow-[0_6px_20px_rgba(100,116,139,0.5)]',
          'hover:brightness-110',
          'active:scale-[0.98]',
          'focus-visible:ring-accent-500'
        ),

        // Glass button
        glass: cn(
          'bg-white/10 backdrop-blur-md',
          'border border-white/20',
          'text-mono-900',
          'hover:bg-white/20 hover:border-white/30',
          'shadow-soft',
          'focus-visible:ring-mono-400'
        ),

        // Destructive
        destructive: cn(
          'bg-gradient-to-r from-danger-600 to-danger-500',
          'text-white',
          'shadow-soft',
          'hover:shadow-soft-md',
          'hover:brightness-110',
          'active:scale-[0.98]',
          'focus-visible:ring-danger-500'
        ),

        // Success
        success: cn(
          'bg-gradient-to-r from-success-600 to-success',
          'text-white',
          'shadow-soft',
          'hover:shadow-soft-md',
          'hover:brightness-110',
          'active:scale-[0.98]',
          'focus-visible:ring-success'
        ),

        // Link
        link: 'text-accent-600 underline-offset-4 hover:underline',
      },

      size: {
        sm: 'h-9 px-4 text-sm rounded-lg',
        md: 'h-11 px-6 text-base rounded-xl',
        lg: 'h-14 px-8 text-lg rounded-2xl',
        xl: 'h-16 px-10 text-xl rounded-2xl',
        icon: 'h-10 w-10 rounded-xl',
      },

      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      loading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    return (
      <button
        type={type}
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin" role="status" aria-label="Loading" />
        )}
        {!loading && leftIcon && <span className="inline-flex">{leftIcon}</span>}
        <span className={cn(loading && 'opacity-0')}>{children}</span>
        {!loading && rightIcon && <span className="inline-flex">{rightIcon}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }
