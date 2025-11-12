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
  created_at?: string
  valid_until?: string
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

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
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
  created_at,
  valid_until,
  is_delivered,
  onEdit,
  onPrint,
  onDelete,
  canDelete = true,
}: PrescriptionCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      {/* Patient Name - Top Header */}
      {patient_name && (
        <div className="mb-3">
          <h2 className="text-xl font-bold text-gray-900">
            {patient_name}
          </h2>
        </div>
      )}

      {/* Header - Date and Prescription ID / Consultation Reference */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-medium text-gray-900">
            {prescription_date && formatDate(prescription_date)}
          </p>
          {consultation_id ? (
            <p className="text-xs text-gray-500">Consultation #{consultation_id}</p>
          ) : (
            <p className="text-xs text-gray-500">Ordonnance #{id}</p>
          )}
        </div>
        <div className="text-right">
          {created_at && (
            <p className="text-xs text-gray-500">
              Créée le: {formatDateTime(created_at)}
            </p>
          )}
          {valid_until && (
            <p className="text-xs text-orange-600">
              Valide jusqu'au: {formatDate(valid_until)}
            </p>
          )}
          {is_delivered && (
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 mt-1">
              Remise
            </span>
          )}
        </div>
      </div>

      {/* Medications Section */}
      {medications && medications.length > 0 && (
        <div className="mb-3">
          <h4 className="mb-2 text-xs font-medium uppercase text-gray-500">
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
        <div className="mb-3 p-2 bg-gray-50 rounded">
          <p className="text-xs font-medium text-gray-500 mb-1">Instructions:</p>
          <p className="text-sm text-gray-700">{instructions}</p>
        </div>
      )}

      {/* Notes Section */}
      {notes && (
        <div className="mb-3 p-2 bg-gray-50 rounded">
          <p className="text-xs font-medium text-gray-500 mb-1">Notes:</p>
          <p className="text-sm text-gray-700">{notes}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
        {onEdit && (
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Éditer l'ordonnance"
          >
            <Edit2 className="h-4 w-4" />
            Éditer
          </button>
        )}
        {onPrint && (
          <button
            onClick={onPrint}
            className="flex items-center gap-2 px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded transition-colors"
            title="Imprimer l'ordonnance"
          >
            <Printer className="h-4 w-4" />
            Imprimer
          </button>
        )}
        {onDelete && canDelete && (
          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
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
