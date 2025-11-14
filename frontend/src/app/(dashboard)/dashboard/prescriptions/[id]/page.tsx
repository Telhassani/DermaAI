'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  FileText,
  Download,
  Printer,
  Calendar,
  User as UserIcon,
  Package,
  Clock,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Edit,
  Trash2
} from 'lucide-react'
import { api } from '@/lib/api/client'
import { Prescription } from '@/types/prescription'
import { toast } from 'sonner'

export default function PrescriptionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const prescriptionId = parseInt(params.id as string)

  const [prescription, setPrescription] = useState<Prescription | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (prescriptionId) {
      fetchPrescription()
    }
  }, [prescriptionId])

  const fetchPrescription = async () => {
    try {
      setLoading(true)
      const response = await api.prescriptions.get(prescriptionId)
      setPrescription(response.data)
    } catch (error) {
      console.error('Error fetching prescription:', error)
      toast.error('Erreur lors du chargement de l\'ordonnance')
      router.push('/dashboard/prescriptions')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!prescription) return

    try {
      const response = await api.prescriptions.downloadPdf(prescription.id)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `prescription-${prescription.id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('PDF téléchargé avec succès')
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error('Erreur lors du téléchargement du PDF')
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDelete = async () => {
    if (!prescription) return

    if (!confirm('Êtes-vous sûr de vouloir supprimer cette ordonnance ? Cette action est irréversible.')) {
      return
    }

    try {
      setDeleting(true)
      await api.prescriptions.delete(prescription.id)
      toast.success('Ordonnance supprimée avec succès')
      router.push('/dashboard/prescriptions')
    } catch (error) {
      console.error('Error deleting prescription:', error)
      toast.error('Erreur lors de la suppression de l\'ordonnance')
    } finally {
      setDeleting(false)
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

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isExpired = (validUntil: string | null) => {
    if (!validUntil) return false
    return new Date(validUntil) < new Date()
  }

  const isExpiringSoon = (validUntil: string | null) => {
    if (!validUntil) return false
    const daysUntilExpiry = Math.ceil(
      (new Date(validUntil).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    )
    return daysUntilExpiry > 0 && daysUntilExpiry <= 7
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!prescription) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <p className="mt-4 text-gray-600">Ordonnance non trouvée</p>
            <button
              onClick={() => router.push('/dashboard/prescriptions')}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Retour à la liste
            </button>
          </div>
        </div>
      </div>
    )
  }

  const expired = isExpired(prescription.valid_until)
  const expiringSoon = isExpiringSoon(prescription.valid_until)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard/prescriptions')}
            className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la liste
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Ordonnance #{prescription.id}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Créée le {formatDate(prescription.prescription_date)}
              </p>
            </div>

            <div className="flex items-center space-x-2 print:hidden">
              <button
                onClick={() => router.push(`/dashboard/prescriptions/${prescription.id}/edit`)}
                className="flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                <Edit className="mr-2 h-4 w-4" />
                Modifier
              </button>
              <button
                onClick={handleDownloadPdf}
                className="flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                <Download className="mr-2 h-4 w-4" />
                PDF
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                <Printer className="mr-2 h-4 w-4" />
                Imprimer
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center rounded-md border border-red-300 bg-white px-4 py-2 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </button>
            </div>
          </div>
        </div>

        {/* Status Banner */}
        {(expired || expiringSoon) && (
          <div className={`mb-6 rounded-lg p-4 ${expired ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'} print:hidden`}>
            <div className="flex items-start">
              <AlertCircle className={`mr-3 h-5 w-5 ${expired ? 'text-red-600' : 'text-yellow-600'}`} />
              <div>
                <h3 className={`font-medium ${expired ? 'text-red-900' : 'text-yellow-900'}`}>
                  {expired ? 'Ordonnance expirée' : 'Ordonnance expire bientôt'}
                </h3>
                <p className={`mt-1 text-sm ${expired ? 'text-red-700' : 'text-yellow-700'}`}>
                  {expired
                    ? `Cette ordonnance a expiré le ${formatDate(prescription.valid_until!)}`
                    : `Cette ordonnance expire le ${formatDate(prescription.valid_until!)}`}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Prescription Info */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Informations de l'ordonnance
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start">
                  <Calendar className="mr-3 mt-0.5 h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-500">Date de prescription</div>
                    <div className="mt-1 text-gray-900">{formatDate(prescription.prescription_date)}</div>
                  </div>
                </div>

                {prescription.valid_until && (
                  <div className="flex items-start">
                    <Clock className="mr-3 mt-0.5 h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-500">Valide jusqu'au</div>
                      <div className={`mt-1 ${expired ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                        {formatDate(prescription.valid_until)}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-start">
                  <UserIcon className="mr-3 mt-0.5 h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-500">Patient</div>
                    <div className="mt-1 text-gray-900">
                      <button
                        onClick={() => router.push(`/dashboard/patients/${prescription.patient_id}`)}
                        className="text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        Patient #{prescription.patient_id}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <FileText className="mr-3 mt-0.5 h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-500">Consultation</div>
                    <div className="mt-1 text-gray-900">
                      <button
                        onClick={() => router.push(`/dashboard/consultations/${prescription.consultation_id}`)}
                        className="text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        Consultation #{prescription.consultation_id}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Medications */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Médicaments prescrits ({prescription.medications.length})
              </h2>

              <div className="space-y-4">
                {prescription.medications.map((medication, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="flex items-start">
                      <Package className="mr-3 mt-0.5 h-6 w-6 flex-shrink-0 text-blue-600" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{medication.name}</h3>

                        <div className="mt-3 space-y-2">
                          <div className="flex">
                            <span className="w-32 text-sm font-medium text-gray-500">Posologie:</span>
                            <span className="flex-1 text-sm text-gray-900">{medication.dosage}</span>
                          </div>

                          {medication.duration && (
                            <div className="flex">
                              <span className="w-32 text-sm font-medium text-gray-500">Durée:</span>
                              <span className="flex-1 text-sm text-gray-900">{medication.duration}</span>
                            </div>
                          )}

                          {medication.quantity && (
                            <div className="flex">
                              <span className="w-32 text-sm font-medium text-gray-500">Quantité:</span>
                              <span className="flex-1 text-sm text-gray-900">{medication.quantity}</span>
                            </div>
                          )}

                          {medication.frequency && (
                            <div className="flex">
                              <span className="w-32 text-sm font-medium text-gray-500">Fréquence:</span>
                              <span className="flex-1 text-sm text-gray-900">{medication.frequency}</span>
                            </div>
                          )}

                          {medication.route && (
                            <div className="flex">
                              <span className="w-32 text-sm font-medium text-gray-500">Voie:</span>
                              <span className="flex-1 text-sm text-gray-900">{medication.route}</span>
                            </div>
                          )}

                          {medication.instructions && (
                            <div className="mt-3 rounded-md bg-blue-50 p-3">
                              <p className="text-sm text-blue-900">
                                <strong>Instructions:</strong> {medication.instructions}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* General Instructions */}
            {prescription.instructions && (
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Instructions générales
                </h2>
                <div className="rounded-md bg-blue-50 p-4">
                  <p className="text-gray-900 whitespace-pre-wrap">{prescription.instructions}</p>
                </div>
              </div>
            )}

            {/* Notes */}
            {prescription.notes && (
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Notes additionnelles
                </h2>
                <div className="rounded-md bg-gray-50 p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{prescription.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Statut</h2>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Imprimée</span>
                  {prescription.is_printed ? (
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Oui
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                      Non
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Délivrée</span>
                  {prescription.is_delivered ? (
                    <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Oui
                    </span>
                  ) : (
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                      Non
                    </span>
                  )}
                </div>

                {prescription.valid_until && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Validité</span>
                    {expired ? (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                        <Clock className="mr-1 h-3 w-3" />
                        Expirée
                      </span>
                    ) : expiringSoon ? (
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                        <Clock className="mr-1 h-3 w-3" />
                        Expire bientôt
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Valide
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Metadata Card */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Métadonnées</h2>

              <div className="space-y-3">
                <div>
                  <div className="text-xs font-medium text-gray-500">Créée le</div>
                  <div className="mt-1 text-sm text-gray-900">{formatDateTime(prescription.created_at)}</div>
                </div>

                <div>
                  <div className="text-xs font-medium text-gray-500">Dernière modification</div>
                  <div className="mt-1 text-sm text-gray-900">{formatDateTime(prescription.updated_at)}</div>
                </div>

                <div>
                  <div className="text-xs font-medium text-gray-500">ID Médecin</div>
                  <div className="mt-1 text-sm text-gray-900">#{prescription.doctor_id}</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-lg bg-white p-6 shadow print:hidden">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Actions rapides</h2>

              <div className="space-y-2">
                <button
                  onClick={() => router.push(`/dashboard/patients/${prescription.patient_id}`)}
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Voir le patient
                </button>
                <button
                  onClick={() => router.push(`/dashboard/consultations/${prescription.consultation_id}`)}
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Voir la consultation
                </button>
                <button
                  onClick={handleDownloadPdf}
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Télécharger PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
