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
    <div className="rounded-xl border-2 border-violet-200 bg-white p-6 shadow-sm hover:shadow-md transition-all">
      {/* Header Background Bar */}
      <div className="mb-6 pb-4 border-b-2 border-violet-100">
        {/* Date and Prescription ID / Consultation Reference */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-gray-600">
              {prescription_date && formatDate(prescription_date)}
            </p>
            {consultation_id ? (
              <p className="text-xs font-semibold text-violet-600">Consultation n°{consultation_id}</p>
            ) : (
              <p className="text-xs font-semibold text-violet-600">Ordonnance n°{id}</p>
            )}
          </div>
        {/* Right side - only show is_delivered badge if present */}
        {is_delivered && (
          <div className="text-right">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
              Remise
            </span>
          </div>
        )}
        </div>
      </div>

      {/* Patient Name - Prominent Display */}
      {patient_name && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {patient_name}
          </h2>
        </div>
      )}

      {/* Medications Section */}
      {medications && medications.length > 0 && (
        <div className="mb-6">
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-violet-700 flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-violet-600"></span>
            Médicaments
          </h4>
          <ul className="space-y-1">
            {medications.map((med, idx) => (
              <li key={idx} className="text-sm text-gray-700">
                <span className="font-medium">{med.name}</span>
                {med.dosage && ` - ${med.dosage}`}
                {med.frequency && ` (${med.frequency})`}
                {med.duration && `, ${med.duration}`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Instructions Section */}
      {instructions && (
        <div className="mb-5 p-4 bg-gradient-to-r from-blue-50 to-blue-50/50 rounded-lg border-l-4 border-l-blue-500">
          <p className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-2 flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-blue-600"></span>
            Instructions
          </p>
          <p className="text-sm text-gray-800 leading-relaxed">{instructions}</p>
        </div>
      )}

      {/* Notes Section */}
      {notes && (
        <div className="mb-5 p-4 bg-gradient-to-r from-purple-50 to-purple-50/50 rounded-lg border-l-4 border-l-purple-500">
          <p className="text-xs font-bold uppercase tracking-wider text-purple-700 mb-2 flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-purple-600"></span>
            Notes
          </p>
          <p className="text-sm text-gray-800 leading-relaxed">{notes}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t-2 border-violet-100">
        {onEdit && (
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-lg border-2 border-violet-200 hover:border-violet-300 transition-all duration-200"
            title="Éditer l'ordonnance"
          >
            <Edit2 className="h-5 w-5" />
            Éditer
          </button>
        )}
        {onPrint && (
          <button
            onClick={onPrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg border-2 border-green-200 hover:border-green-300 transition-all duration-200"
            title="Imprimer l'ordonnance"
          >
            <Printer className="h-5 w-5" />
            Imprimer
          </button>
        )}
        {onDelete && canDelete && (
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border-2 border-red-200 hover:border-red-300 transition-all duration-200"
            title="Supprimer l'ordonnance"
          >
            <Trash2 className="h-5 w-5" />
            Supprimer
          </button>
        )}
      </div>
    </div>
  )
}
