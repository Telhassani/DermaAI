/**
 * Elevated Card Component
 * Card with floating effect and multi-layer shadows
 */

import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/theme'

const elevatedCardVariants = cva(
  // Base styles
  cn(
    'group relative rounded-2xl bg-white',
    'border border-mono-200',
    // Multi-layer shadow
    'shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]',
    // Transition
    'transition-all duration-300 ease-out'
  ),
  {
    variants: {
      hover: {
        true: cn(
          'hover:shadow-[0_8px_30px_rgba(0,0,0,0.08),0_4px_10px_rgba(0,0,0,0.04)]',
          'hover:-translate-y-1',
          'cursor-pointer',
          // Glow effect on hover (using ::before pseudo element via CSS)
          'before:absolute before:inset-0 before:rounded-2xl',
          'before:opacity-0 before:transition-opacity before:duration-300',
          'before:bg-gradient-to-br before:from-accent-500/5 before:to-transparent',
          'hover:before:opacity-100'
        ),
        false: '',
      },

      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
        xl: 'p-10',
      },

      interactive: {
        true: 'hover:border-accent-300 active:scale-[0.98]',
        false: '',
      },
    },
    defaultVariants: {
      hover: true,
      padding: 'md',
      interactive: false,
    },
  }
)

export interface ElevatedCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof elevatedCardVariants> {}

const ElevatedCard = React.forwardRef<HTMLDivElement, ElevatedCardProps>(
  ({ className, hover, padding, interactive, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(elevatedCardVariants({ hover, padding, interactive, className }))}
        {...props}
      >
        {/* Content wrapper (ensures content is above pseudo elements) */}
        <div className="relative z-10">{children}</div>
      </div>
    )
  }
)

ElevatedCard.displayName = 'ElevatedCard'

export { ElevatedCard, elevatedCardVariants }
