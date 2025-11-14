/**
 * Bento Card Component
 * Modern "Bento Box" style card (Apple, Linear, etc.)
 */

import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/theme'

const bentoCardVariants = cva(
  cn(
    'group relative overflow-hidden rounded-3xl',
    'bg-gradient-to-br from-mono-50 to-mono-100',
    'border border-mono-200/50',
    'transition-all duration-500',
    'hover:border-accent-300/50',
    'hover:shadow-glow',
    // Background animation
    'before:absolute before:inset-0 before:opacity-0',
    'before:bg-gradient-to-br before:from-accent-500/10 before:via-transparent before:to-transparent',
    'before:transition-opacity before:duration-500',
    'hover:before:opacity-100'
  ),
  {
    variants: {
      size: {
        sm: 'p-6 min-h-[200px]',
        md: 'p-8 min-h-[300px]',
        lg: 'p-10 min-h-[400px]',
      },

      variant: {
        default: '',
        gradient: 'bg-gradient-to-br from-accent-50 via-mono-50 to-mono-100',
        dark: 'bg-gradient-to-br from-mono-800 to-mono-900 text-white border-mono-700/50',
      },

      interactive: {
        true: 'cursor-pointer hover:scale-[1.02]',
        false: '',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
      interactive: true,
    },
  }
)

export interface BentoCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof bentoCardVariants> {
  icon?: React.ReactNode
  decorative?: boolean
}

const BentoCard = React.forwardRef<HTMLDivElement, BentoCardProps>(
  (
    { className, size, variant, interactive, icon, decorative = true, children, ...props },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(bentoCardVariants({ size, variant, interactive, className }))}
        {...props}
      >
        {/* Icon avec effet de rotation au hover */}
        {icon && (
          <div className="relative z-10 mb-4 inline-flex transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
            {icon}
          </div>
        )}

        {/* Content */}
        <div className="relative z-10">{children}</div>

        {/* Decorative gradient blob */}
        {decorative && (
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-accent-400/20 to-transparent blur-3xl" />
        )}
      </div>
    )
  }
)

BentoCard.displayName = 'BentoCard'

export { BentoCard, bentoCardVariants }
