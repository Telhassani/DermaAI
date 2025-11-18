'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getConsultation, ConsultationResponse } from '@/lib/api/consultations'
import { listPrescriptions, PrescriptionResponse, createPrescription, updatePrescription, deletePrescription, markPrescriptionPrinted } from '@/lib/api/prescriptions'
import { getPatient, PatientResponse } from '@/lib/api/patients'
import { uploadImage, getConsultationImages, getPatientImages, deleteImage, validateImageFile, updateImage, ImageResponse } from '@/lib/api/images'
import { useAuthStore } from '@/lib/stores/auth-store'
import { ArrowLeft, Upload, FileText, Plus, Clock, User, Pill, Image as ImageIcon, X, Download, Edit2, Trash2, Check, AlertCircle, Printer } from 'lucide-react'
import { ImageAnnotationModal } from '@/components/images/ImageAnnotationModal'
import { PrescriptionCard } from '@/components/prescriptions/PrescriptionCard'

export default function ConsultationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const consultationId = params.id as string
  const { user } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  const [consultation, setConsultation] = useState<ConsultationResponse | null>(null)
  const [patient, setPatient] = useState<PatientResponse | null>(null)
  const [prescriptions, setPrescriptions] = useState<PrescriptionResponse[]>([])
  const [images, setImages] = useState<ImageResponse[]>([])
  const [allPatientImages, setAllPatientImages] = useState<ImageResponse[]>([])
  const [showAllPatientImages, setShowAllPatientImages] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'details' | 'images' | 'prescriptions'>('details')
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false)
  const [editingPrescriptionId, setEditingPrescriptionId] = useState<number | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [globalDragActive, setGlobalDragActive] = useState(false)
  const [annotationModalOpen, setAnnotationModalOpen] = useState(false)
  const [selectedImageForAnnotation, setSelectedImageForAnnotation] = useState<ImageResponse | null>(null)
  const [prescriptionData, setPrescriptionData] = useState({
    medications: [{ name: '', dosage: '', frequency: '', duration: '' }],
    instructions: '',
    notes: ''
  })

  useEffect(() => {
    fetchConsultationDetails()
  }, [consultationId])

  // Listen for the custom drop event from DragDropHandler
  useEffect(() => {
    const handleAppFileDrop = (event: Event) => {
      const customEvent = event as CustomEvent
      console.log('[Consultation] appFileDrop event received')
      console.log('[Consultation] Current state:', { hasConsultation: !!consultation, hasPatient: !!patient })
      setGlobalDragActive(false)

      const files = customEvent.detail?.files
      if (files && files.length > 0) {
        console.log('[Consultation] Files received:', files.length)
        // Call processFiles asynchronously
        void processFiles(files)
      }
    }

    document.addEventListener('appFileDrop', handleAppFileDrop as EventListener)

    // Also listen for drag events to show visual feedback
    const dragenterHandler = () => {
      console.log('[Consultation] User dragging files')
      setGlobalDragActive(true)
    }

    const dragleaveHandler = (e: DragEvent) => {
      if (e.clientX === 0 && e.clientY === 0) {
        console.log('[Consultation] User stopped dragging')
        setGlobalDragActive(false)
      }
    }

    document.addEventListener('dragenter', dragenterHandler as EventListener)
    document.addEventListener('dragleave', dragleaveHandler as EventListener)

    return () => {
      document.removeEventListener('appFileDrop', handleAppFileDrop as EventListener)
      document.removeEventListener('dragenter', dragenterHandler as EventListener)
      document.removeEventListener('dragleave', dragleaveHandler as EventListener)
    }
  }, [consultation, patient])

  const fetchConsultationDetails = async () => {
    try {
      setLoading(true)
      const data = await getConsultation(parseInt(consultationId))
      setConsultation(data)

      // Fetch patient data
      const patientData = await getPatient(data.patient_id)
      setPatient(patientData)

      // Fetch prescriptions for this consultation
      const prescriptionsData = await listPrescriptions({
        consultation_id: parseInt(consultationId)
      })
      setPrescriptions(prescriptionsData.prescriptions)

      // Fetch images for this consultation (focused view)
      const imagesData = await getConsultationImages(parseInt(consultationId))
      setImages(imagesData.images)

      // Fetch all patient images (for toggle view)
      const allImagesData = await getPatientImages(data.patient_id)
      setAllPatientImages(allImagesData.images)
    } catch (error) {
      console.error('Error fetching consultation:', error)
    } finally {
      setLoading(false)
    }
  }

  const processFiles = async (files: FileList) => {
    console.log('[processFiles] Starting file processing:', { count: files.length, hasConsultation: !!consultation, hasPatient: !!patient })

    if (!consultation || !patient) {
      console.error('[processFiles] Missing consultation or patient')
      return
    }

    setUploadingImage(true)
    setUploadError(null)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      console.log(`[processFiles] Processing file ${i + 1}:`, { name: file.name, size: file.size, type: file.type })

      // Validate file
      const validation = validateImageFile(file)
      if (!validation.valid) {
        console.warn('[processFiles] File validation failed:', validation.error)
        setUploadError(validation.error || 'Erreur de validation du fichier')
        continue
      }

      try {
        // Upload to backend
        console.log('[processFiles] Uploading file:', file.name)
        const uploadedImage = await uploadImage(
          consultation.id,
          file,
          patient.id,
          'clinical'
        )
        console.log('[processFiles] File uploaded successfully:', uploadedImage.id)
        setImages(prev => [...prev, uploadedImage])

        // Open annotation modal for the uploaded image
        console.log('[processFiles] Opening annotation modal for image:', uploadedImage.id)
        setSelectedImageForAnnotation(uploadedImage)
        setAnnotationModalOpen(true)

        // Wait a bit before processing next file if multiple uploads
        if (i < files.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } catch (error) {
        console.error('[processFiles] Error uploading image:', error)
        setUploadError('Erreur lors du téléchargement de l\'image')
      }
    }

    setUploadingImage(false)
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    console.log('[processFiles] File processing complete')
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return
    await processFiles(files)
  }

  // These handlers are only for local visual feedback on the drop zone
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'copy'
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget === e.target) {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent) => {
    // This won't be called - the global handler will handle it
    e.preventDefault()
    e.stopPropagation()
  }

  const removeImage = async (imageId: number) => {
    try {
      await deleteImage(imageId)
      // Remove from both consultation and all patient images
      setImages(prev => prev.filter(img => img.id !== imageId))
      setAllPatientImages(prev => prev.filter(img => img.id !== imageId))
    } catch (error) {
      console.error('Error deleting image:', error)
      setUploadError('Erreur lors de la suppression de l\'image')
    }
  }

  const handleSaveAnnotation = async (imageId: number, notes: string) => {
    try {
      console.log('[handleSaveAnnotation] Saving annotations for image:', imageId)
      const updatedImage = await updateImage(imageId, { notes })
      console.log('[handleSaveAnnotation] Annotations saved successfully')

      // Update the image in both lists
      setImages(prev =>
        prev.map(img => (img.id === imageId ? updatedImage : img))
      )
      setAllPatientImages(prev =>
        prev.map(img => (img.id === imageId ? updatedImage : img))
      )

      // Close the modal
      setAnnotationModalOpen(false)
      setSelectedImageForAnnotation(null)
    } catch (error) {
      console.error('[handleSaveAnnotation] Error saving annotations:', error)
      throw error
    }
  }

  const handleAddMedication = () => {
    setPrescriptionData(prev => ({
      ...prev,
      medications: [...prev.medications, { name: '', dosage: '', frequency: '', duration: '' }]
    }))
  }

  const handleRemoveMedication = (index: number) => {
    setPrescriptionData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }))
  }

  const handleMedicationChange = (index: number, field: string, value: string) => {
    setPrescriptionData(prev => {
      const newMeds = [...prev.medications]
      newMeds[index] = { ...newMeds[index], [field]: value }
      return { ...prev, medications: newMeds }
    })
  }

  const handleCreatePrescription = async () => {
    if (!consultation) return

    try {
      await createPrescription({
        consultation_id: parseInt(consultationId),
        patient_id: consultation.patient_id,
        medications: prescriptionData.medications,
        instructions: prescriptionData.instructions,
        notes: prescriptionData.notes
      })

      // Refresh prescriptions
      const updatedData = await listPrescriptions({
        consultation_id: parseInt(consultationId)
      })
      setPrescriptions(updatedData.prescriptions)
      setShowPrescriptionForm(false)
      setPrescriptionData({
        medications: [{ name: '', dosage: '', frequency: '', duration: '' }],
        instructions: '',
        notes: ''
      })
    } catch (error) {
      console.error('Error creating prescription:', error)
    }
  }

  const handleEditPrescription = (prescription: PrescriptionResponse) => {
    setEditingPrescriptionId(prescription.id)
    setPrescriptionData({
      medications: prescription.medications || [],
      instructions: prescription.instructions || '',
      notes: prescription.notes || ''
    })
  }

  const handleUpdatePrescription = async () => {
    if (!editingPrescriptionId) return

    try {
      await updatePrescription(editingPrescriptionId, {
        consultation_id: 0, // Not needed for update
        patient_id: 0, // Not needed for update
        medications: prescriptionData.medications,
        instructions: prescriptionData.instructions,
        notes: prescriptionData.notes
      })

      // Refresh prescriptions
      const updatedData = await listPrescriptions({
        consultation_id: parseInt(consultationId)
      })
      setPrescriptions(updatedData.prescriptions)
      setEditingPrescriptionId(null)
      setPrescriptionData({
        medications: [{ name: '', dosage: '', frequency: '', duration: '' }],
        instructions: '',
        notes: ''
      })
    } catch (error) {
      console.error('Error updating prescription:', error)
    }
  }

  const handleDeletePrescription = async (prescriptionId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette ordonnance ?')) return

    try {
      await deletePrescription(prescriptionId)

      // Refresh prescriptions
      const updatedData = await listPrescriptions({
        consultation_id: parseInt(consultationId)
      })
      setPrescriptions(updatedData.prescriptions)
    } catch (error) {
      console.error('Error deleting prescription:', error)
    }
  }

  const handlePrintPrescription = async (prescription: PrescriptionResponse) => {
    try {
      // Mark as printed
      await markPrescriptionPrinted(prescription.id)
      // Navigate to print page
      router.push(`/print-prescription/${prescription.id}`)
    } catch (error) {
      console.error('Error marking prescription as printed:', error)
      alert('Erreur lors du marquage de l\'ordonnance')
    }
  }

  const cancelEdit = () => {
    setEditingPrescriptionId(null)
    setPrescriptionData({
      medications: [{ name: '', dosage: '', frequency: '', duration: '' }],
      instructions: '',
      notes: ''
    })
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
      </div>
    )
  }

  if (!consultation) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
        <p className="text-sm text-gray-500">Consultation non trouvée</p>
      </div>
    )
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
          <h1 className="text-3xl font-bold text-gray-900">Détails de la consultation</h1>
          <p className="mt-1 text-sm text-gray-500">
            {formatDate(consultation.consultation_date)} à {formatTime(consultation.consultation_time)}
          </p>
          {patient && (
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-semibold">Patient:</span> {patient.full_name} • <span className="text-gray-500">ID: {patient.id}</span>
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'details'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Détails
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'images'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <ImageIcon className="inline h-4 w-4 mr-2" />
            Images ({showAllPatientImages ? allPatientImages.length : images.length}/{allPatientImages.length})
          </button>
          <button
            onClick={() => setActiveTab('prescriptions')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'prescriptions'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Pill className="inline h-4 w-4 mr-2" />
            Ordonnances ({prescriptions.length})
          </button>
        </div>
      </div>

      {/* Details Tab */}
      {activeTab === 'details' && (
        <div className="space-y-4">
          {/* Chief Complaint */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="font-semibold text-gray-900 mb-2">Motif de consultation</h3>
            <p className="text-gray-700">{consultation.chief_complaint}</p>
          </div>

          {/* Symptoms */}
          {consultation.symptoms && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Symptômes</h3>
              <p className="text-gray-700">{consultation.symptoms}</p>
              {consultation.duration_symptoms && (
                <p className="text-sm text-gray-500 mt-2">Durée: {consultation.duration_symptoms}</p>
              )}
            </div>
          )}

          {/* Dermatological Examination */}
          {consultation.dermatological_examination && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Examen dermatologique</h3>
              <p className="text-gray-700">{consultation.dermatological_examination}</p>
            </div>
          )}

          {/* Lesion Characteristics */}
          {(consultation.lesion_type || consultation.lesion_location) && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Caractéristiques des lésions</h3>
              <div className="grid grid-cols-2 gap-4">
                {consultation.lesion_type && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Type</p>
                    <p className="text-gray-900">{consultation.lesion_type}</p>
                  </div>
                )}
                {consultation.lesion_location && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Localisation</p>
                    <p className="text-gray-900">{consultation.lesion_location}</p>
                  </div>
                )}
                {consultation.lesion_size && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Taille</p>
                    <p className="text-gray-900">{consultation.lesion_size}</p>
                  </div>
                )}
                {consultation.lesion_color && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Couleur</p>
                    <p className="text-gray-900">{consultation.lesion_color}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Diagnosis */}
          {consultation.diagnosis && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Diagnostic</h3>
              <p className="text-gray-700">{consultation.diagnosis}</p>
            </div>
          )}

          {/* Treatment Plan */}
          {consultation.treatment_plan && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Plan de traitement</h3>
              <p className="text-gray-700">{consultation.treatment_plan}</p>
            </div>
          )}

          {/* Follow-up */}
          {consultation.follow_up_required && (
            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6">
              <h3 className="font-semibold text-yellow-900 mb-2">Suivi nécessaire</h3>
              {consultation.follow_up_date && (
                <p className="text-yellow-800">Date: {formatDate(consultation.follow_up_date)}</p>
              )}
            </div>
          )}

          {/* Notes */}
          {consultation.notes && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Remarques</h3>
              <p className="text-gray-700">{consultation.notes}</p>
            </div>
          )}
        </div>
      )}

      {/* Images Tab */}
      {activeTab === 'images' && (
        <div className="space-y-4">
          {/* Error Message */}
          {uploadError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-900">{uploadError}</p>
              </div>
              <button
                onClick={() => setUploadError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Upload Area */}
          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
              dragActive || globalDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-2">
              <Upload className={`h-8 w-8 ${dragActive || globalDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
              <span className="text-sm font-medium text-gray-700">
                Glissez-déposez des images ici ou cliquez pour parcourir
              </span>
              <span className="text-xs text-gray-500">PNG, JPG, GIF jusqu'à 10MB</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploadingImage}
              className="hidden"
            />
          </div>

          {uploadingImage && (
            <div className="flex items-center justify-center gap-2 py-4">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-r-transparent"></div>
              <p className="text-sm text-gray-600">Téléchargement en cours...</p>
            </div>
          )}

          {/* View Toggle - Show only if there are images outside this consultation */}
          {allPatientImages.length > images.length && (
            <div className="flex gap-2 items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
              <span className="text-sm text-gray-600">
                Afficher: <span className="font-semibold">{showAllPatientImages ? 'Toutes les images du patient' : 'Images de cette visite'}</span>
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAllPatientImages(false)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    !showAllPatientImages
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Cette visite ({images.length})
                </button>
                <button
                  onClick={() => setShowAllPatientImages(true)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    showAllPatientImages
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Toutes ({allPatientImages.length})
                </button>
              </div>
            </div>
          )}

          {/* Images Gallery */}
          {(showAllPatientImages ? allPatientImages : images).length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">
                {showAllPatientImages ? 'Toutes les images du patient' : 'Images de cette visite'} ({(showAllPatientImages ? allPatientImages : images).length})
              </h3>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {(showAllPatientImages ? allPatientImages : images).map((image) => {
                  const uploadDate = new Date(image.uploaded_at)
                  const formattedDate = uploadDate.toLocaleDateString('fr-FR', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })

                  // Check if image belongs to this consultation
                  const isFromThisConsultation = image.consultation_id === parseInt(consultationId)

                  return (
                    <div key={image.id} className="relative group">
                      <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={`data:${image.mime_type};base64,${image.image_data}`}
                          alt={`Consultation image ${image.id}`}
                          className="w-full h-full object-cover"
                        />

                        {/* Badge for images from other consultations */}
                        {showAllPatientImages && !isFromThisConsultation && (
                          <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded">
                            Autre visite
                          </div>
                        )}

                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setSelectedImageForAnnotation(image)
                              setAnnotationModalOpen(true)
                            }}
                            className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
                            title="Modifier les annotations"
                          >
                            <Edit2 className="h-3 w-3" />
                            Notes
                          </button>
                          <button
                            onClick={() => removeImage(image.id)}
                            className="flex items-center justify-center h-8 w-8 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
                            title="Supprimer l'image"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Info Badge */}
                      <div className="mt-2 space-y-1">
                        <p className="text-xs text-gray-500">{formattedDate}</p>
                        {image.notes && (
                          <div className="text-xs bg-blue-50 text-blue-700 p-1 rounded line-clamp-2">
                            {image.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {(showAllPatientImages ? allPatientImages : images).length === 0 && !uploadingImage && (
            <div className="text-center py-8">
              <ImageIcon className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">
                {showAllPatientImages ? 'Aucune image pour ce patient' : 'Aucune image téléchargée pour cette visite'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Prescriptions Tab */}
      {activeTab === 'prescriptions' && (
        <div className="space-y-4">
          {/* Add Prescription Button */}
          {!showPrescriptionForm && (
            <button
              onClick={() => setShowPrescriptionForm(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nouvelle ordonnance
            </button>
          )}

          {/* Prescription Form */}
          {(showPrescriptionForm || editingPrescriptionId) && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                {editingPrescriptionId ? 'Modifier l\'ordonnance' : 'Créer une ordonnance'}
              </h3>

              {/* Patient Information Section */}
              {patient && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-gray-900 mb-3">Informations du patient</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Nom complet</p>
                      <p className="text-gray-900 font-medium">{patient.full_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Âge</p>
                      <p className="text-gray-900">{patient.age} ans</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Genre</p>
                      <p className="text-gray-900 capitalize">{patient.gender === 'male' ? 'Masculin' : patient.gender === 'female' ? 'Féminin' : 'Autre'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">ID Patient</p>
                      <p className="text-gray-900">{patient.identification_type.toUpperCase()}: {patient.identification_number}</p>
                    </div>
                    {patient.phone && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Téléphone</p>
                        <p className="text-gray-900">{patient.phone}</p>
                      </div>
                    )}
                    {patient.address && (
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Adresse</p>
                        <p className="text-gray-900">{patient.address}, {patient.city}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Medications */}
              <div className="space-y-4 mb-6">
                <h4 className="font-medium text-gray-900">Médicaments</h4>
                {prescriptionData.medications.map((med, index) => (
                  <div key={index} className="space-y-2 p-4 border border-gray-200 rounded-lg">
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-2">
                      <input
                        type="text"
                        placeholder="Nom du médicament"
                        value={med.name}
                        onChange={(e) => handleMedicationChange(index, 'name', e.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Dosage (ex: 500mg)"
                        value={med.dosage}
                        onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Fréquence (ex: 3x par jour)"
                        value={med.frequency}
                        onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Durée (ex: 7 jours)"
                        value={med.duration}
                        onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    {prescriptionData.medications.length > 1 && (
                      <button
                        onClick={() => handleRemoveMedication(index)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                ))}
                <button
                  onClick={handleAddMedication}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  + Ajouter un médicament
                </button>
              </div>

              {/* Instructions */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instructions
                </label>
                <textarea
                  value={prescriptionData.instructions}
                  onChange={(e) => setPrescriptionData(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Instructions spéciales pour le patient..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  rows={3}
                />
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={prescriptionData.notes}
                  onChange={(e) => setPrescriptionData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Notes additionnelles..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={editingPrescriptionId ? handleUpdatePrescription : handleCreatePrescription}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  <Check className="h-4 w-4" />
                  {editingPrescriptionId ? 'Mettre à jour' : 'Créer'} l'ordonnance
                </button>
                <button
                  onClick={() => {
                    setShowPrescriptionForm(false)
                    cancelEdit()
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          {/* Existing Prescriptions */}
          {prescriptions.length > 0 && !editingPrescriptionId && (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900">Ordonnances ({prescriptions.length})</h3>
              {prescriptions.map((prescription) => {
                const isDoctorOwner = user?.id === prescription.doctor_id
                const canEdit = user?.role === 'doctor' && isDoctorOwner

                return (
                  <PrescriptionCard
                    key={prescription.id}
                    id={prescription.id}
                    prescription_date={prescription.prescription_date}
                    patient_name={prescription.patient_name}
                    medications={prescription.medications}
                    instructions={prescription.instructions}
                    is_delivered={prescription.is_delivered}
                    onEdit={() => handleEditPrescription(prescription)}
                    onPrint={() => handlePrintPrescription(prescription)}
                    onDelete={() => handleDeletePrescription(prescription.id)}
                    canDelete={canEdit}
                  />
                )
              })}
            </div>
          )}

          {prescriptions.length === 0 && !showPrescriptionForm && (
            <div className="text-center py-8">
              <Pill className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">Aucune ordonnance</p>
            </div>
          )}
        </div>
      )}

      {/* Image Annotation Modal */}
      <ImageAnnotationModal
        isOpen={annotationModalOpen}
        image={selectedImageForAnnotation}
        patientName={patient?.full_name || 'Patient'}
        onSave={handleSaveAnnotation}
        onCancel={() => {
          setAnnotationModalOpen(false)
          setSelectedImageForAnnotation(null)
        }}
      />
    </div>
  )
}
