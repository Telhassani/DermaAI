'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Users,
  Search,
  Plus,
  Filter,
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
import { listPatients, deletePatient, PatientResponse } from '@/lib/api/patients'

export default function PatientsPage() {
  const router = useRouter()
  const [patients, setPatients] = useState<PatientResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  // Fetch patients
  const fetchPatients = async () => {
    try {
      setLoading(true)
      const data = await listPatients({
        search: search || undefined,
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

  useEffect(() => {
    fetchPatients()
  }, [page, search])

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
      <div className="mb-8 flex items-start justify-between gap-6">
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
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-500 px-6 py-3 text-sm font-medium text-white hover:from-violet-700 hover:to-purple-600 transition-all shadow-md hover:shadow-lg whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          Nouveau patient
        </button>
      </div>

      {/* Search and filters */}
      <div className="flex gap-4 rounded-xl border border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50 p-6 mb-6 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1) // Reset to first page on search
            }}
            placeholder="Rechercher un patient (nom, email, téléphone...)"
            className="w-full rounded-lg border border-gray-200 py-2 pl-10 pr-4 text-sm focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
        <button className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          <Filter className="h-4 w-4" />
          Filtres
        </button>
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
            {search ? 'Aucun patient trouvé' : 'Aucun patient enregistré'}
          </p>
          {!search && (
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
          <div className="hidden md:grid grid-cols-5 gap-4 px-5 py-3 bg-gradient-to-r from-violet-200 to-purple-200 rounded-lg border border-violet-300">
            <div className="text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Patient</div>
            <div className="text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Contact</div>
            <div className="text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Âge / Sexe</div>
            <div className="text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Inscription</div>
            <div className="text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Actions</div>
          </div>

          {/* Patient Cards with Spacing */}
          {patients.map((patient) => (
            <div
              key={patient.id}
              onClick={() => router.push(`/dashboard/patients/${patient.id}?tab=consultations`)}
              className="cursor-pointer bg-white rounded-lg border border-gray-200 hover:border-violet-300 hover:shadow-lg transition-all duration-200 p-5 group"
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
                    onClick={() => router.push(`/dashboard/patients/${patient.id}/edit`)}
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
    </div>
  )
}
