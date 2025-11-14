/**
 * Modern Input Component
 * Input field with floating label and icons
 */

import React, { useState } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/theme'

const inputVariants = cva(
  cn(
    'w-full px-4 pt-6 pb-2',
    'rounded-xl',
    'bg-mono-50/50 backdrop-blur-sm',
    'border-2 border-mono-200',
    'text-mono-900 placeholder-mono-400',
    // Focus state
    'focus:outline-none focus:ring-0',
    'focus:border-accent-500',
    'focus:bg-white',
    'focus:shadow-[0_0_0_4px_rgba(100,116,139,0.1)]',
    // Disabled state
    'disabled:bg-mono-100 disabled:text-mono-400 disabled:cursor-not-allowed',
    // Transition
    'transition-all duration-200'
  ),
  {
    variants: {
      size: {
        sm: 'h-12 text-sm',
        md: 'h-14 text-base',
        lg: 'h-16 text-lg',
      },

      variant: {
        default: '',
        filled: 'bg-mono-100 border-mono-200 focus:bg-white',
        outlined: 'bg-transparent border-2',
      },

      error: {
        true: cn(
          'border-danger focus:border-danger',
          'focus:shadow-[0_0_0_4px_rgba(239,68,68,0.1)]'
        ),
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
      error: false,
    },
  }
)

const labelVariants = cva(
  cn(
    'absolute left-4 transition-all duration-200 pointer-events-none',
    'text-mono-500'
  ),
  {
    variants: {
      floating: {
        true: 'top-2 text-xs',
        false: 'top-1/2 -translate-y-1/2 text-base',
      },

      focused: {
        true: 'text-accent-600',
      },

      error: {
        true: 'text-danger',
      },
    },
    defaultVariants: {
      floating: false,
      focused: false,
      error: false,
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  error?: boolean
  helperText?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      size,
      variant,
      error,
      label,
      leftIcon,
      rightIcon,
      helperText,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false)
    const [internalValue, setInternalValue] = useState('')

    const currentValue = value !== undefined ? value : internalValue
    const hasValue = Boolean(currentValue)
    const shouldFloat = isFocused || hasValue

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (value === undefined) {
        setInternalValue(e.target.value)
      }
      onChange?.(e)
    }

    return (
      <div className="relative w-full">
        {/* Left Icon */}
        {leftIcon && (
          <div className="pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-mono-400">
            {leftIcon}
          </div>
        )}

        {/* Input */}
        <input
          ref={ref}
          value={currentValue}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            inputVariants({ size, variant, error, className }),
            leftIcon && 'pl-12',
            rightIcon && 'pr-12'
          )}
          {...props}
        />

        {/* Floating Label */}
        {label && (
          <label
            className={cn(
              labelVariants({ floating: shouldFloat, focused: isFocused, error }),
              leftIcon && !shouldFloat && 'left-12'
            )}
          >
            {label}
          </label>
        )}

        {/* Right Icon */}
        {rightIcon && (
          <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-mono-400">
            {rightIcon}
          </div>
        )}

        {/* Helper Text / Error Message */}
        {helperText && (
          <p
            className={cn(
              'mt-1.5 text-sm',
              error ? 'text-danger' : 'text-mono-500'
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input, inputVariants }
