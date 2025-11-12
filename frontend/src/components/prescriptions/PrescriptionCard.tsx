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
  onEdit?: () => void
  onPrint?: () => void
  onDelete?: () => void
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
  onEdit,
  onPrint,
  onDelete,
}: PrescriptionCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">{formatDate(prescription_date)}</p>
        <h3 className="mt-1 text-lg font-semibold text-gray-900">
          Ordonnance #{id}
        </h3>
      </div>

      {/* Medications Section */}
      <div className="mb-4">
        <h4 className="mb-2 text-xs font-medium uppercase text-gray-500">
          MÉDICAMENTS
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

      {/* Instructions Section */}
      {instructions && (
        <div className="mb-4">
          <p className="text-xs font-medium uppercase text-gray-500 mb-1">
            Instructions:
          </p>
          <p className="text-sm text-gray-700">{instructions}</p>
        </div>
      )}

      {/* Patient Section */}
      {patient_name && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Patient: <span className="font-medium text-gray-900">{patient_name}</span>
          </p>
        </div>
      )}

      {/* Notes Section */}
      {notes && (
        <div className="mb-4">
          <p className="text-xs font-medium uppercase text-gray-500 mb-1">Notes:</p>
          <p className="text-sm text-gray-700">{notes}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 border-t border-gray-200 pt-4">
        {onEdit && (
          <button
            onClick={onEdit}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
            title="Éditer l'ordonnance"
          >
            <Edit2 className="h-5 w-5" />
            <span className="text-sm font-medium">Éditer</span>
          </button>
        )}
        {onPrint && (
          <button
            onClick={onPrint}
            className="flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors"
            title="Imprimer l'ordonnance"
          >
            <Printer className="h-5 w-5" />
            <span className="text-sm font-medium">Imprimer</span>
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors"
            title="Supprimer l'ordonnance"
          >
            <Trash2 className="h-5 w-5" />
            <span className="text-sm font-medium">Supprimer</span>
          </button>
        )}
      </div>
    </div>
  )
}
