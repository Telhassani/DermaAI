/**
 * Prescription Template Component
 * Professional A5 prescription template for printing
 */

'use client'

import React, { forwardRef } from 'react'
import { cn } from '@/lib/theme'
import { User, Calendar, Stethoscope, Phone, Mail, MapPin, Pill } from 'lucide-react'

export interface PrescriptionData {
  id: number
  prescription_number: string
  date: string
  doctor: {
    full_name: string
    specialty: string
    license_number: string
    phone?: string
    email?: string
    address?: string
  }
  patient: {
    full_name: string
    date_of_birth: string
    age: number
    gender: string
    address?: string
    phone?: string
  }
  diagnosis?: string
  medications: Array<{
    name: string
    dosage: string
    frequency: string
    duration: string
    instructions?: string
  }>
  additional_notes?: string
  follow_up_date?: string
}

interface PrescriptionTemplateProps {
  data: PrescriptionData
  className?: string
}

const PrescriptionTemplate = forwardRef<HTMLDivElement, PrescriptionTemplateProps>(
  ({ data, className }, ref) => {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString)
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    }

    const calculateAge = (dob: string) => {
      const birthDate = new Date(dob)
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const m = today.getMonth() - birthDate.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      return age
    }

    return (
      <div
        ref={ref}
        className={cn(
          'prescription-template relative mx-auto bg-white',
          'w-[148mm] min-h-[210mm]', // A5 format
          'p-8 text-mono-900',
          className
        )}
      >
        {/* Decorative header gradient */}
        <div className="absolute left-0 right-0 top-0 h-2 bg-gradient-to-r from-accent-500 via-accent-600 to-accent-500" />

        {/* Header Section */}
        <header className="mb-8 border-b-2 border-mono-200 pb-6">
          <div className="mb-4 flex items-start justify-between">
            {/* Logo/Branding */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-accent-600">
                  <Stethoscope className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-mono-900">DermaAI</h1>
                  <p className="text-xs text-mono-600">Cabinet de Dermatologie</p>
                </div>
              </div>
            </div>

            {/* Prescription Number & Date */}
            <div className="text-right">
              <div className="mb-1 rounded-lg bg-accent-50 px-3 py-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent-700">
                  Ordonnance
                </p>
                <p className="text-lg font-bold text-accent-900">
                  #{data.prescription_number}
                </p>
              </div>
              <p className="mt-2 text-sm text-mono-600">{formatDate(data.date)}</p>
            </div>
          </div>

          {/* Doctor Information */}
          <div className="rounded-xl bg-mono-50 p-4">
            <div className="mb-2 flex items-center gap-2">
              <User className="h-4 w-4 text-accent-600" />
              <h2 className="font-semibold text-mono-900">{data.doctor.full_name}</h2>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-mono-600">
              <p>
                <span className="font-medium">Spécialité:</span> {data.doctor.specialty}
              </p>
              <p>
                <span className="font-medium">N° Ordre:</span>{' '}
                {data.doctor.license_number}
              </p>
              {data.doctor.phone && (
                <p className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {data.doctor.phone}
                </p>
              )}
              {data.doctor.email && (
                <p className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {data.doctor.email}
                </p>
              )}
            </div>
            {data.doctor.address && (
              <p className="mt-2 flex items-start gap-1 text-xs text-mono-600">
                <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0" />
                {data.doctor.address}
              </p>
            )}
          </div>
        </header>

        {/* Patient Information */}
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2 border-l-4 border-accent-500 pl-3">
            <h3 className="font-semibold uppercase tracking-wide text-mono-700">
              Informations Patient
            </h3>
          </div>
          <div className="rounded-xl border-2 border-mono-200 bg-white p-4">
            <div className="mb-3">
              <p className="text-lg font-bold text-mono-900">{data.patient.full_name}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs font-medium text-mono-500">Date de naissance</p>
                <p className="font-medium text-mono-900">
                  {formatDate(data.patient.date_of_birth)}
                </p>
                <p className="text-xs text-mono-600">
                  ({calculateAge(data.patient.date_of_birth)} ans)
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-mono-500">Sexe</p>
                <p className="font-medium text-mono-900">
                  {data.patient.gender === 'male'
                    ? 'Homme'
                    : data.patient.gender === 'female'
                    ? 'Femme'
                    : 'Autre'}
                </p>
              </div>
              {data.patient.phone && (
                <div>
                  <p className="text-xs font-medium text-mono-500">Téléphone</p>
                  <p className="font-medium text-mono-900">{data.patient.phone}</p>
                </div>
              )}
              {data.patient.address && (
                <div className="col-span-2">
                  <p className="text-xs font-medium text-mono-500">Adresse</p>
                  <p className="text-sm text-mono-900">{data.patient.address}</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Diagnosis */}
        {data.diagnosis && (
          <section className="mb-6">
            <div className="mb-3 flex items-center gap-2 border-l-4 border-accent-500 pl-3">
              <h3 className="font-semibold uppercase tracking-wide text-mono-700">
                Diagnostic
              </h3>
            </div>
            <div className="rounded-xl bg-accent-50/50 p-4">
              <p className="text-sm leading-relaxed text-mono-900">{data.diagnosis}</p>
            </div>
          </section>
        )}

        {/* Medications */}
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2 border-l-4 border-accent-500 pl-3">
            <Pill className="h-4 w-4 text-accent-600" />
            <h3 className="font-semibold uppercase tracking-wide text-mono-700">
              Prescription
            </h3>
          </div>
          <div className="space-y-3">
            {data.medications.map((med, index) => (
              <div
                key={index}
                className="rounded-xl border-2 border-mono-200 bg-white p-4 transition-shadow hover:shadow-soft"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <p className="text-base font-bold text-mono-900">{med.name}</p>
                    <p className="text-sm font-medium text-accent-700">{med.dosage}</p>
                  </div>
                  <span className="rounded-full bg-accent-100 px-3 py-1 text-xs font-semibold text-accent-700">
                    {index + 1}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs font-medium text-mono-500">Fréquence</p>
                    <p className="font-medium text-mono-900">{med.frequency}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-mono-500">Durée</p>
                    <p className="font-medium text-mono-900">{med.duration}</p>
                  </div>
                </div>
                {med.instructions && (
                  <div className="mt-3 rounded-lg bg-mono-50 p-2">
                    <p className="text-xs text-mono-700">
                      <span className="font-semibold">Instructions:</span> {med.instructions}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Additional Notes */}
        {data.additional_notes && (
          <section className="mb-6">
            <div className="mb-3 flex items-center gap-2 border-l-4 border-accent-500 pl-3">
              <h3 className="font-semibold uppercase tracking-wide text-mono-700">
                Notes Complémentaires
              </h3>
            </div>
            <div className="rounded-xl bg-mono-50 p-4">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-mono-700">
                {data.additional_notes}
              </p>
            </div>
          </section>
        )}

        {/* Follow-up */}
        {data.follow_up_date && (
          <section className="mb-6">
            <div className="rounded-xl border-2 border-dashed border-accent-300 bg-accent-50/30 p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-accent-600" />
                <div>
                  <p className="text-xs font-medium text-accent-700">Prochain rendez-vous</p>
                  <p className="font-semibold text-accent-900">
                    {formatDate(data.follow_up_date)}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Footer/Signature */}
        <footer className="mt-8 border-t-2 border-mono-200 pt-6">
          <div className="flex items-end justify-between">
            <div className="text-xs text-mono-500">
              <p className="mb-1 font-medium">Document généré par DermaAI</p>
              <p>Ce document est confidentiel et réservé au patient nommé ci-dessus.</p>
            </div>
            <div className="text-right">
              <div className="mb-2 h-16 w-40 rounded-lg border-2 border-dashed border-mono-300 bg-mono-50" />
              <p className="text-xs font-medium text-mono-700">Signature et cachet</p>
            </div>
          </div>
        </footer>

        {/* Decorative footer gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-accent-500 via-accent-600 to-accent-500" />

        {/* Watermark (subtle) */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.02]">
          <p className="rotate-[-45deg] text-9xl font-bold">DermaAI</p>
        </div>
      </div>
    )
  }
)

PrescriptionTemplate.displayName = 'PrescriptionTemplate'

export default PrescriptionTemplate
