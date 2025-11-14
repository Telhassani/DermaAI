/**
 * Search Bar Component
 * Modern search bar with filters for patient list
 */

'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, SlidersHorizontal, Calendar } from 'lucide-react'
import { cn } from '@/lib/theme'
import { Input } from '@/components/ui/modern'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onFilterClick?: () => void
  placeholder?: string
  showAdvancedFilters?: boolean
}

export default function SearchBar({
  value,
  onChange,
  onFilterClick,
  placeholder = 'Rechercher par nom, email, téléphone...',
  showAdvancedFilters = false,
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false)

  const handleClear = () => {
    onChange('')
  }

  return (
    <div className="relative">
      <motion.div
        initial={false}
        animate={{
          scale: isFocused ? 1.01 : 1,
        }}
        transition={{ duration: 0.2 }}
        className={cn(
          'relative flex items-center gap-2 rounded-2xl border-2 bg-white transition-all duration-200',
          isFocused
            ? 'border-accent-500 shadow-[0_0_0_4px_rgba(100,116,139,0.1)]'
            : 'border-mono-200 shadow-sm'
        )}
      >
        {/* Search Icon */}
        <div className="pl-5">
          <Search
            className={cn(
              'h-5 w-5 transition-colors duration-200',
              isFocused ? 'text-accent-600' : 'text-mono-400'
            )}
          />
        </div>

        {/* Input */}
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={cn(
            'flex-1 bg-transparent py-4 pr-4 text-sm outline-none',
            'placeholder:text-mono-400',
            'text-mono-900'
          )}
        />

        {/* Clear Button */}
        <AnimatePresence>
          {value && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              onClick={handleClear}
              className={cn(
                'mr-2 rounded-lg p-1.5 transition-colors',
                'hover:bg-mono-100 text-mono-400 hover:text-mono-700'
              )}
              type="button"
            >
              <X className="h-4 w-4" />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Advanced Filters Button */}
        {showAdvancedFilters && (
          <button
            onClick={onFilterClick}
            className={cn(
              'mr-3 flex items-center gap-2 rounded-xl px-4 py-2',
              'border border-mono-200 bg-mono-50 transition-all duration-200',
              'hover:border-accent-500 hover:bg-accent-50 hover:text-accent-700',
              'text-sm font-medium text-mono-600'
            )}
            type="button"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">Filtres</span>
          </button>
        )}
      </motion.div>

      {/* Search Results Count (optional) */}
      <AnimatePresence>
        {value && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 top-full mt-2 text-sm text-mono-500"
          >
            Recherche: <span className="font-medium text-mono-700">{value}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
