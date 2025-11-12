'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2, AlertTriangle, Pill, Beaker, Clock, Calendar } from 'lucide-react'
import { PrescriptionResponse, MedicationItem, updatePrescription } from '@/lib/api/prescriptions'
import { useAuth } from '@/lib/hooks/use-auth'

interface PrescriptionEditModalProps {
  isOpen: boolean
  prescription: PrescriptionResponse | null
  onClose: () => void
  onSave: (prescription: PrescriptionResponse) => void
}

export function PrescriptionEditModal({ isOpen, prescription, onClose, onSave }: PrescriptionEditModalProps) {
  const { user } = useAuth()
  const [medications, setMedications] = useState<MedicationItem[]>([])
  const [instructions, setInstructions] = useState('')
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Update local state when prescription changes or modal opens
  useEffect(() => {
    if (isOpen && prescription) {
      setMedications(prescription.medications || [])
      setInstructions(prescription.instructions || '')
      setNotes(prescription.notes || '')
      setError(null)
    }
  }, [isOpen, prescription])

  const handleAddMedication = () => {
    setMedications([
      ...medications,
      { name: '', dosage: '', duration: '', frequency: '', quantity: '', route: '', instructions: '' },
    ])
  }

  const handleRemoveMedication = (index: number) => {
    setMedications(medications.filter((_, i) => i !== index))
  }

  const handleMedicationChange = (index: number, field: keyof MedicationItem, value: string) => {
    const newMeds = [...medications]
    newMeds[index] = { ...newMeds[index], [field]: value }
    setMedications(newMeds)
  }

  const handleSave = async () => {
    if (!prescription) return

    try {
      setIsSaving(true)
      setError(null)

      const updated = await updatePrescription(prescription.id, {
        medications,
        instructions,
        notes,
        consultation_id: prescription.consultation_id,
        patient_id: prescription.patient_id,
      })

      onSave(updated)
      onClose()
    } catch (err) {
      console.error('Error saving prescription:', err)
      setError(err instanceof Error ? err.message : 'Error saving prescription')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen || !prescription) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Header - Gradient Violet Background */}
        <div className="sticky top-0 flex items-center justify-between p-6 bg-gradient-to-r from-violet-600 to-purple-600 border-b-2 border-violet-300">
          <div>
            <h2 className="text-xl font-bold text-white">Éditer l'ordonnance n°{prescription.id}</h2>
            <p className="text-sm text-violet-100 mt-1 font-medium">👨‍⚕️ {user?.full_name || 'Docteur'}</p>
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
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-red-800 text-sm flex items-start gap-3 animate-in slide-in-from-top-2">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Medications */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                  <Pill className="h-5 w-5 text-blue-600" />
                  Médicaments
                </h3>
                <p className="text-xs text-gray-500 mt-1">{medications.length} médicament(s)</p>
              </div>
              <button
                onClick={handleAddMedication}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-violet-600 to-purple-500 text-white rounded-lg hover:from-violet-700 hover:to-purple-600 hover:shadow-lg active:scale-95 transition-all duration-200 font-medium"
              >
                <Plus className="h-5 w-5" />
                Ajouter
              </button>
            </div>

            <div className="space-y-4">
              {medications.map((med, idx) => (
                <div
                  key={idx}
                  className="p-5 border-l-4 border-l-violet-500 bg-violet-50 border border-violet-200 rounded-lg space-y-4 hover:shadow-md hover:border-violet-300 transition-all duration-200 group"
                >
                  {/* Medication Header with Badge */}
                  <div className="flex items-start justify-between pb-3 border-b border-violet-100">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 text-white text-sm font-bold">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-gray-600">Médicament #{idx + 1}</p>
                        {med.name && <p className="text-base font-bold text-gray-900 mt-0.5">{med.name}</p>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMedication(idx)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100"
                      title="Supprimer"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Medication Name - Full Width */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                      <Pill className="h-3.5 w-3.5 text-blue-600" />
                      Nom du médicament
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Amoxicilline, Paracétamol..."
                      value={med.name}
                      onChange={(e) => handleMedicationChange(idx, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  {/* Dosage, Frequency, Duration, Quantity */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Dosage */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                        <Beaker className="h-3.5 w-3.5 text-green-600" />
                        Dosage
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 500mg, 10%..."
                        value={med.dosage}
                        onChange={(e) => handleMedicationChange(idx, 'dosage', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:border-green-300 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    {/* Frequency */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-orange-600" />
                        Fréquence
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 2x/jour, 1x soir..."
                        value={med.frequency || ''}
                        onChange={(e) => handleMedicationChange(idx, 'frequency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-purple-600" />
                        Durée
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 7 jours, 2 semaines..."
                        value={med.duration || ''}
                        onChange={(e) => handleMedicationChange(idx, 'duration', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:border-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all duration-200"
                      />
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Quantité</label>
                      <input
                        type="text"
                        placeholder="Ex: 1 boîte, 30 comprimés..."
                        value={med.quantity || ''}
                        onChange={(e) => handleMedicationChange(idx, 'quantity', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-violet-50 p-4 rounded-lg border border-violet-200 border-l-4 border-l-violet-500">
            <label className="block text-sm font-bold text-violet-900 mb-3 flex items-center gap-2">
              <Beaker className="h-5 w-5 text-violet-600" />
              Instructions pour le patient
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-violet-300 rounded-lg text-sm bg-white hover:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all duration-200 resize-none"
              placeholder="Ex: Appliquer matin et soir après nettoyage..."
            />
          </div>

          {/* Notes */}
          <div className="bg-violet-50 p-4 rounded-lg border border-violet-200 border-l-4 border-l-violet-500">
            <label className="block text-sm font-bold text-violet-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-violet-600" />
              Notes additionnelles
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-violet-300 rounded-lg text-sm bg-white hover:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all duration-200 resize-none"
              placeholder="Ex: Éviter l'exposition au soleil, ne pas mélanger avec..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 p-6 border-t-2 border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-violet-700 border-2 border-violet-300 rounded-lg hover:bg-violet-100 hover:border-violet-400 active:scale-95 transition-all duration-200"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-purple-600 rounded-lg hover:from-violet-700 hover:to-purple-700 hover:shadow-lg disabled:from-gray-400 disabled:to-gray-400 active:scale-95 transition-all duration-200 flex items-center gap-2"
          >
            {isSaving && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></div>
            )}
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}
