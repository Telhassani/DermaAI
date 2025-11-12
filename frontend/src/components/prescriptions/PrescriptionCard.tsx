'use client'

import { Edit2, Printer, Trash2 } from 'lucide-react'

interface Medication {
  name: string
  dosage: string
  duration?: string
  quantity?: string
  frequency?: string
  route?: string
  instructions?: string
}

interface PrescriptionCardProps {
  id: number
  prescription_date: string
  patient_name?: string
  medications: Medication[]
  instructions?: string
  notes?: string
  consultation_id?: number
  is_delivered?: boolean
  onEdit?: () => void
  onPrint?: () => void
  onDelete?: () => void
  canDelete?: boolean
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function PrescriptionCard({
  id,
  prescription_date,
  patient_name,
  medications,
  instructions,
  notes,
  consultation_id,
  is_delivered,
  onEdit,
  onPrint,
  onDelete,
  canDelete = true,
}: PrescriptionCardProps) {
  return (
    <div className="rounded-xl border border-violet-200 bg-white shadow-sm hover:shadow-md transition-all overflow-hidden">
      {/* Header with gradient violet background */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-violet-100">
            {prescription_date && formatDate(prescription_date)}
          </p>
          <div className="flex items-center gap-3 mt-1">
            {consultation_id ? (
              <p className="text-lg font-bold text-white">Consultation n°{consultation_id}</p>
            ) : (
              <p className="text-lg font-bold text-white">Ordonnance n°{id}</p>
            )}
          </div>
        </div>
        {is_delivered && (
          <div className="text-right">
            <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              ✓ Remise
            </span>
          </div>
        )}
      </div>

      {/* Main content area */}
      <div className="p-6 space-y-5">
        {/* Patient Name - Prominent and Violet */}
        {patient_name && (
          <div className="border-b border-violet-100 pb-4">
            <h2 className="text-2xl font-bold text-violet-900">
              {patient_name}
            </h2>
          </div>
        )}

        {/* Medications Section */}
        {medications && medications.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-violet-700">
              Médicaments
            </h3>
            <ul className="space-y-2">
              {medications.map((med, idx) => (
                <li key={idx} className="flex gap-3 text-sm text-gray-700">
                  <span className="text-violet-600 font-bold min-w-fit">•</span>
                  <span>
                    <span className="font-medium text-gray-900">{med.name}</span>
                    {med.dosage && <span className="text-gray-600"> - {med.dosage}</span>}
                    {med.frequency && <span className="text-gray-600"> ({med.frequency})</span>}
                    {med.duration && <span className="text-gray-600">, {med.duration}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Instructions Section */}
        {instructions && (
          <div className="p-4 bg-violet-50 rounded-lg border-l-4 border-l-violet-500">
            <p className="text-xs font-bold uppercase tracking-wider text-violet-700 mb-2">
              Instructions
            </p>
            <p className="text-sm text-gray-800 leading-relaxed">{instructions}</p>
          </div>
        )}

        {/* Notes Section */}
        {notes && (
          <div className="p-4 bg-violet-50 rounded-lg border-l-4 border-l-violet-500">
            <p className="text-xs font-bold uppercase tracking-wider text-violet-700 mb-2">
              Notes
            </p>
            <p className="text-sm text-gray-800 leading-relaxed">{notes}</p>
          </div>
        )}
      </div>

      {/* Footer with gradient violet background and action buttons */}
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 px-6 py-4 border-t border-violet-200 flex flex-wrap items-center gap-3">
        {onEdit && (
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-violet-700 hover:text-violet-900 hover:bg-violet-100 rounded-lg transition-all duration-200"
            title="Éditer l'ordonnance"
          >
            <Edit2 className="h-4 w-4" />
            Éditer
          </button>
        )}
        {onPrint && (
          <button
            onClick={onPrint}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-violet-700 hover:text-violet-900 hover:bg-violet-100 rounded-lg transition-all duration-200"
            title="Imprimer l'ordonnance"
          >
            <Printer className="h-4 w-4" />
            Imprimer
          </button>
        )}
        {onDelete && canDelete && (
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-violet-700 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-200"
            title="Supprimer l'ordonnance"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </button>
        )}
      </div>
    </div>
  )
}
