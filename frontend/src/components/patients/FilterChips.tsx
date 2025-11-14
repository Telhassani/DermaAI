/**
 * Filter Chips Component
 * Quick filter chips for patient status
 */

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Check, Users, UserCheck, UserX, Calendar } from 'lucide-react'
import { cn } from '@/lib/theme'

export type FilterType = 'all' | 'active' | 'inactive' | 'recent'

interface FilterOption {
  id: FilterType
  label: string
  icon: React.ReactNode
  count?: number
}

interface FilterChipsProps {
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
  counts?: {
    all?: number
    active?: number
    inactive?: number
    recent?: number
  }
}

export default function FilterChips({
  activeFilter,
  onFilterChange,
  counts = {},
}: FilterChipsProps) {
  const filters: FilterOption[] = [
    {
      id: 'all',
      label: 'Tous',
      icon: <Users className="h-4 w-4" />,
      count: counts.all,
    },
    {
      id: 'active',
      label: 'Actifs',
      icon: <UserCheck className="h-4 w-4" />,
      count: counts.active,
    },
    {
      id: 'inactive',
      label: 'Inactifs',
      icon: <UserX className="h-4 w-4" />,
      count: counts.inactive,
    },
    {
      id: 'recent',
      label: 'Récents',
      icon: <Calendar className="h-4 w-4" />,
      count: counts.recent,
    },
  ]

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter, index) => {
        const isActive = activeFilter === filter.id

        return (
          <motion.button
            key={filter.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onFilterChange(filter.id)}
            className={cn(
              'group relative flex items-center gap-2 rounded-xl px-4 py-2.5',
              'border-2 transition-all duration-200',
              'hover:scale-105 active:scale-95',
              isActive
                ? cn(
                    'border-accent-500 bg-gradient-to-r from-accent-500 to-accent-600',
                    'text-white shadow-[0_4px_14px_0_rgba(100,116,139,0.39)]'
                  )
                : cn(
                    'border-mono-200 bg-white text-mono-700',
                    'hover:border-accent-300 hover:bg-accent-50'
                  )
            )}
          >
            {/* Icon */}
            <span
              className={cn(
                'transition-transform duration-200',
                isActive && 'scale-110',
                !isActive && 'group-hover:scale-110'
              )}
            >
              {filter.icon}
            </span>

            {/* Label */}
            <span className="text-sm font-medium">{filter.label}</span>

            {/* Count Badge */}
            {filter.count !== undefined && (
              <span
                className={cn(
                  'ml-1 flex h-6 min-w-[24px] items-center justify-center rounded-full px-2',
                  'text-xs font-semibold transition-colors',
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-mono-100 text-mono-600 group-hover:bg-accent-100 group-hover:text-accent-700'
                )}
              >
                {filter.count}
              </span>
            )}

            {/* Active Indicator */}
            {isActive && (
              <motion.div
                layoutId="filter-active-indicator"
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                <Check className="h-3 w-3 text-accent-600" />
              </motion.div>
            )}

            {/* Hover Glow Effect */}
            {!isActive && (
              <div
                className={cn(
                  'pointer-events-none absolute inset-0 rounded-xl',
                  'bg-gradient-to-r from-accent-500/10 to-accent-600/10',
                  'opacity-0 transition-opacity duration-200',
                  'group-hover:opacity-100'
                )}
              />
            )}
          </motion.button>
        )
      })}
    </div>
  )
}
