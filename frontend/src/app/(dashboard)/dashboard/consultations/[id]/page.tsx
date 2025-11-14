'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  FileText,
  Calendar,
  User as UserIcon,
  ArrowLeft,
  AlertCircle,
  Edit,
  Trash2,
  Stethoscope,
  Activity,
  ClipboardList,
  Heart,
  Eye,
  FileImage,
  TestTube,
  Plus,
  Image as ImageIcon
} from 'lucide-react'
import { api } from '@/lib/api/client'
import { Consultation } from '@/types/consultation'
import { ConsultationImage } from '@/types/consultation-image'
import { toast } from 'sonner'
import ImageUpload from '@/components/consultation-images/ImageUpload'
import ImageGallery from '@/components/consultation-images/ImageGallery'

export default function ConsultationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const consultationId = parseInt(params.id as string)

  const [consultation, setConsultation] = useState<Consultation | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  // Images state
  const [images, setImages] = useState<ConsultationImage[]>([])
  const [imagesLoading, setImagesLoading] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)

  useEffect(() => {
    if (consultationId) {
      fetchConsultation()
      fetchImages()
    }
  }, [consultationId])

  const fetchConsultation = async () => {
    try {
      setLoading(true)
      const response = await api.consultations.get(consultationId)
      setConsultation(response.data)
    } catch (error) {
      console.error('Error fetching consultation:', error)
      toast.error('Erreur lors du chargement de la consultation')
      router.push('/dashboard/consultations')
    } finally {
      setLoading(false)
    }
  }

  const fetchImages = async () => {
    try {
      setImagesLoading(true)
      const response = await api.consultationImages.list(consultationId)
      setImages(response.data.images)
    } catch (error) {
      console.error('Error fetching images:', error)
      // Don't show error toast here as images are optional
    } finally {
      setImagesLoading(false)
    }
  }

  const handleUploadSuccess = () => {
    fetchImages()
    setShowUploadModal(false)
  }

  const handleImageDeleted = () => {
    fetchImages()
  }

  const handleDelete = async () => {
    if (!consultation) return

    if (!confirm('Êtes-vous sûr de vouloir supprimer cette consultation ? Cette action est irréversible.')) {
      return
    }

    try {
      setDeleting(true)
      await api.consultations.delete(consultation.id)
      toast.success('Consultation supprimée avec succès')
      router.push('/dashboard/consultations')
    } catch (error) {
      console.error('Error deleting consultation:', error)
      toast.error('Erreur lors de la suppression de la consultation')
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

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
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

  if (!consultation) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
            <p className="mt-4 text-gray-600">Consultation non trouvée</p>
            <button
              onClick={() => router.push('/dashboard/consultations')}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Retour à la liste
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard/consultations')}
            className="mb-4 flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la liste
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Consultation #{consultation.id}
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                {formatDate(consultation.consultation_date)} à {formatTime(consultation.consultation_time)}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => router.push(`/dashboard/consultations/${consultation.id}/edit`)}
                className="flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
              >
                <Edit className="mr-2 h-4 w-4" />
                Modifier
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

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Chief Complaint */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
                <ClipboardList className="mr-2 h-5 w-5 text-blue-600" />
                Motif de consultation
              </h2>
              <p className="text-gray-900">{consultation.chief_complaint}</p>
            </div>

            {/* Symptoms */}
            {consultation.symptoms && (
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
                  <Activity className="mr-2 h-5 w-5 text-blue-600" />
                  Symptômes
                </h2>
                <p className="text-gray-900 whitespace-pre-wrap">{consultation.symptoms}</p>
                {consultation.duration_symptoms && (
                  <div className="mt-3 rounded-md bg-blue-50 p-3">
                    <p className="text-sm text-blue-900">
                      <strong>Durée:</strong> {consultation.duration_symptoms}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Clinical Examination */}
            {consultation.clinical_examination && (
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
                  <Stethoscope className="mr-2 h-5 w-5 text-blue-600" />
                  Examen clinique
                </h2>
                <p className="text-gray-900 whitespace-pre-wrap">{consultation.clinical_examination}</p>
              </div>
            )}

            {/* Dermatological Examination */}
            {consultation.dermatological_examination && (
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
                  <Eye className="mr-2 h-5 w-5 text-blue-600" />
                  Examen dermatologique
                </h2>
                <p className="text-gray-900 whitespace-pre-wrap">{consultation.dermatological_examination}</p>

                {/* Lesion Details */}
                {(consultation.lesion_type || consultation.lesion_location || consultation.lesion_size || consultation.lesion_color || consultation.lesion_texture) && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {consultation.lesion_type && (
                      <div className="rounded-md bg-gray-50 p-3">
                        <div className="text-xs font-medium text-gray-500">Type de lésion</div>
                        <div className="mt-1 text-sm text-gray-900">{consultation.lesion_type}</div>
                      </div>
                    )}
                    {consultation.lesion_location && (
                      <div className="rounded-md bg-gray-50 p-3">
                        <div className="text-xs font-medium text-gray-500">Localisation</div>
                        <div className="mt-1 text-sm text-gray-900">{consultation.lesion_location}</div>
                      </div>
                    )}
                    {consultation.lesion_size && (
                      <div className="rounded-md bg-gray-50 p-3">
                        <div className="text-xs font-medium text-gray-500">Taille</div>
                        <div className="mt-1 text-sm text-gray-900">{consultation.lesion_size}</div>
                      </div>
                    )}
                    {consultation.lesion_color && (
                      <div className="rounded-md bg-gray-50 p-3">
                        <div className="text-xs font-medium text-gray-500">Couleur</div>
                        <div className="mt-1 text-sm text-gray-900">{consultation.lesion_color}</div>
                      </div>
                    )}
                    {consultation.lesion_texture && (
                      <div className="rounded-md bg-gray-50 p-3">
                        <div className="text-xs font-medium text-gray-500">Texture</div>
                        <div className="mt-1 text-sm text-gray-900">{consultation.lesion_texture}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Diagnosis */}
            {consultation.diagnosis && (
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
                  <Heart className="mr-2 h-5 w-5 text-red-600" />
                  Diagnostic
                </h2>
                <div className="rounded-md bg-blue-50 p-4">
                  <p className="font-medium text-blue-900">{consultation.diagnosis}</p>
                </div>

                {consultation.differential_diagnosis && (
                  <div className="mt-4">
                    <h3 className="mb-2 text-sm font-medium text-gray-700">Diagnostic différentiel</h3>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{consultation.differential_diagnosis}</p>
                  </div>
                )}
              </div>
            )}

            {/* Treatment Plan */}
            {consultation.treatment_plan && (
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Plan de traitement
                </h2>
                <p className="text-gray-900 whitespace-pre-wrap">{consultation.treatment_plan}</p>
              </div>
            )}

            {/* Medical History Notes */}
            {consultation.medical_history_notes && (
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Antécédents médicaux
                </h2>
                <p className="text-gray-700 whitespace-pre-wrap">{consultation.medical_history_notes}</p>
              </div>
            )}

            {/* Biopsy */}
            {consultation.biopsy_performed && (
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
                  <TestTube className="mr-2 h-5 w-5 text-purple-600" />
                  Biopsie
                </h2>
                <div className="rounded-md bg-purple-50 p-3">
                  <p className="text-sm font-medium text-purple-900">Biopsie réalisée</p>
                  {consultation.biopsy_results && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-purple-900">Résultats:</p>
                      <p className="mt-1 text-sm text-purple-800 whitespace-pre-wrap">{consultation.biopsy_results}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Medical Images */}
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center text-lg font-semibold text-gray-900">
                  <ImageIcon className="mr-2 h-5 w-5 text-blue-600" />
                  Images médicales ({images.length})
                </h2>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Ajouter
                </button>
              </div>

              {imagesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
                </div>
              ) : (
                <ImageGallery
                  images={images}
                  onImageDeleted={handleImageDeleted}
                />
              )}
            </div>

            {/* Notes */}
            {consultation.notes && (
              <div className="rounded-lg bg-white p-6 shadow">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                  Remarques
                </h2>
                <div className="rounded-md bg-gray-50 p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{consultation.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Info Card */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Informations</h2>

              <div className="space-y-3">
                <div className="flex items-start">
                  <Calendar className="mr-3 mt-0.5 h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-500">Date & Heure</div>
                    <div className="mt-1 text-gray-900">
                      {formatDate(consultation.consultation_date)}
                      <br />
                      {formatTime(consultation.consultation_time)}
                    </div>
                  </div>
                </div>

                <div className="flex items-start">
                  <UserIcon className="mr-3 mt-0.5 h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-500">Patient</div>
                    <div className="mt-1 text-gray-900">
                      <button
                        onClick={() => router.push(`/dashboard/patients/${consultation.patient_id}`)}
                        className="text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        {consultation.patient_name || `Patient #${consultation.patient_id}`}
                      </button>
                    </div>
                  </div>
                </div>

                {consultation.appointment_id && (
                  <div className="flex items-start">
                    <Calendar className="mr-3 mt-0.5 h-5 w-5 text-gray-400" />
                    <div>
                      <div className="text-sm font-medium text-gray-500">Rendez-vous</div>
                      <div className="mt-1 text-gray-900">
                        <button
                          onClick={() => router.push(`/dashboard/appointments/${consultation.appointment_id}`)}
                          className="text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          Rendez-vous #{consultation.appointment_id}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Status Card */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Statut</h2>

              <div className="space-y-3">
                {consultation.follow_up_required && (
                  <div className="rounded-md bg-yellow-50 p-3">
                    <p className="text-sm font-medium text-yellow-900">Suivi requis</p>
                    {consultation.follow_up_date && (
                      <p className="mt-1 text-sm text-yellow-800">
                        Date: {formatDate(consultation.follow_up_date)}
                      </p>
                    )}
                  </div>
                )}

                {consultation.images_taken && (
                  <div className="flex items-center justify-between rounded-md bg-blue-50 p-3">
                    <div className="flex items-center">
                      <FileImage className="mr-2 h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Images prises</span>
                    </div>
                  </div>
                )}

                {consultation.biopsy_performed && (
                  <div className="flex items-center justify-between rounded-md bg-purple-50 p-3">
                    <div className="flex items-center">
                      <TestTube className="mr-2 h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-900">Biopsie réalisée</span>
                    </div>
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
                  <div className="mt-1 text-sm text-gray-900">{formatDateTime(consultation.created_at)}</div>
                </div>

                <div>
                  <div className="text-xs font-medium text-gray-500">Dernière modification</div>
                  <div className="mt-1 text-sm text-gray-900">{formatDateTime(consultation.updated_at)}</div>
                </div>

                <div>
                  <div className="text-xs font-medium text-gray-500">ID Médecin</div>
                  <div className="mt-1 text-sm text-gray-900">#{consultation.doctor_id}</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Actions rapides</h2>

              <div className="space-y-2">
                <button
                  onClick={() => router.push(`/dashboard/patients/${consultation.patient_id}`)}
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Voir le patient
                </button>
                {consultation.appointment_id && (
                  <button
                    onClick={() => router.push(`/dashboard/appointments/${consultation.appointment_id}`)}
                    className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Voir le rendez-vous
                  </button>
                )}
                <button
                  onClick={() => router.push(`/dashboard/prescriptions?consultation_id=${consultation.id}`)}
                  className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  Voir les ordonnances
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setShowUploadModal(false)}
          >
            <div
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-6 text-xl font-bold text-gray-900">
                Ajouter des images médicales
              </h2>

              <ImageUpload
                consultationId={consultationId}
                onUploadSuccess={handleUploadSuccess}
                onClose={() => setShowUploadModal(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
