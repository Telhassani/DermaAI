/**
 * Modern Avatar Component
 * User avatar with status indicator and fallback
 */

import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/theme'

const avatarVariants = cva(
  'relative inline-flex items-center justify-center overflow-hidden rounded-full bg-mono-200 font-medium text-mono-700 select-none',
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-xs',
        sm: 'h-8 w-8 text-sm',
        md: 'h-10 w-10 text-base',
        lg: 'h-14 w-14 text-lg',
        xl: 'h-20 w-20 text-2xl',
        '2xl': 'h-28 w-28 text-3xl',
      },

      variant: {
        default: '',
        gradient: 'bg-gradient-to-br from-accent-400 to-accent-600 text-white',
        ring: 'ring-2 ring-white shadow-soft',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
)

const statusVariants = cva(
  'absolute rounded-full border-2 border-white',
  {
    variants: {
      status: {
        online: 'bg-success',
        offline: 'bg-mono-400',
        busy: 'bg-danger',
        away: 'bg-warning',
      },

      size: {
        xs: 'h-1.5 w-1.5 -bottom-0 -right-0',
        sm: 'h-2 w-2 -bottom-0 -right-0',
        md: 'h-2.5 w-2.5 -bottom-0.5 -right-0.5',
        lg: 'h-3 w-3 -bottom-0.5 -right-0.5',
        xl: 'h-4 w-4 -bottom-1 -right-1',
        '2xl': 'h-5 w-5 -bottom-1 -right-1',
      },
    },
    defaultVariants: {
      status: 'online',
      size: 'md',
    },
  }
)

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string
  alt?: string
  name?: string
  status?: 'online' | 'offline' | 'busy' | 'away'
  showStatus?: boolean
}

/**
 * Get initials from name
 */
function getInitials(name?: string): string {
  if (!name) return '?'

  const parts = name.trim().split(' ')
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      className,
      size,
      variant,
      src,
      alt,
      name,
      status,
      showStatus = false,
      ...props
    },
    ref
  ) => {
    const [imageError, setImageError] = React.useState(false)

    return (
      <div ref={ref} className={cn(avatarVariants({ size, variant, className }))} {...props}>
        {src && !imageError ? (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <span>{getInitials(name)}</span>
        )}

        {/* Status indicator */}
        {showStatus && status && (
          <span
            className={cn(statusVariants({ status, size }))}
            aria-label={`Status: ${status}`}
          />
        )}
      </div>
    )
  }
)

Avatar.displayName = 'Avatar'

export { Avatar, avatarVariants }
