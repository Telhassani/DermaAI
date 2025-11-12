'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { getPrescription, deletePrescription, markPrescriptionPrinted } from '@/lib/api/prescriptions'
import { PrescriptionCard } from '@/components/prescriptions/PrescriptionCard'

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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl">
        {/* Header with back button */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux ordonnances
          </button>
        </div>

        {/* Prescription Card */}
        <PrescriptionCard
          id={prescription.id}
          prescription_date={prescription.prescription_date}
          medications={prescription.medications}
          instructions={prescription.instructions}
          onEdit={() => router.push(`/dashboard/prescriptions/${prescription.id}`)}
          onPrint={handlePrint}
          onDelete={() => setShowDeleteConfirm(true)}
        />

        {/* Patient and additional info */}
        <div className="mt-4 rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-600">
            Patient: <span className="font-medium text-gray-900">{prescription.patient_name}</span>
          </p>
          {prescription.notes && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs font-medium uppercase text-gray-500 mb-1">Notes:</p>
              <p className="text-sm text-gray-700">{prescription.notes}</p>
            </div>
          )}
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
