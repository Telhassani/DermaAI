/**
 * Modern Badge Component
 * Status badges and labels
 */

import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/theme'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-mono-100 text-mono-700 border border-mono-200',
        primary: 'bg-accent-100 text-accent-700 border border-accent-200',
        success: 'bg-success-50 text-success-700 border border-success/20',
        warning: 'bg-warning-50 text-warning-700 border border-warning/20',
        danger: 'bg-danger-50 text-danger-700 border border-danger/20',
        info: 'bg-info-50 text-info-700 border border-info/20',
        // Solid variants
        solidPrimary: 'bg-accent-600 text-white',
        solidSuccess: 'bg-success text-white',
        solidWarning: 'bg-warning text-white',
        solidDanger: 'bg-danger text-white',
        // Outline
        outline: 'bg-transparent border-2 border-mono-300 text-mono-700',
      },

      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
        lg: 'px-4 py-1.5 text-base',
      },

      dot: {
        true: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
  dotColor?: string
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, dot, dotColor, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(badgeVariants({ variant, size, className }))} {...props}>
        {dot && (
          <span
            className={cn('h-1.5 w-1.5 rounded-full', dotColor || 'bg-current')}
            aria-hidden="true"
          />
        )}
        {children}
      </div>
    )
  }
)

Badge.displayName = 'Badge'

export { Badge, badgeVariants }
