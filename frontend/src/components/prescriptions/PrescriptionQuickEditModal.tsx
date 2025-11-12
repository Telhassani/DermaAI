'use client'

import { useState, useEffect } from 'react'
import { X, AlertTriangle, AlertCircle } from 'lucide-react'
import { updatePrescription, PrescriptionResponse } from '@/lib/api/prescriptions'

interface PrescriptionQuickEditModalProps {
  isOpen: boolean
  prescription: PrescriptionResponse | null
  onClose: () => void
  onSave: (prescription: PrescriptionResponse) => void
}

export function PrescriptionQuickEditModal({ isOpen, prescription, onClose, onSave }: PrescriptionQuickEditModalProps) {
  const [controlDate, setControlDate] = useState('')
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dateError, setDateError] = useState<string | null>(null)

  // Update local state when prescription changes or modal opens
  useEffect(() => {
    if (isOpen && prescription) {
      setControlDate(prescription.control_date || '')
      setNotes(prescription.notes || '')
      setError(null)
      setDateError(null)
    }
  }, [isOpen, prescription])

  const handleControlDateChange = (value: string) => {
    setControlDate(value)
    setDateError(null)

    // Validate that control_date is not before prescription_date
    if (value && prescription?.prescription_date) {
      const prescDate = new Date(prescription.prescription_date)
      const controlDateObj = new Date(value)

      if (controlDateObj < prescDate) {
        setDateError('La date de contrôle ne peut pas être antérieure à la date de l\'ordonnance')
      }
    }
  }

  const handleSave = async () => {
    if (!prescription) return

    // Validate date before saving
    if (dateError || (controlDate && new Date(controlDate) < new Date(prescription.prescription_date))) {
      setDateError('La date de contrôle ne peut pas être antérieure à la date de l\'ordonnance')
      return
    }

    try {
      setIsSaving(true)
      setError(null)

      const updated = await updatePrescription(prescription.id, {
        control_date: controlDate ? new Date(controlDate).toISOString().split('T')[0] : null,
        notes: notes,
        consultation_id: prescription.consultation_id,
        patient_id: prescription.patient_id,
      })

      onSave(updated)
      onClose()
    } catch (err) {
      console.error('Error saving prescription:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen || !prescription) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 bg-gradient-to-r from-violet-600 to-purple-600 border-b-2 border-violet-300">
          <div>
            <h2 className="text-lg font-bold text-white">Modifier l'ordonnance n°{prescription.id}</h2>
            <p className="text-xs text-violet-100 mt-1">Patient: {prescription.patient_name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 transition-all duration-200 p-2 rounded-lg"
            title="Fermer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-red-800 text-sm flex items-start gap-2 animate-in slide-in-from-top-2">
              <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Date de l'ordonnance (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de l'ordonnance
            </label>
            <input
              type="date"
              disabled
              value={prescription.prescription_date}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-600 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 mt-1">Immuable</p>
          </div>

          {/* Date de contrôle */}
          <div>
            <label htmlFor="control_date" className="block text-sm font-medium text-gray-700 mb-1">
              Date de contrôle (suivi)
            </label>
            <input
              type="date"
              id="control_date"
              value={controlDate}
              onChange={(e) => handleControlDateChange(e.target.value)}
              min={prescription.prescription_date}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 ${
                dateError
                  ? 'border-red-300 focus:ring-red-400'
                  : 'border-gray-300 focus:ring-violet-400'
              }`}
              placeholder="Sélectionner une date"
            />
            {dateError && (
              <div className="mt-1 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs flex items-start gap-1">
                <AlertCircle className="h-3 w-3 flex-shrink-0 mt-0.5" />
                <span>{dateError}</span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes additionnelles
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Notes sur l'ordonnance..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-400/20 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t-2 border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-violet-700 border-2 border-violet-300 rounded-lg hover:bg-violet-100 hover:border-violet-400 transition-all"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || dateError !== null}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-purple-600 rounded-lg hover:from-violet-700 hover:to-purple-700 hover:shadow-lg disabled:from-gray-400 disabled:to-gray-400 transition-all flex items-center gap-2"
          >
            {isSaving && (
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-r-transparent"></div>
            )}
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}
