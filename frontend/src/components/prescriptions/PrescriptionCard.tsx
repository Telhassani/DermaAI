/**
 * Prescription Card Component
 * Display prescription info with print action
 */

'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  FileText,
  User,
  Calendar,
  Pill,
  Printer,
  Eye,
  MoreVertical,
  Edit2,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/theme'
import { ElevatedCard, Badge, Avatar, Dropdown, type DropdownItem } from '@/components/ui/modern'
import PrescriptionPrintModal from './PrescriptionPrintModal'
import { type PrescriptionData } from './PrescriptionTemplate'

interface PrescriptionCardProps {
  prescription: PrescriptionData
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
  className?: string
}

export default function PrescriptionCard({
  prescription,
  onClick,
  onEdit,
  onDelete,
  className,
}: PrescriptionCardProps) {
  const [showPrintModal, setShowPrintModal] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const dropdownItems: DropdownItem[] = [
    {
      id: 'view',
      label: 'Voir détails',
      icon: Eye,
      onClick: onClick,
    },
    {
      id: 'print',
      label: 'Imprimer',
      icon: Printer,
      onClick: () => setShowPrintModal(true),
    },
    {
      id: 'divider-1',
      label: '',
      divider: true,
    },
    {
      id: 'edit',
      label: 'Modifier',
      icon: Edit2,
      onClick: onEdit,
    },
    {
      id: 'delete',
      label: 'Supprimer',
      icon: Trash2,
      destructive: true,
      onClick: onDelete,
    },
  ]

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={className}
      >
        <ElevatedCard hover padding="lg" className="group relative">
          {/* Header */}
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 shadow-glow">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-mono-900 dark:text-mono-100">
                  Ordonnance #{prescription.prescription_number}
                </h3>
                <p className="text-sm text-mono-600 dark:text-mono-400">
                  {formatDate(prescription.date)}
                </p>
              </div>
            </div>

            {/* Actions dropdown */}
            <Dropdown
              trigger={
                <button
                  className={cn(
                    'rounded-lg p-2 opacity-0 transition-all',
                    'group-hover:opacity-100',
                    'hover:bg-mono-100 dark:hover:bg-mono-800'
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreVertical className="h-5 w-5 text-mono-600 dark:text-mono-400" />
                </button>
              }
              items={dropdownItems}
              align="end"
            />
          </div>

          {/* Patient Info */}
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-mono-50 p-3 dark:bg-mono-800">
            <Avatar
              name={prescription.patient.full_name}
              size="md"
              variant="gradient"
            />
            <div className="flex-1">
              <p className="font-medium text-mono-900 dark:text-mono-100">
                {prescription.patient.full_name}
              </p>
              <p className="text-sm text-mono-600 dark:text-mono-400">
                {prescription.patient.age} ans
              </p>
            </div>
          </div>

          {/* Medications count */}
          <div className="mb-4 flex items-center gap-2">
            <Pill className="h-4 w-4 text-accent-600" />
            <span className="text-sm font-medium text-mono-700 dark:text-mono-300">
              {prescription.medications.length} médicament
              {prescription.medications.length > 1 ? 's' : ''} prescrit
              {prescription.medications.length > 1 ? 's' : ''}
            </span>
          </div>

          {/* Medications preview */}
          <div className="mb-4 space-y-2">
            {prescription.medications.slice(0, 2).map((med, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg bg-white p-2 text-sm dark:bg-mono-900"
              >
                <span className="font-medium text-mono-900 dark:text-mono-100">
                  {med.name}
                </span>
                <Badge variant="outline" size="sm">
                  {med.dosage}
                </Badge>
              </div>
            ))}
            {prescription.medications.length > 2 && (
              <p className="text-xs text-mono-500 dark:text-mono-400">
                +{prescription.medications.length - 2} autres médicaments
              </p>
            )}
          </div>

          {/* Footer with quick print */}
          <div className="flex items-center justify-between border-t border-mono-200 pt-4 dark:border-mono-700">
            <div className="flex items-center gap-2 text-sm text-mono-600 dark:text-mono-400">
              <User className="h-4 w-4" />
              <span>Dr. {prescription.doctor.full_name}</span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowPrintModal(true)
              }}
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2',
                'border border-accent-200 bg-accent-50 text-accent-700',
                'transition-all duration-200',
                'hover:border-accent-300 hover:bg-accent-100 hover:shadow-soft',
                'active:scale-95',
                'dark:border-accent-800 dark:bg-accent-900/30 dark:text-accent-400',
                'dark:hover:bg-accent-900/50'
              )}
            >
              <Printer className="h-4 w-4" />
              <span className="text-sm font-medium">Imprimer</span>
            </button>
          </div>

          {/* Hover overlay */}
          <div
            className={cn(
              'pointer-events-none absolute inset-0 rounded-2xl',
              'bg-gradient-to-br from-accent-500/5 to-transparent',
              'opacity-0 transition-opacity duration-300',
              'group-hover:opacity-100'
            )}
          />
        </ElevatedCard>
      </motion.div>

      {/* Print Modal */}
      {showPrintModal && (
        <PrescriptionPrintModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          prescriptionData={prescription}
        />
      )}
    </>
  )
}
