'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, Save, Stethoscope, FileText, Activity, AlertCircle, Upload, Image as ImageIcon, X } from 'lucide-react'
import { createConsultation, ConsultationData } from '@/lib/api/consultations'
import { AIAnalysisButton } from '@/components/ai-analysis/AIAnalysisButton'
import { AIAnalysisResponse } from '@/lib/api/ai-analysis'
import { toast } from 'sonner'

export default function NewConsultationPage() {
  const router = useRouter()
  const params = useParams()
  const patientId = parseInt(params.id as string)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState<ConsultationData>({
    patient_id: patientId,
    consultation_date: new Date().toISOString().split('T')[0],
    chief_complaint: '',
    symptoms: '',
    duration_symptoms: '',
    medical_history_notes: '',
    clinical_examination: '',
    dermatological_examination: '',
    lesion_type: '',
    lesion_location: '',
    lesion_size: '',
    lesion_color: '',
    lesion_texture: '',
    diagnosis: '',
    differential_diagnosis: '',
    treatment_plan: '',
    follow_up_required: false,
    follow_up_date: '',
    notes: '',
    private_notes: '',
    images_taken: false,
    biopsy_performed: false,
    biopsy_results: '',
  })

  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
  }

  const handleAnalysisComplete = (analysis: AIAnalysisResponse) => {
    setFormData((prev: ConsultationData) => ({
      ...prev,
      diagnosis: analysis.primary_diagnosis || prev.diagnosis,
      differential_diagnosis: analysis.differential_diagnoses?.map(d => `${d.condition} (${d.probability})`).join('\n') || prev.differential_diagnosis,
      clinical_examination: (prev.clinical_examination ? prev.clinical_examination + '\n\n' : '') +
        `[IA] Observations: ${analysis.clinical_findings?.join(', ')}`,
      treatment_plan: (prev.treatment_plan ? prev.treatment_plan + '\n\n' : '') +
        `[IA] Recommandations: ${analysis.recommendations?.join(', ')}`,
      lesion_type: analysis.clinical_findings?.find(f => f.includes('Type')) || prev.lesion_type, // Simple heuristic
    }))
    toast.success("Les résultats de l'analyse ont été ajoutés au formulaire")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await createConsultation(formData)
      router.push(`/dashboard/patients/${patientId}?tab=consultations`)
    } catch (err: any) {
      console.error('Error creating consultation:', err)
      setError(err.response?.data?.detail || 'Erreur lors de la création de la consultation')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData((prev: ConsultationData) => ({ ...prev, [name]: checked }))
    } else {
      setFormData((prev: ConsultationData) => ({ ...prev, [name]: value }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Nouvelle consultation</h1>
          <p className="mt-1 text-sm text-gray-500">
            Saisir les informations de la consultation dermatologique
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations générales */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Informations générales</h2>
          </div>

          <div className="grid gap-4">
            <div>
              <label htmlFor="consultation_date" className="block text-sm font-medium text-gray-700 mb-1">
                Date de consultation <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="consultation_date"
                name="consultation_date"
                value={formData.consultation_date}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="chief_complaint" className="block text-sm font-medium text-gray-700 mb-1">
                Motif de consultation <span className="text-red-500">*</span>
              </label>
              <textarea
                id="chief_complaint"
                name="chief_complaint"
                value={formData.chief_complaint}
                onChange={handleChange}
                required
                rows={3}
                placeholder="Raison principale de la visite..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="symptoms" className="block text-sm font-medium text-gray-700 mb-1">
                  Symptômes
                </label>
                <textarea
                  id="symptoms"
                  name="symptoms"
                  value={formData.symptoms}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Description des symptômes..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="duration_symptoms" className="block text-sm font-medium text-gray-700 mb-1">
                  Durée des symptômes
                </label>
                <input
                  type="text"
                  id="duration_symptoms"
                  name="duration_symptoms"
                  value={formData.duration_symptoms}
                  onChange={handleChange}
                  placeholder="Ex: 2 semaines, 3 mois..."
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="medical_history_notes" className="block text-sm font-medium text-gray-700 mb-1">
                Antécédents médicaux pertinents
              </label>
              <textarea
                id="medical_history_notes"
                name="medical_history_notes"
                value={formData.medical_history_notes}
                onChange={handleChange}
                rows={2}
                placeholder="Antécédents pertinents pour cette consultation..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Examen clinique */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Examen clinique</h2>
          </div>

          <div className="grid gap-4">
            <div>
              <label htmlFor="clinical_examination" className="block text-sm font-medium text-gray-700 mb-1">
                Examen clinique général
              </label>
              <textarea
                id="clinical_examination"
                name="clinical_examination"
                value={formData.clinical_examination}
                onChange={handleChange}
                rows={3}
                placeholder="Résultats de l'examen clinique..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="dermatological_examination" className="block text-sm font-medium text-gray-700 mb-1">
                Examen dermatologique
              </label>
              <textarea
                id="dermatological_examination"
                name="dermatological_examination"
                value={formData.dermatological_examination}
                onChange={handleChange}
                rows={4}
                placeholder="Examen dermatologique détaillé..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Caractéristiques des lésions */}
            <div className="border-t border-gray-200 pt-4 mt-2">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Caractéristiques des lésions</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="lesion_type" className="block text-sm font-medium text-gray-700 mb-1">
                    Type de lésion
                  </label>
                  <input
                    type="text"
                    id="lesion_type"
                    name="lesion_type"
                    value={formData.lesion_type}
                    onChange={handleChange}
                    placeholder="Ex: Macule, papule, nodule..."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="lesion_location" className="block text-sm font-medium text-gray-700 mb-1">
                    Localisation
                  </label>
                  <input
                    type="text"
                    id="lesion_location"
                    name="lesion_location"
                    value={formData.lesion_location}
                    onChange={handleChange}
                    placeholder="Ex: Bras gauche, dos..."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="lesion_size" className="block text-sm font-medium text-gray-700 mb-1">
                    Taille
                  </label>
                  <input
                    type="text"
                    id="lesion_size"
                    name="lesion_size"
                    value={formData.lesion_size}
                    onChange={handleChange}
                    placeholder="Ex: 2cm x 3cm"
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label htmlFor="lesion_color" className="block text-sm font-medium text-gray-700 mb-1">
                    Couleur
                  </label>
                  <input
                    type="text"
                    id="lesion_color"
                    name="lesion_color"
                    value={formData.lesion_color}
                    onChange={handleChange}
                    placeholder="Ex: Rouge, brun..."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="lesion_texture" className="block text-sm font-medium text-gray-700 mb-1">
                    Texture
                  </label>
                  <input
                    type="text"
                    id="lesion_texture"
                    name="lesion_texture"
                    value={formData.lesion_texture}
                    onChange={handleChange}
                    placeholder="Ex: Lisse, rugueuse, squameuse..."
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Examens complémentaires */}
            <div className="border-t border-gray-200 pt-4 mt-2">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Examens complémentaires</h3>
              <div className="grid gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="images_taken"
                    name="images_taken"
                    checked={formData.images_taken}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="images_taken" className="text-sm text-gray-700">
                    Images prises pendant la consultation
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="biopsy_performed"
                    name="biopsy_performed"
                    checked={formData.biopsy_performed}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="biopsy_performed" className="text-sm text-gray-700">
                    Biopsie effectuée
                  </label>
                </div>

                {formData.biopsy_performed && (
                  <div>
                    <label htmlFor="biopsy_results" className="block text-sm font-medium text-gray-700 mb-1">
                      Résultats de la biopsie
                    </label>
                    <textarea
                      id="biopsy_results"
                      name="biopsy_results"
                      value={formData.biopsy_results}
                      onChange={handleChange}
                      rows={3}
                      placeholder="Résultats de la biopsie..."
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Diagnostic et traitement */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900">Diagnostic et traitement</h2>
          </div>

          <div className="grid gap-4">
            <div>
              <label htmlFor="diagnosis" className="block text-sm font-medium text-gray-700 mb-1">
                Diagnostic
              </label>
              <textarea
                id="diagnosis"
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleChange}
                rows={2}
                placeholder="Diagnostic principal..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="differential_diagnosis" className="block text-sm font-medium text-gray-700 mb-1">
                Diagnostic différentiel
              </label>
              <textarea
                id="differential_diagnosis"
                name="differential_diagnosis"
                value={formData.differential_diagnosis}
                onChange={handleChange}
                rows={2}
                placeholder="Autres diagnostics possibles..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="treatment_plan" className="block text-sm font-medium text-gray-700 mb-1">
                Plan de traitement
              </label>
              <textarea
                id="treatment_plan"
                name="treatment_plan"
                value={formData.treatment_plan}
                onChange={handleChange}
                rows={4}
                placeholder="Plan de traitement détaillé..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Suivi */}
            <div className="border-t border-gray-200 pt-4 mt-2">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Suivi</h3>
              <div className="grid gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="follow_up_required"
                    name="follow_up_required"
                    checked={formData.follow_up_required}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="follow_up_required" className="text-sm text-gray-700">
                    Suivi nécessaire
                  </label>
                </div>

                {formData.follow_up_required && (
                  <div>
                    <label htmlFor="follow_up_date" className="block text-sm font-medium text-gray-700 mb-1">
                      Date de suivi recommandée
                    </label>
                    <input
                      type="date"
                      id="follow_up_date"
                      name="follow_up_date"
                      value={formData.follow_up_date}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Remarques */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Remarques</h2>
          </div>

          <div className="grid gap-4">
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes générales
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Notes additionnelles..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="private_notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes privées
                <span className="ml-2 text-xs text-gray-500">(Visible uniquement par le médecin)</span>
              </label>
              <textarea
                id="private_notes"
                name="private_notes"
                value={formData.private_notes}
                onChange={handleChange}
                rows={3}
                placeholder="Notes privées du médecin..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></div>
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Enregistrer la consultation
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
