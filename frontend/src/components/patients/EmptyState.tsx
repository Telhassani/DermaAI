/**
 * Empty State Component
 * Displayed when no patients found
 */

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Users, Search, UserPlus, Filter } from 'lucide-react'
import { cn } from '@/lib/theme'
import { Button } from '@/components/ui/modern'

interface EmptyStateProps {
  type?: 'no-patients' | 'no-results' | 'no-filter-results'
  searchQuery?: string
  onAddPatient?: () => void
  onClearFilters?: () => void
}

export default function EmptyState({
  type = 'no-patients',
  searchQuery,
  onAddPatient,
  onClearFilters,
}: EmptyStateProps) {
  const config = {
    'no-patients': {
      icon: Users,
      title: 'Aucun patient enregistré',
      description: 'Commencez par ajouter votre premier patient pour gérer vos consultations.',
      action: onAddPatient && (
        <Button
          variant="primary"
          size="lg"
          leftIcon={<UserPlus className="h-5 w-5" />}
          onClick={onAddPatient}
        >
          Ajouter un patient
        </Button>
      ),
    },
    'no-results': {
      icon: Search,
      title: 'Aucun résultat trouvé',
      description: searchQuery
        ? `Aucun patient ne correspond à "${searchQuery}"`
        : 'Aucun patient ne correspond à votre recherche',
      action: null,
    },
    'no-filter-results': {
      icon: Filter,
      title: 'Aucun patient trouvé',
      description: 'Aucun patient ne correspond aux filtres sélectionnés.',
      action: onClearFilters && (
        <Button variant="ghost" size="md" onClick={onClearFilters}>
          Réinitialiser les filtres
        </Button>
      ),
    },
  }

  const { icon: Icon, title, description, action } = config[type]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'flex flex-col items-center justify-center',
        'rounded-3xl border-2 border-dashed border-mono-200',
        'bg-gradient-to-br from-mono-50 to-white',
        'px-8 py-16 text-center',
        'min-h-[400px]'
      )}
    >
      {/* Icon with animated background */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="relative mb-6"
      >
        {/* Animated blob background */}
        <div
          className={cn(
            'absolute inset-0 -m-4 rounded-full',
            'bg-gradient-to-br from-accent-500/20 to-accent-600/20',
            'blur-2xl animate-blob'
          )}
        />

        {/* Icon container */}
        <div
          className={cn(
            'relative flex h-24 w-24 items-center justify-center',
            'rounded-3xl bg-gradient-to-br from-mono-100 to-mono-50',
            'border border-mono-200 shadow-soft'
          )}
        >
          <Icon className="h-12 w-12 text-mono-400" />
        </div>
      </motion.div>

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="mb-2 text-2xl font-bold text-mono-900"
      >
        {title}
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className="mb-8 max-w-md text-mono-600"
      >
        {description}
      </motion.p>

      {/* Action Button */}
      {action && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          {action}
        </motion.div>
      )}

      {/* Decorative elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-accent-500/5 blur-3xl" />
        <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-accent-500/5 blur-3xl" />
      </div>
    </motion.div>
  )
}
