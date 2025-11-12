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
  Eye,
  Edit2,
  Trash2,
} from 'lucide-react'
import { listPrescriptions, deletePrescription, PrescriptionResponse } from '@/lib/api/prescriptions'
import { PrescriptionQuickEditModal } from '@/components/prescriptions/PrescriptionQuickEditModal'

interface Prescription {
  id: number
  consultation_id: number
  patient_id: number
  prescription_date: string
  valid_until: string
  control_date: string
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
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Search filters
  const [searchPatient, setSearchPatient] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionResponse | null>(null)

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

  const handleEditClick = (prescription: Prescription) => {
    setSelectedPrescription(prescription as PrescriptionResponse)
    setShowEditModal(true)
  }

  const handleEditSave = (updatedPrescription: PrescriptionResponse) => {
    // Update the prescription in the list
    setPrescriptions(
      prescriptions.map((p) =>
        p.id === updatedPrescription.id ? (updatedPrescription as Prescription) : p
      )
    )
    setShowEditModal(false)
    setSelectedPrescription(null)
  }

  const handleDelete = async (prescriptionId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette ordonnance?')) return

    try {
      await deletePrescription(prescriptionId)
      setPrescriptions(prescriptions.filter((p) => p.id !== prescriptionId))
      setTotal(total - 1)
    } catch (error) {
      console.error('Error deleting prescription:', error)
      alert('Erreur lors de la suppression de l\'ordonnance')
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
        <div className="mb-8 flex justify-between items-end gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">
              Ordonnances
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Gérer et rechercher toutes les ordonnances
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard/consultations/new')}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-500 px-6 py-3 text-sm font-medium text-white hover:from-violet-700 hover:to-purple-600 transition-all shadow-md hover:shadow-lg whitespace-nowrap mt-4"
          >
            <Plus className="h-4 w-4" />
            Nouvelle ordonnance
          </button>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-6 rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50 p-6 shadow-sm">
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
                className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
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
                  className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
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
                  className="w-full rounded-lg border border-gray-300 py-2 px-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
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
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-r-transparent"></div>
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
                className="mt-4 text-sm text-violet-600 hover:text-violet-700"
              >
                Effacer les filtres
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Column Headers - Desktop Only */}
            <div className="hidden md:grid grid-cols-5 gap-4 px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-700 rounded-lg border border-blue-600">
              <div className="text-left text-xs font-bold text-white uppercase tracking-wider">Date</div>
              <div className="text-left text-xs font-bold text-white uppercase tracking-wider">Patient</div>
              <div className="text-center text-xs font-bold text-white uppercase tracking-wider">Médicaments</div>
              <div className="text-center text-xs font-bold text-white uppercase tracking-wider">Contrôle</div>
              <div className="text-right text-xs font-bold text-white uppercase tracking-wider">Actions</div>
            </div>

            {/* Prescription Cards with Spacing */}
            {filteredPrescriptions.map((prescription) => (
              <div
                key={prescription.id}
                onClick={() => router.push(`/dashboard/prescriptions/${prescription.id}`)}
                className="cursor-pointer bg-white rounded-lg border border-gray-200 hover:border-violet-300 hover:shadow-lg transition-all duration-200 p-3 group"
              >
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                  {/* Date Column */}
                  <div>
                    <p className="md:hidden text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Date</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-violet-500 flex-shrink-0" />
                      <div className="font-medium text-gray-900">
                        {formatDate(prescription.prescription_date)}
                      </div>
                    </div>
                  </div>

                  {/* Patient Column */}
                  <div>
                    <p className="md:hidden text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Patient</p>
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-violet-500 flex-shrink-0" />
                      <div className="text-sm font-medium text-gray-900 group-hover:text-violet-600 transition-colors truncate">
                        {prescription.patient_name || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Medications Column */}
                  <div>
                    <p className="md:hidden text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Médicaments</p>
                    <p className="text-sm text-gray-900 text-center md:text-center">
                      {prescription.medications?.length || 0}
                    </p>
                  </div>

                  {/* Control Date Column */}
                  <div>
                    <p className="md:hidden text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Contrôle</p>
                    <div className="text-sm text-gray-900 text-center md:text-center">
                      {prescription.control_date ? formatDate(prescription.control_date) : '-'}
                    </div>
                  </div>

                  {/* Actions Column */}
                  <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => router.push(`/dashboard/prescriptions/${prescription.id}`)}
                      className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all"
                      title="Voir les détails"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleEditClick(prescription)}
                      className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                      title="Modifier"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(prescription.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Supprimer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-gray-200 bg-white px-6 py-4 mt-6 rounded-lg">
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
                                ? 'z-10 bg-violet-600 text-white focus:z-20'
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

        {/* Quick Edit Modal */}
        <PrescriptionQuickEditModal
          isOpen={showEditModal}
          prescription={selectedPrescription}
          onClose={() => {
            setShowEditModal(false)
            setSelectedPrescription(null)
          }}
          onSave={handleEditSave}
        />
      </div>
    </div>
  )
}
