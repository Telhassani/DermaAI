'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getPrescription, PrescriptionResponse } from '@/lib/api/prescriptions'
import { getPatient, PatientResponse } from '@/lib/api/patients'
import { PrescriptionPrintView } from '@/components/prescriptions/PrescriptionPrintView'
import { ArrowLeft, Printer } from 'lucide-react'
import { useAuth } from '@/lib/hooks/use-auth'

export default function PrintPrescriptionPage() {
  const router = useRouter()
  const params = useParams()
  const prescriptionId = parseInt(params.id as string)
  const { user } = useAuth()

  const [prescription, setPrescription] = useState<PrescriptionResponse | null>(null)
  const [patient, setPatient] = useState<PatientResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const prescriptionData = await getPrescription(prescriptionId)
        setPrescription(prescriptionData)

        if (prescriptionData.patient_id) {
          const patientData = await getPatient(prescriptionData.patient_id)
          setPatient(patientData)
        }
      } catch (err) {
        console.error('Error loading prescription:', err)
        setError('Erreur lors du chargement de l\'ordonnance')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [prescriptionId])

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">Chargement de l'ordonnance...</p>
        </div>
      </div>
    )
  }

  if (error || !prescription || !patient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Ordonnance non trouvée'}</p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col p-4">
      {/* Header with action buttons */}
      <div className="flex items-center justify-between mb-4 max-w-4xl mx-auto w-full">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-white rounded transition-colors border border-gray-200"
          title="Fermer et retourner"
        >
          <ArrowLeft className="h-4 w-4" />
          Fermer
        </button>

        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          title="Imprimer l'ordonnance"
        >
          <Printer className="h-4 w-4" />
          Imprimer
        </button>
      </div>

      {/* Print view - centered */}
      <div className="flex items-center justify-center flex-1">
        <div className="bg-white rounded-lg shadow-sm">
          <PrescriptionPrintView
            prescription={prescription}
            patientName={patient.full_name || 'Patient'}
            doctorName={user?.full_name || 'Docteur'}
          />
        </div>
      </div>
    </div>
  )
}
