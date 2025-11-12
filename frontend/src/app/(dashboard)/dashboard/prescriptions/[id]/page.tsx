'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Edit,
  Printer,
  Trash2,
  AlertCircle,
} from 'lucide-react'
import { getPrescription, deletePrescription, markPrescriptionPrinted } from '@/lib/api/prescriptions'

interface Medication {
  name: string
  dosage: string
  duration?: string
  quantity?: string
  frequency?: string
  route?: string
  instructions?: string
}

interface Prescription {
  id: number
  consultation_id: number
  patient_id: number
  prescription_date: string
  valid_until: string
  medications: Medication[]
  instructions: string
  notes: string
  is_printed: boolean
  is_delivered: boolean
  created_at: string
  updated_at: string
  patient_name?: string
  doctor_name?: string
}

export default function PrescriptionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const prescriptionId = params.id as string

  const [prescription, setPrescription] = useState<Prescription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    loadPrescription()
  }, [prescriptionId])

  const loadPrescription = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getPrescription(parseInt(prescriptionId))
      setPrescription(data)
    } catch (err) {
      setError('Erreur lors du chargement de l\'ordonnance')
      console.error('Error loading prescription:', err)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = async () => {
    if (!prescription) return
    try {
      // Mark as printed
      await markPrescriptionPrinted(prescription.id)
      // Navigate to print page
      router.push(`/print-prescription/${prescription.id}`)
    } catch (error) {
      console.error('Error marking prescription as printed:', error)
      setError('Erreur lors du marquage de l\'ordonnance')
    }
  }

  const handleDelete = async () => {
    if (!prescription) return
    try {
      setDeleting(true)
      await deletePrescription(prescription.id)
      router.push('/dashboard/prescriptions')
    } catch (err) {
      setError('Erreur lors de la suppression de l\'ordonnance')
      console.error('Error deleting prescription:', err)
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !prescription) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-3xl">
          <button
            onClick={() => router.back()}
            className="mb-6 inline-flex items-center gap-2 text-blue-600 hover:text-blue-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <p className="text-red-800">
                {error || 'Ordonnance non trouvée'}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 print:bg-white print:p-0">
      <div className="mx-auto max-w-3xl">
        {/* Header with back button */}
        <div className="mb-6 print:hidden">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux ordonnances
          </button>
        </div>

        {/* Main content card */}
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm print:border-0 print:p-0 print:shadow-none">
          {/* Prescription header */}
          <div className="mb-8 border-b border-gray-200 pb-6 print:mb-6">
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {formatDate(prescription.prescription_date)}
              </p>
              <h1 className="mt-1 text-2xl font-bold text-gray-900">
                Ordonnance #{prescription.id}
              </h1>
            </div>
            <p className="text-sm text-gray-600">
              Patient: <span className="font-medium text-gray-900">{prescription.patient_name}</span>
            </p>
          </div>

          {/* Medications section */}
          <div className="mb-8">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">MÉDICAMENTS</h2>
            <div className="space-y-4">
              {prescription.medications.map((med, index) => (
                <div key={index} className="rounded-lg bg-gray-50 p-4 print:bg-white print:border print:border-gray-200">
                  <p className="font-medium text-gray-900">
                    {med.name}
                    {med.dosage && ` - ${med.dosage}`}
                    {med.frequency && ` (${med.frequency})`}
                    {med.duration && `, ${med.duration}`}
                  </p>
                  {med.quantity && (
                    <p className="mt-1 text-sm text-gray-600">Quantité: {med.quantity}</p>
                  )}
                  {med.route && (
                    <p className="text-sm text-gray-600">Voie: {med.route}</p>
                  )}
                  {med.instructions && (
                    <p className="mt-2 text-sm italic text-gray-700">{med.instructions}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Instructions section */}
          {prescription.instructions && (
            <div className="mb-8 border-t border-gray-200 pt-6 print:border-t print:pt-4">
              <h3 className="mb-2 font-semibold text-gray-900">Instructions:</h3>
              <p className="text-gray-700">{prescription.instructions}</p>
            </div>
          )}

          {/* Notes section */}
          {prescription.notes && (
            <div className="mb-8 border-t border-gray-200 pt-6 print:border-t print:pt-4">
              <h3 className="mb-2 font-semibold text-gray-900">Notes:</h3>
              <p className="text-gray-700">{prescription.notes}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-8 flex gap-4 border-t border-gray-200 pt-6 print:hidden">
            <button
              onClick={() => router.push(`/dashboard/prescriptions/${prescription.id}`)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
              title="Éditer l'ordonnance"
            >
              <Edit className="h-5 w-5" />
              Éditer
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors"
              title="Imprimer l'ordonnance"
            >
              <Printer className="h-5 w-5" />
              Imprimer
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors"
              title="Supprimer l'ordonnance"
            >
              <Trash2 className="h-5 w-5" />
              Supprimer
            </button>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 rounded-xl border border-red-200 bg-white p-6 shadow-lg sm:max-w-md">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">
              Supprimer cette ordonnance ?
            </h3>
            <p className="mb-6 text-gray-600">
              Cette action est irréversible. L'ordonnance sera définitivement supprimée.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
