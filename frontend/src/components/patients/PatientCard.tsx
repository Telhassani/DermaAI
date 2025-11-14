/**
 * Patient Card Component
 * Modern card for displaying patient information
 */

'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  Mail,
  Phone,
  Calendar,
  FileText,
  Stethoscope,
  MoreVertical,
  MapPin,
} from 'lucide-react'
import { cn } from '@/lib/theme'
import { ElevatedCard, Avatar, Badge } from '@/components/ui/modern'

interface PatientCardProps {
  patient: {
    id: number
    first_name: string
    last_name: string
    email: string
    phone?: string
    date_of_birth?: string
    address?: string
    is_active: boolean
    // Stats
    consultations_count?: number
    appointments_count?: number
    prescriptions_count?: number
  }
  onClick?: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export default function PatientCard({ patient, onClick, onEdit, onDelete }: PatientCardProps) {
  const fullName = `${patient.first_name} ${patient.last_name}`

  // Calculate age
  const age = patient.date_of_birth
    ? new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()
    : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <ElevatedCard
        hover
        padding="lg"
        interactive
        onClick={onClick}
        className="group relative cursor-pointer"
      >
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar
              name={fullName}
              size="lg"
              variant="gradient"
              className="ring-2 ring-white shadow-sm"
            />

            <div>
              <h3 className="font-semibold text-mono-900">{fullName}</h3>
              <div className="mt-1 flex items-center gap-2">
                {age && (
                  <span className="text-sm text-mono-500">{age} ans</span>
                )}
                <Badge
                  variant={patient.is_active ? 'solidSuccess' : 'default'}
                  size="sm"
                  dot
                >
                  {patient.is_active ? 'Actif' : 'Inactif'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Actions Menu */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              // Open menu
            }}
            className={cn(
              'rounded-lg p-2 text-mono-400 transition-colors',
              'hover:bg-mono-100 hover:text-mono-700',
              'opacity-0 group-hover:opacity-100'
            )}
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>

        {/* Contact Info */}
        <div className="mb-4 space-y-2">
          {patient.email && (
            <div className="flex items-center gap-2 text-sm text-mono-600">
              <Mail className="h-4 w-4 text-mono-400" />
              <span className="truncate">{patient.email}</span>
            </div>
          )}
          {patient.phone && (
            <div className="flex items-center gap-2 text-sm text-mono-600">
              <Phone className="h-4 w-4 text-mono-400" />
              <span>{patient.phone}</span>
            </div>
          )}
          {patient.address && (
            <div className="flex items-center gap-2 text-sm text-mono-600">
              <MapPin className="h-4 w-4 text-mono-400" />
              <span className="truncate">{patient.address}</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 border-t border-mono-100 pt-4">
          <div className="text-center">
            <div className="mb-1 flex items-center justify-center">
              <Stethoscope className="h-4 w-4 text-accent-500" />
            </div>
            <p className="text-xl font-bold text-mono-900">
              {patient.consultations_count || 0}
            </p>
            <p className="text-xs text-mono-500">Consultations</p>
          </div>

          <div className="text-center border-x border-mono-100">
            <div className="mb-1 flex items-center justify-center">
              <Calendar className="h-4 w-4 text-accent-500" />
            </div>
            <p className="text-xl font-bold text-mono-900">
              {patient.appointments_count || 0}
            </p>
            <p className="text-xs text-mono-500">RDV</p>
          </div>

          <div className="text-center">
            <div className="mb-1 flex items-center justify-center">
              <FileText className="h-4 w-4 text-accent-500" />
            </div>
            <p className="text-xl font-bold text-mono-900">
              {patient.prescriptions_count || 0}
            </p>
            <p className="text-xs text-mono-500">Ordonnances</p>
          </div>
        </div>

        {/* Hover overlay gradient */}
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
  )
}
