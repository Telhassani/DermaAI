'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, FileText, Eye, Plus, ChevronDown, ChevronUp, Image as ImageIcon } from 'lucide-react'
import { getPatientConsultationHistory, ConsultationResponse } from '@/lib/api/consultations'

interface ConsultationHistoryProps {
  patientId: number
}

export default function ConsultationHistory({ patientId }: ConsultationHistoryProps) {
  const router = useRouter()
  const [consultations, setConsultations] = useState<ConsultationResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  useEffect(() => {
    fetchConsultations()
  }, [patientId])

  const fetchConsultations = async () => {
    try {
      setLoading(true)
      const data = await getPatientConsultationHistory(patientId, 1, 50)
      setConsultations(data.consultations)
    } catch (error) {
      console.error('Error fetching consultations:', error)
    } finally {
      setLoading(false)
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

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
      </div>
    )
  }

  if (consultations.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-300" />
        <p className="mt-4 text-sm text-gray-500">Aucune consultation enregistrée</p>
        <button
          onClick={() => router.push(`/dashboard/patients/${patientId}/consultation/new`)}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-sm font-medium text-white hover:from-violet-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
        >
          <Plus className="h-4 w-4" />
          Nouvelle consultation
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with action button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {consultations.length} consultation{consultations.length > 1 ? 's' : ''} enregistrée{consultations.length > 1 ? 's' : ''}
        </p>
        <button
          onClick={() => router.push(`/dashboard/patients/${patientId}/consultation/new`)}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-sm font-medium text-white hover:from-violet-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
        >
          <Plus className="h-4 w-4" />
          Nouvelle consultation
        </button>
      </div>

      {/* Consultation list */}
      <div className="space-y-3">
        {consultations.map((consultation) => (
          <div
            key={consultation.id}
            className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden transition-all"
          >
            {/* Consultation header */}
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {formatDate(consultation.consultation_date)}
                      <span className="text-gray-400">•</span>
                      {formatTime(consultation.consultation_time)}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {consultation.chief_complaint}
                  </p>
                  {consultation.diagnosis && (
                    <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                      Diagnostic: {consultation.diagnosis}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => toggleExpand(consultation.id)}
                  className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {expandedId === consultation.id ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Expanded content */}
            {expandedId === consultation.id && (
              <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
                {/* Symptoms */}
                {consultation.symptoms && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Symptômes</h4>
                    <p className="text-sm text-gray-900">{consultation.symptoms}</p>
                    {consultation.duration_symptoms && (
                      <p className="text-xs text-gray-500 mt-1">Durée: {consultation.duration_symptoms}</p>
                    )}
                  </div>
                )}

                {/* Dermatological examination */}
                {consultation.dermatological_examination && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">
                      Examen dermatologique
                    </h4>
                    <p className="text-sm text-gray-900">{consultation.dermatological_examination}</p>
                  </div>
                )}

                {/* Lesion characteristics */}
                {(consultation.lesion_type || consultation.lesion_location) && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">
                      Caractéristiques des lésions
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {consultation.lesion_type && (
                        <div>
                          <p className="text-xs text-gray-500">Type</p>
                          <p className="text-sm text-gray-900">{consultation.lesion_type}</p>
                        </div>
                      )}
                      {consultation.lesion_location && (
                        <div>
                          <p className="text-xs text-gray-500">Localisation</p>
                          <p className="text-sm text-gray-900">{consultation.lesion_location}</p>
                        </div>
                      )}
                      {consultation.lesion_size && (
                        <div>
                          <p className="text-xs text-gray-500">Taille</p>
                          <p className="text-sm text-gray-900">{consultation.lesion_size}</p>
                        </div>
                      )}
                      {consultation.lesion_color && (
                        <div>
                          <p className="text-xs text-gray-500">Couleur</p>
                          <p className="text-sm text-gray-900">{consultation.lesion_color}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Diagnosis */}
                {consultation.diagnosis && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Diagnostic</h4>
                    <p className="text-sm text-gray-900">{consultation.diagnosis}</p>
                  </div>
                )}

                {/* Differential diagnosis */}
                {consultation.differential_diagnosis && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">
                      Diagnostic différentiel
                    </h4>
                    <p className="text-sm text-gray-900">{consultation.differential_diagnosis}</p>
                  </div>
                )}

                {/* Treatment plan */}
                {consultation.treatment_plan && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">
                      Plan de traitement
                    </h4>
                    <p className="text-sm text-gray-900">{consultation.treatment_plan}</p>
                  </div>
                )}

                {/* Follow-up */}
                {consultation.follow_up_required && (
                  <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
                    <p className="text-sm font-medium text-yellow-800">
                      Suivi nécessaire
                      {consultation.follow_up_date && (
                        <span className="ml-2 text-yellow-700">
                          • {formatDate(consultation.follow_up_date)}
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {/* Notes */}
                {consultation.notes && (
                  <div>
                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Notes</h4>
                    <p className="text-sm text-gray-900">{consultation.notes}</p>
                  </div>
                )}

                {/* Additional info */}
                <div className="flex items-center gap-4 text-xs text-gray-500 pt-3 border-t border-gray-200">
                  {consultation.images_taken && (
                    <div className="flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" />
                      Images prises
                    </div>
                  )}
                  {consultation.biopsy_performed && (
                    <div className="flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Biopsie effectuée
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => router.push(`/dashboard/consultations/${consultation.id}`)}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-white transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    Voir détails
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
