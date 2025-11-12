'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Pill,
  Search,
  Plus,
  Download,
  Filter,
  X,
  User as UserIcon,
  Calendar,
  Edit2,
  Printer,
  Trash2,
} from 'lucide-react'
import { listPrescriptions, deletePrescription, markPrescriptionPrinted } from '@/lib/api/prescriptions'
import { useAuthStore } from '@/lib/stores/auth-store'

interface Prescription {
  id: number
  consultation_id: number
  patient_id: number
  doctor_id: number
  prescription_date: string
  valid_until: string
  medications: any[]
  instructions: string
  notes: string
  is_printed: boolean
  is_delivered: boolean
  created_at: string
  updated_at: string
  patient_name?: string
}

interface PrescriptionListResponse {
  prescriptions: Prescription[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export default function PrescriptionsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null)

  // Search filters
  const [searchPatient, setSearchPatient] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchPrescriptions()
  }, [currentPage])

  const fetchPrescriptions = async () => {
    try {
      setLoading(true)
      const data = await listPrescriptions({
        page: currentPage,
        page_size: 20,
      })
      setPrescriptions(data.prescriptions)
      setTotal(data.total)
      setTotalPages(data.total_pages)
    } catch (error) {
      console.error('Error fetching prescriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    // Apply client-side filtering based on patient name and dates
    // This filters the fetched data
  }

  const clearFilters = () => {
    setSearchPatient('')
    setStartDate('')
    setEndDate('')
    setCurrentPage(1)
    fetchPrescriptions()
  }

  const handleEditPrescription = (prescription: Prescription) => {
    router.push(`/dashboard/prescriptions/${prescription.id}`)
  }

  const handlePrintPrescription = async (prescription: Prescription) => {
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

  const handleDeletePrescription = async (prescriptionId: number) => {
    try {
      setDeleting(prescriptionId)
      await deletePrescription(prescriptionId)
      // Refresh prescriptions
      setPrescriptions(prev => prev.filter(p => p.id !== prescriptionId))
      setShowDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting prescription:', error)
      alert('Erreur lors de la suppression de l\'ordonnance')
    } finally {
      setDeleting(null)
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

  const formatDateForInput = (date: string) => {
    if (!date) return ''
    return new Date(date).toISOString().split('T')[0]
  }

  // Filter prescriptions based on search criteria
  const filteredPrescriptions = prescriptions.filter((prescription) => {
    const matchesName = !searchPatient ||
      (prescription.patient_name?.toLowerCase() || '').includes(searchPatient.toLowerCase())

    const prescriptionDate = new Date(prescription.prescription_date)
    const matchesStartDate = !startDate || prescriptionDate >= new Date(startDate)
    const matchesEndDate = !endDate || prescriptionDate <= new Date(endDate)

    return matchesName && matchesStartDate && matchesEndDate
  })

  const hasActiveFilters = searchPatient || startDate || endDate

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ordonnances</h1>
              <p className="mt-1 text-sm text-gray-500">
                Gérer et rechercher toutes les ordonnances
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard/consultations/new')}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Nouvelle ordonnance
            </button>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recherche</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
            </button>
          </div>

          {/* Quick search bar */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom de patient..."
                value={searchPatient}
                onChange={(e) => setSearchPatient(e.target.value)}
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <X className="h-4 w-4" />
                Effacer
              </button>
            )}
          </div>

          {/* Date range filters */}
          {showFilters && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de début
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de fin
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>
          )}
        </div>

        {/* Results summary */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {filteredPrescriptions.length} ordonnance{filteredPrescriptions.length > 1 ? 's' : ''} trouvée{filteredPrescriptions.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Prescriptions list */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
          </div>
        ) : filteredPrescriptions.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <Pill className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-sm text-gray-500">
              Aucune ordonnance trouvée
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 text-sm text-blue-600 hover:text-blue-700"
              >
                Effacer les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPrescriptions.map((prescription) => {
              const isDoctorOwner = user?.id === prescription.doctor_id
              const canEdit = user?.role === 'doctor' && isDoctorOwner

              return (
                <div key={prescription.id} className="rounded-xl border border-gray-200 bg-white p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {prescription.prescription_date && formatDate(prescription.prescription_date)}
                      </p>
                      <p className="text-xs text-gray-500">Ordonnance #{prescription.id}</p>
                    </div>
                    <div className="flex gap-2 items-center">
                      <div className="flex gap-1">
                        {prescription.is_delivered && (
                          <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                            Remise
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Medications List */}
                  <div className="mb-3">
                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Médicaments</h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      {prescription.medications.map((med: any, idx: number) => (
                        <li key={idx}>
                          {med.name} - {med.dosage} ({med.frequency}, {med.duration})
                        </li>
                      ))}
                    </ul>
                  </div>

                  {prescription.instructions && (
                    <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded mb-2">
                      <p className="text-xs font-medium text-gray-500 mb-1">Instructions:</p>
                      <p>{prescription.instructions}</p>
                    </div>
                  )}

                  {/* Action buttons - Below prescription content */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => handleEditPrescription(prescription)}
                      className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Éditer l'ordonnance"
                    >
                      <Edit2 className="h-4 w-4" />
                      Éditer
                    </button>
                    <button
                      onClick={() => handlePrintPrescription(prescription)}
                      className="flex items-center gap-2 px-3 py-1 text-sm text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="Imprimer l'ordonnance"
                    >
                      <Printer className="h-4 w-4" />
                      Imprimer
                    </button>
                    {canEdit && (
                      <button
                        onClick={() => setShowDeleteConfirm(prescription.id)}
                        className="flex items-center gap-2 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Supprimer l'ordonnance"
                      >
                        <Trash2 className="h-4 w-4" />
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-4">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Précédent
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Suivant
                  </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Page <span className="font-medium">{currentPage}</span> sur{' '}
                      <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50"
                      >
                        Précédent
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                              currentPage === page
                                ? 'z-10 bg-blue-600 text-white focus:z-20'
                                : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20'
                            }`}
                          >
                            {page}
                          </button>
                        )
                      })}
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 disabled:opacity-50"
                      >
                        Suivant
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      {/* Delete confirmation modal */}
      {showDeleteConfirm !== null && (
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
                onClick={() => setShowDeleteConfirm(null)}
                disabled={deleting === showDeleteConfirm}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={() => handleDeletePrescription(showDeleteConfirm)}
                disabled={deleting === showDeleteConfirm}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting === showDeleteConfirm ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
