'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Edit2,
  Trash2,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Heart,
  FileText,
  Image as ImageIcon,
  Pill,
  Activity,
  Upload,
  X,
  Printer,
} from 'lucide-react'
import { getPatient, deletePatient, PatientResponse } from '@/lib/api/patients'
import { getPatientConsultationHistory, getConsultation, ConsultationResponse } from '@/lib/api/consultations'
import { listPrescriptions, deletePrescription, PrescriptionResponse, markPrescriptionPrinted } from '@/lib/api/prescriptions'
import { getPatientImages, deleteImage, updateImage, uploadImage, validateImageFile, ImageResponse } from '@/lib/api/images'
import ConsultationHistory from '@/components/consultations/ConsultationHistory'
import { ImageAnnotationModal } from '@/components/images/ImageAnnotationModal'
import { PrescriptionEditModal } from '@/components/prescriptions/PrescriptionEditModal'
import { PrescriptionCard } from '@/components/prescriptions/PrescriptionCard'

export default function PatientDetailPage() {
  const router = useRouter()
  const params = useParams()
  const patientId = parseInt(params.id as string)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [patient, setPatient] = useState<PatientResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [consultationCount, setConsultationCount] = useState(0)
  const [prescriptionCount, setPrescriptionCount] = useState(0)
  const [imageCount, setImageCount] = useState(0)
  const [lastConsultationDate, setLastConsultationDate] = useState<string | null>(null)
  const [images, setImages] = useState<ImageResponse[]>([])
  const [prescriptions, setPrescriptions] = useState<PrescriptionResponse[]>([])
  const [uploadingImage, setUploadingImage] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [annotationModalOpen, setAnnotationModalOpen] = useState(false)
  const [selectedImageForAnnotation, setSelectedImageForAnnotation] = useState<ImageResponse | null>(null)
  const [editingPrescription, setEditingPrescription] = useState<PrescriptionResponse | null>(null)
  const [prescriptionEditModalOpen, setPrescriptionEditModalOpen] = useState(false)
  const [consultationNumbers, setConsultationNumbers] = useState<{ [key: number]: number | undefined }>({})

  const fetchPatient = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getPatient(patientId)
      setPatient(data)
    } catch (error) {
      console.error('Error fetching patient:', error)
      alert('Erreur lors du chargement du patient')
      router.push('/dashboard/patients')
    } finally {
      setLoading(false)
    }
  }, [patientId, router])

  const fetchStatistics = useCallback(async () => {
    try {
      console.log('📊 Fetching statistics for patientId:', patientId)
      // Fetch consultation history, prescriptions, and images in parallel
      const consultationPromise = getPatientConsultationHistory(patientId, 1, 50)
      const prescriptionPromise = listPrescriptions({ patient_id: patientId })
      const imagesPromise = getPatientImages(patientId)

      const [consultationData, prescriptionData, imagesData] = await Promise.all([
        consultationPromise,
        prescriptionPromise,
        imagesPromise,
      ])

      console.log('📊 Statistics fetched successfully:', {
        consultations: consultationData.total,
        prescriptions: prescriptionData.total,
        images: imagesData.total,
      })

      setConsultationCount(consultationData.total)
      setPrescriptionCount(prescriptionData.total)
      setImageCount(imagesData.total)

      // Store prescriptions list for display
      setPrescriptions(prescriptionData.prescriptions || [])

      // Get last consultation date if available
      if (consultationData.consultations.length > 0) {
        const lastConsultation = consultationData.consultations[0]
        setLastConsultationDate(lastConsultation.consultation_time)
      }
    } catch (error) {
      console.error('❌ Error fetching statistics:', error)
      // Silently fail - statistics are not critical
    }
  }, [patientId])

  useEffect(() => {
    // Guard against invalid patientId
    if (!patientId || isNaN(patientId)) {
      console.log('⚠️ Invalid patientId, skipping effect:', { patientId, isNaN: isNaN(patientId) })
      return
    }

    console.log('🔄 useEffect triggered with patientId:', patientId)

    // Get tab from URL query parameter, default to 'consultations' if provided, else 'overview'
    const tabParam = new URLSearchParams(window.location.search).get('tab')
    if (tabParam) {
      setActiveTab(tabParam)
    }

    fetchPatient()
    fetchStatistics().catch((error) => {
      console.error('⚠️ Statistics fetch failed:', error)
    })
    fetchPatientImages()
  }, [patientId, fetchPatient, fetchStatistics])

  const fetchPatientImages = useCallback(async () => {
    try {
      const imagesData = await getPatientImages(patientId)
      setImages(imagesData.images)
    } catch (error) {
      console.error('Error fetching patient images:', error)
    }
  }, [patientId])

  const handleDelete = async () => {
    if (!patient) return
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${patient.full_name}?`)) return

    try {
      await deletePatient(patientId)
      router.push('/dashboard/patients')
    } catch (error) {
      console.error('Error deleting patient:', error)
      alert('Erreur lors de la suppression du patient')
    }
  }

  const handleRemoveImage = async (imageId: number) => {
    try {
      await deleteImage(imageId)
      setImages(prev => prev.filter(img => img.id !== imageId))
      setImageCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error deleting image:', error)
      alert('Erreur lors de la suppression de l\'image')
    }
  }

  const handleSaveAnnotation = async (imageId: number, notes: string) => {
    try {
      console.log('[handleSaveAnnotation] Saving annotations for image:', imageId)
      const updatedImage = await updateImage(imageId, { notes })
      console.log('[handleSaveAnnotation] Annotations saved successfully')

      // Update the image in the list
      setImages(prev =>
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

  const handleDeletePrescription = async (prescriptionId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette ordonnance ?')) return

    try {
      await deletePrescription(prescriptionId)
      setPrescriptions(prev => prev.filter(p => p.id !== prescriptionId))
      setPrescriptionCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error deleting prescription:', error)
      alert('Erreur lors de la suppression de l\'ordonnance')
    }
  }

  const getConsultationNumber = async (consultationId: number): Promise<number | undefined> => {
    // Check if we already have it cached
    if (consultationNumbers[consultationId] !== undefined) {
      return consultationNumbers[consultationId]
    }

    try {
      const consultation = await getConsultation(consultationId)
      const num = consultation.consultation_number
      setConsultationNumbers(prev => ({ ...prev, [consultationId]: num }))
      return num
    } catch (error) {
      console.error('Error fetching consultation:', error)
      return undefined
    }
  }

  const handleEditPrescription = (prescription: PrescriptionResponse) => {
    setEditingPrescription(prescription)
    setPrescriptionEditModalOpen(true)
  }

  const handleSavePrescription = (updatedPrescription: PrescriptionResponse) => {
    setPrescriptions(prev =>
      prev.map(p => (p.id === updatedPrescription.id ? updatedPrescription : p))
    )
    setPrescriptionEditModalOpen(false)
    setEditingPrescription(null)
  }

  const handlePrintPrescription = async (prescription: PrescriptionResponse) => {
    try {
      // Mark as printed
      await markPrescriptionPrinted(prescription.id)
      // Navigate to print page (within the same dashboard layout group)
      router.push(`/print-prescription/${prescription.id}`)
    } catch (error) {
      console.error('Error marking prescription as printed:', error)
      alert('Erreur lors du marquage de l\'ordonnance')
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

  const getGenderLabel = (gender: string) => {
    const labels = {
      male: 'Homme',
      female: 'Femme',
      other: 'Autre',
    }
    return labels[gender as keyof typeof labels] || gender
  }

  const getIdentificationTypeLabel = (type: string) => {
    const labels = {
      cin: 'CIN',
      passport: 'Passeport',
    }
    return labels[type as keyof typeof labels] || type
  }

  const formatLastVisitDate = (dateString: string | null) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Aujourd\'hui'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier'
    } else {
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
    let files: FileList | null = null

    if ('dataTransfer' in e) {
      // Drag and drop event
      e.preventDefault()
      e.stopPropagation()
      files = (e as React.DragEvent<HTMLDivElement>).dataTransfer.files
      setIsDragging(false)
    } else if ('target' in e) {
      // File input event
      files = (e.target as HTMLInputElement).files
    }

    if (!files || files.length === 0) return

    setUploadingImage(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        console.log(`[handleImageUpload] Processing file: ${file.name}, Size: ${file.size}, Type: ${file.type}`)
        const validation = validateImageFile(file)
        if (!validation.valid) {
          console.error(`File validation failed: ${validation.error}`)
          alert(`Erreur: ${validation.error}. Veuillez vérifier que le fichier n'est pas vide ou corrompu.`)
          continue
        }
        try {
          const uploadedImage = await uploadImage(patientId, file)
          setImages(prev => [...prev, uploadedImage])
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error)
        }
      }
    } finally {
      setUploadingImage(false)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
      </div>
    )
  }

  if (!patient) {
    return null
  }

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: User },
    { id: 'consultations', label: 'Consultations', icon: FileText },
    { id: 'appointments', label: 'Rendez-vous', icon: Calendar },
    { id: 'prescriptions', label: 'Ordonnances', icon: Pill },
    { id: 'images', label: 'Images', icon: ImageIcon },
    { id: 'history', label: 'Historique', icon: Activity },
  ]

  return (
    <div className="flex flex-col min-h-screen">
      {/* Sticky Navigation Bar */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              title="Retour"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">{patient.full_name}</h1>
              <p className="text-xs text-gray-500">{patient.age} ans • {getGenderLabel(patient.gender)}</p>
            </div>
          </div>

          {/* Quick Stats in Header */}
          <div className="hidden lg:flex items-center gap-6 ml-auto pl-6 border-l border-gray-200">
            <div className="text-center">
              <p className="text-lg font-bold text-blue-600">{consultationCount}</p>
              <p className="text-xs text-gray-500">Consultations</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-emerald-600">{prescriptionCount}</p>
              <p className="text-xs text-gray-500">Ordonnances</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-violet-600">{imageCount}</p>
              <p className="text-xs text-gray-500">Images</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 overflow-x-auto border-t border-gray-100 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px ${isActive
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'border-b-2 border-transparent text-gray-600 hover:text-gray-900'
                  }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-7xl px-6 py-8">
          {/* Overview Tab - 2 Column Layout */}
          {activeTab === 'overview' && (
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Contact Information - Left Column */}
              <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-blue-50/50 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-6 flex items-center gap-3 pb-4 border-b border-blue-100">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                    <Phone className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-bold text-blue-900">Coordonnées</h2>
                </div>

                <div className="space-y-3">
                  {patient.identification_number && (
                    <div className="flex items-start gap-3">
                      <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Identification</p>
                        <p className="text-sm text-gray-900">
                          {getIdentificationTypeLabel(patient.identification_type)} • {patient.identification_number}
                        </p>
                      </div>
                    </div>
                  )}

                  {patient.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Téléphone</p>
                        <p className="text-sm text-gray-900">{patient.phone}</p>
                      </div>
                    </div>
                  )}

                  {patient.email && (
                    <div className="flex items-start gap-3">
                      <Mail className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <p className="text-sm text-gray-900">{patient.email}</p>
                      </div>
                    </div>
                  )}

                  {(patient.address || patient.city || patient.postal_code) && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">Adresse</p>
                        <p className="text-sm text-gray-900">
                          {patient.address && <>{patient.address}<br /></>}
                          {patient.postal_code} {patient.city}
                          {patient.country && `, ${patient.country}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {patient.insurance_number && (
                    <div className="flex items-start gap-3">
                      <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500">N° Sécurité sociale</p>
                        <p className="text-sm text-gray-900">{patient.insurance_number}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Medical Information - Middle Column */}
              <div className="rounded-xl border border-red-100 bg-gradient-to-br from-red-50 to-red-50/50 p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="mb-6 flex items-center gap-3 pb-4 border-b border-red-100">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600 text-white">
                    <Heart className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg font-bold text-red-900">Informations médicales</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Date de naissance</p>
                    <p className="text-sm text-gray-900">{formatDate(patient.date_of_birth)}</p>
                  </div>

                  {patient.allergies && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Allergies</p>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{patient.allergies}</p>
                    </div>
                  )}

                  {patient.medical_history && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Antécédents médicaux</p>
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">
                        {patient.medical_history}
                      </p>
                    </div>
                  )}

                  {!patient.allergies && !patient.medical_history && (
                    <p className="text-sm text-gray-500">
                      Aucune information médicale renseignée
                    </p>
                  )}
                </div>
              </div>

              {/* Quick Stats Card - Right Column */}
              <div className="rounded-xl border border-gradient-to-r from-blue-100 to-purple-100 bg-gradient-to-br from-white to-gray-50 p-6 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 mb-6">Résumé</h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
                    <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">CONSULTATIONS</p>
                      <p className="text-2xl font-bold text-blue-600 mt-1">{consultationCount}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
                    <Pill className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">ORDONNANCES</p>
                      <p className="text-2xl font-bold text-emerald-600 mt-1">{prescriptionCount}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 pb-4 border-b border-gray-100">
                    <ImageIcon className="h-5 w-5 text-violet-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">IMAGES</p>
                      <p className="text-2xl font-bold text-violet-600 mt-1">{imageCount}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Activity className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500 font-medium">DERNIÈRE VISITE</p>
                      <p className="text-sm font-bold text-rose-600 mt-1">{formatLastVisitDate(lastConsultationDate)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Consultations Tab - Full Width */}
          {activeTab === 'consultations' && (
            <ConsultationHistory patientId={patientId} />
          )}

          {/* Prescriptions Tab */}
          {activeTab === 'prescriptions' && (
            <div className="space-y-3">
              {prescriptions.length > 0 ? (
                <div className="space-y-3">
                  {prescriptions.map((prescription) => (
                    <PrescriptionCard
                      key={prescription.id}
                      id={prescription.id}
                      prescription_date={prescription.prescription_date}
                      patient_name={patient?.full_name}
                      medications={prescription.medications}
                      instructions={prescription.instructions}
                      notes={prescription.notes}
                      consultation_id={prescription.consultation_id}
                      onEdit={() => handleEditPrescription(prescription)}
                      onPrint={() => handlePrintPrescription(prescription)}
                      onDelete={() => handleDeletePrescription(prescription.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Pill className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-sm text-gray-500 font-medium">Aucune ordonnance</p>
                  <p className="text-xs text-gray-400 mt-1">Les ordonnances apparaîtront ici</p>
                </div>
              )}
            </div>
          )}

          {/* Images Tab */}
          {activeTab === 'images' && (
            <div className="space-y-4">
              {/* Upload Area - Enhanced */}
              <div
                className={`rounded-xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-200 group ${isDragging
                  ? 'border-purple-500 bg-purple-100/50 from-purple-100 to-purple-100/70'
                  : 'border-purple-300 bg-gradient-to-br from-purple-50 to-purple-100/30 hover:border-purple-500 hover:from-purple-100 hover:to-purple-100/50'
                  }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragEnter={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleImageUpload}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="p-3 bg-purple-600/10 rounded-lg group-hover:bg-purple-600/20 transition-colors">
                    <Upload className="h-8 w-8 text-purple-600 group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <span className="text-base font-bold text-purple-900 block">
                      Glissez-déposez des images ici
                    </span>
                    <span className="text-sm text-purple-700 block mt-1">ou cliquez pour parcourir</span>
                  </div>
                  <span className="text-xs text-purple-600 font-medium">PNG, JPG, GIF jusqu'à 10MB</span>
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

              {/* Images Gallery - Enhanced */}
              {images.length > 0 && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {images.map((image) => {
                    const uploadDate = new Date(image.uploaded_at)
                    const formattedDate = uploadDate.toLocaleDateString('fr-FR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })

                    return (
                      <div key={image.id} className="relative group">
                        <div className="relative aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 shadow-md hover:shadow-lg transition-shadow border border-gray-100">
                          <img
                            src={`data:${image.mime_type};base64,${image.image_data}`}
                            alt={`Patient image ${image.filename}`}
                            className="w-full h-full object-cover"
                          />

                          {/* Overlay on hover */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                            <button
                              onClick={() => {
                                setSelectedImageForAnnotation(image)
                                setAnnotationModalOpen(true)
                              }}
                              className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 text-white text-xs font-bold rounded-lg hover:bg-violet-700 shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                              title="Modifier les annotations"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                              Notes
                            </button>
                            <button
                              onClick={() => handleRemoveImage(image.id)}
                              className="flex items-center justify-center h-9 w-9 rounded-full bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg transition-all transform hover:scale-105"
                              title="Supprimer l'image"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {/* Info Badge - Enhanced */}
                        <div className="mt-3 space-y-2">
                          <p className="text-xs font-medium text-gray-600">{formattedDate}</p>
                          {image.notes && (
                            <div className="text-xs bg-gradient-to-r from-violet-50 to-purple-50 text-violet-700 p-2 rounded-lg border border-violet-100 line-clamp-2 font-medium">
                              {image.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {images.length === 0 && (
                <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 py-12 text-center">
                  <ImageIcon className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-3 text-sm font-medium text-gray-600">Aucune image téléchargée</p>
                  <p className="mt-1 text-xs text-gray-500">Téléchargez vos premières images</p>
                </div>
              )}
            </div>
          )}

          {/* Appointments Tab */}
          {activeTab !== 'overview' && activeTab !== 'consultations' && activeTab !== 'images' && activeTab !== 'prescriptions' && (
            <div className="rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50 to-blue-50/50 p-12 shadow-sm text-center">
              <div className="mx-auto max-w-md">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-blue-900">
                  {tabs.find((t) => t.id === activeTab)?.label}
                </h3>
                <p className="mt-2 text-sm text-blue-700">
                  Cette fonctionnalité sera bientôt disponible
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

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

      {/* Prescription Edit Modal */}
      <PrescriptionEditModal
        isOpen={prescriptionEditModalOpen}
        prescription={editingPrescription}
        onClose={() => {
          setPrescriptionEditModalOpen(false)
          setEditingPrescription(null)
        }}
        onSave={handleSavePrescription}
      />
    </div>
  )
}
