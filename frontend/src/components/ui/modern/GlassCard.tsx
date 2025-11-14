/**
 * Glass Card Component
 * Card with glass morphism effect
 */

import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/theme'

const glassCardVariants = cva(
  // Base styles
  'rounded-2xl border transition-all duration-300',
  {
    variants: {
      variant: {
        light: cn(
          'backdrop-blur-md bg-white/70',
          'border-mono-200/50',
          'shadow-soft'
        ),
        dark: cn(
          'backdrop-blur-md bg-mono-900/70',
          'border-mono-700/50',
          'shadow-soft',
          'text-white'
        ),
        colored: cn(
          'backdrop-blur-md bg-gradient-to-br from-accent-50/70 to-mono-50/70',
          'border-accent-200/50',
          'shadow-soft'
        ),
      },

      blur: {
        sm: 'backdrop-blur-sm',
        md: 'backdrop-blur-md',
        lg: 'backdrop-blur-lg',
      },

      hover: {
        true: 'hover:shadow-soft-lg hover:scale-[1.02] hover:border-accent-300/50 cursor-pointer',
        false: '',
      },

      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
        xl: 'p-10',
      },
    },
    defaultVariants: {
      variant: 'light',
      blur: 'md',
      hover: false,
      padding: 'md',
    },
  }
)

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant, blur, hover, padding, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(glassCardVariants({ variant, blur, hover, padding, className }))}
        {...props}
      >
        {children}
      </div>
    )
  }
)

GlassCard.displayName = 'GlassCard'

export { GlassCard, glassCardVariants }
