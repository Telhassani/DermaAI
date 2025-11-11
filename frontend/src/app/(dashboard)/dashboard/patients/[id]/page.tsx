'use client'

import { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { getPatient, deletePatient, PatientResponse } from '@/lib/api/patients'
import ConsultationHistory from '@/components/consultations/ConsultationHistory'

export default function PatientDetailPage() {
  const router = useRouter()
  const params = useParams()
  const patientId = parseInt(params.id as string)

  const [patient, setPatient] = useState<PatientResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchPatient()
  }, [patientId])

  const fetchPatient = async () => {
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
  }

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{patient.full_name}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {patient.age} ans • {getGenderLabel(patient.gender)} • Patient depuis le{' '}
              {formatDate(patient.created_at)}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/dashboard/patients/${patientId}/edit`)}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Edit2 className="h-4 w-4" />
            Modifier
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 pb-4 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Contact Information */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Phone className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Coordonnées</h2>
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

          {/* Medical Information */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Informations médicales</h2>
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

          {/* Quick Stats */}
          <div className="md:col-span-2 grid gap-6 md:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                  <p className="text-xs text-gray-500">Rendez-vous</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <Pill className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                  <p className="text-xs text-gray-500">Ordonnances</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <ImageIcon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                  <p className="text-xs text-gray-500">Images</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                  <Activity className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">-</p>
                  <p className="text-xs text-gray-500">Dernière visite</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'consultations' && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <ConsultationHistory patientId={patientId} />
        </div>
      )}

      {activeTab !== 'overview' && activeTab !== 'consultations' && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 shadow-sm text-center">
          <div className="mx-auto max-w-md">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {tabs.find((t) => t.id === activeTab)?.label}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Cette fonctionnalité sera bientôt disponible
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
