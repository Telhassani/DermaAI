/**
 * Theme Utilities
 * Helper functions for styling
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge class names with Tailwind conflict resolution
 * @param inputs - Class names to merge
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Typography scale helpers
 */
export const typography = {
  // Display (Hero sections)
  display: {
    '2xl': 'text-7xl font-bold tracking-tight',
    xl: 'text-6xl font-bold tracking-tight',
    lg: 'text-5xl font-bold tracking-tight',
  },

  // Headings
  h1: 'text-4xl font-bold tracking-tight',
  h2: 'text-3xl font-semibold tracking-tight',
  h3: 'text-2xl font-semibold',
  h4: 'text-xl font-semibold',
  h5: 'text-lg font-semibold',
  h6: 'text-base font-semibold',

  // Body
  body: {
    lg: 'text-lg leading-relaxed',
    base: 'text-base leading-normal',
    sm: 'text-sm leading-normal',
  },

  // UI
  caption: 'text-xs font-medium tracking-wide',
  overline: 'text-xs font-semibold uppercase tracking-wider',
}

/**
 * Spacing helpers
 */
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
  '4xl': '64px',
  '5xl': '96px',
}

/**
 * Common animation durations
 */
export const durations = {
  fast: 150,
  normal: 300,
  slow: 500,
}

/**
 * Common easing functions
 */
export const easings = {
  smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
}
