'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  Search,
  Plus,
  Filter,
  X,
  Eye,
  Edit2,
  Trash2,
  Phone,
  Mail,
  Calendar,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { listPatients, deletePatient, getPatient, PatientResponse } from '@/lib/api/patients'
import { PatientEditModal } from '@/components/patients/PatientEditModal'

export default function PatientsPage() {
  const router = useRouter()
  const [patients, setPatients] = useState<PatientResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<PatientResponse | null>(null)

  // Advanced search filters (same as consultations)
  const [searchName, setSearchName] = useState('')
  const [searchIdentifier, setSearchIdentifier] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Fetch patients without filters
  const fetchPatients = async () => {
    try {
      setLoading(true)
      const data = await listPatients({
        page,
        page_size: pageSize,
      })
      setPatients(data.patients)
      setTotalPages(data.total_pages)
      setTotal(data.total)
    } catch (error) {
      console.error('Error fetching patients:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch patients with filters
  const fetchPatientsWithFilters = async () => {
    try {
      setLoading(true)
      const data = await listPatients({
        search: searchIdentifier || searchName || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        page,
        page_size: pageSize,
      })
      setPatients(data.patients)
      setTotalPages(data.total_pages)
      setTotal(data.total)
    } catch (error) {
      console.error('Error fetching patients:', error)
    } finally {
      setLoading(false)
    }
  }

  // Handle search with filters
  const handleSearch = () => {
    setPage(1)
    fetchPatientsWithFilters()
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchName('')
    setSearchIdentifier('')
    setStartDate('')
    setEndDate('')
    setPage(1)
    fetchPatients()
  }

  useEffect(() => {
    fetchPatients()
  }, [page])

  // Handle delete
  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ${name}?`)) return

    try {
      await deletePatient(id)
      fetchPatients()
    } catch (error) {
      console.error('Error deleting patient:', error)
      alert('Erreur lors de la suppression du patient')
    }
  }

  // Handle edit
  const handleEditClick = async (patient: PatientResponse) => {
    try {
      const fullPatient = await getPatient(patient.id)
      setSelectedPatient(fullPatient)
      setShowEditModal(true)
    } catch (error) {
      console.error('Error loading patient:', error)
      alert('Erreur lors du chargement du patient')
    }
  }

  // Handle save
  const handleSavePatient = (updatedPatient: PatientResponse) => {
    setPatients(patients.map((p) => (p.id === updatedPatient.id ? updatedPatient : p)))
  }

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR')
  }

  // Get gender label
  const getGenderLabel = (gender: string) => {
    const labels = {
      male: 'Homme',
      female: 'Femme',
      other: 'Autre',
    }
    return labels[gender as keyof typeof labels] || gender
  }

  // Get identification type label
  const getIdentificationTypeLabel = (type: string) => {
    const labels = {
      cin: 'CIN',
      passport: 'Passeport',
    }
    return labels[type as keyof typeof labels] || type
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8 flex justify-between items-end gap-6">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">
            Patients
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Gestion de vos patients ({total} au total)
          </p>
        </div>
        <button
          onClick={() => router.push('/dashboard/patients/new')}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-500 px-6 py-3 text-sm font-medium text-white hover:from-violet-700 hover:to-purple-600 transition-all shadow-md hover:shadow-lg whitespace-nowrap mt-4"
        >
          <Plus className="h-4 w-4" />
          Nouveau patient
        </button>
      </div>

      {/* Search and Filter Section */}
      <div className="mb-6 rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recherche avancée</h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Filter className="h-4 w-4" />
            {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
          </button>
        </div>

        {/* Quick search bar */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom de patient..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
          <button
            onClick={handleSearch}
            className="rounded-lg bg-gradient-to-r from-violet-600 to-purple-500 px-6 py-2 text-sm font-medium text-white hover:from-violet-700 hover:to-purple-600 transition-all shadow-md hover:shadow-lg"
          >
            Rechercher
          </button>
          {(searchName || searchIdentifier || startDate || endDate) && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <X className="h-4 w-4" />
              Effacer
            </button>
          )}
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 gap-4 pt-4 border-t border-gray-200 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Identifiant patient
              </label>
              <input
                type="text"
                placeholder="CIN ou Passeport"
                value={searchIdentifier}
                onChange={(e) => setSearchIdentifier(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de début
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date de fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
          </div>
        )}
      </div>

      {/* Results summary */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {total} patient{total > 1 ? 's' : ''} trouvé{total > 1 ? 's' : ''}
        </p>
      </div>

      {/* Patients List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-r-transparent"></div>
        </div>
      ) : patients.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <Users className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-4 text-sm text-gray-500">
            Aucun patient trouvé
          </p>
          {(searchName || searchIdentifier || startDate || endDate) && (
            <button
              onClick={clearFilters}
              className="mt-4 text-sm text-violet-600 hover:text-violet-700"
            >
              Effacer les filtres
            </button>
          )}
          {!searchName && !searchIdentifier && !startDate && !endDate && (
            <button
              onClick={() => router.push('/dashboard/patients/new')}
              className="mt-4 text-sm text-violet-600 hover:text-violet-700"
            >
              Ajouter votre premier patient
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Column Headers - Desktop Only */}
          <div className="hidden md:grid grid-cols-5 gap-4 px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-700 rounded-lg border border-blue-600">
            <div className="text-left text-xs font-bold text-white uppercase tracking-wider">Patient</div>
            <div className="text-left text-xs font-bold text-white uppercase tracking-wider">Contact</div>
            <div className="text-center text-xs font-bold text-white uppercase tracking-wider">Âge / Sexe</div>
            <div className="text-left text-xs font-bold text-white uppercase tracking-wider">Inscription</div>
            <div className="text-right text-xs font-bold text-white uppercase tracking-wider">Actions</div>
          </div>

          {/* Patient Cards with Spacing */}
          {patients.map((patient) => (
            <div
              key={patient.id}
              onClick={() => router.push(`/dashboard/patients/${patient.id}?tab=consultations`)}
              className="cursor-pointer bg-white rounded-lg border border-gray-200 hover:border-violet-300 hover:shadow-lg transition-all duration-200 p-3 group"
            >
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
                {/* Patient Column */}
                <div>
                  <p className="md:hidden text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Patient</p>
                  <div>
                    <div className="text-sm font-medium text-gray-900 group-hover:text-violet-600 transition-colors">
                      {patient.full_name}
                    </div>
                    {patient.identification_number && (
                      <div className="text-xs text-gray-500 mt-1">
                        {getIdentificationTypeLabel(patient.identification_type)}: {patient.identification_number}
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Column */}
                <div>
                  <p className="md:hidden text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Contact</p>
                  <div className="space-y-1">
                    {patient.phone && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Phone className="h-3 w-3 flex-shrink-0" />
                        {patient.phone}
                      </div>
                    )}
                    {patient.email && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Mail className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{patient.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Age / Gender Column */}
                <div>
                  <p className="md:hidden text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Âge / Sexe</p>
                  <div className="text-sm text-gray-900 text-center md:text-left">
                    {patient.age} ans / {getGenderLabel(patient.gender)}
                  </div>
                </div>

                {/* Registration Date Column */}
                <div>
                  <p className="md:hidden text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Inscription</p>
                  <div className="flex items-center gap-1 text-sm text-gray-600 md:justify-start justify-center">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    {formatDate(patient.created_at)}
                  </div>
                </div>

                {/* Actions Column */}
                <div className="flex items-center justify-center md:justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => router.push(`/dashboard/patients/${patient.id}?tab=consultations`)}
                    className="p-1.5 text-gray-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all"
                    title="Voir les consultations"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEditClick(patient)}
                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                    title="Modifier"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(patient.id, patient.full_name)}
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
              <div className="text-sm text-gray-500">
                Page {page} sur {totalPages} ({total} patients au total)
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Précédent
                </button>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === totalPages}
                  className="flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Suivant
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Patient Edit Modal */}
      <PatientEditModal
        isOpen={showEditModal}
        patient={selectedPatient}
        onClose={() => {
          setShowEditModal(false)
          setSelectedPatient(null)
        }}
        onSave={handleSavePatient}
      />
    </div>
  )
}
