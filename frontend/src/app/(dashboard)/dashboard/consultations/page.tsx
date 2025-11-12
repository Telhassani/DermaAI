'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  Search,
  Plus,
  Eye,
  Filter,
  X,
  FileText,
  User as UserIcon
} from 'lucide-react'
import { listConsultations, ConsultationResponse } from '@/lib/api/consultations'

export default function ConsultationsPage() {
  const router = useRouter()
  const [consultations, setConsultations] = useState<ConsultationResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Search filters
  const [searchIdentifier, setSearchIdentifier] = useState('')
  const [searchName, setSearchName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchConsultations()
  }, [currentPage])

  const fetchConsultations = async () => {
    try {
      setLoading(true)
      const data = await listConsultations({
        page: currentPage,
        page_size: 20
      })
      setConsultations(data.consultations)
      setTotal(data.total)
      setTotalPages(data.total_pages)
    } catch (error) {
      console.error('Error fetching consultations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    // Reset to page 1 when searching
    setCurrentPage(1)
    fetchConsultations()
  }

  const clearFilters = () => {
    setSearchIdentifier('')
    setSearchName('')
    setStartDate('')
    setEndDate('')
    setCurrentPage(1)
    fetchConsultations()
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

  const hasActiveFilters = searchIdentifier || searchName || startDate || endDate

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex justify-between items-end gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-700 bg-clip-text text-transparent">
              Consultations
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Gérer et rechercher toutes les consultations
            </p>
          </div>
          <button
            onClick={() => router.push('/dashboard/consultations/new')}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-500 px-6 py-3 text-sm font-medium text-white hover:from-violet-700 hover:to-purple-600 transition-all shadow-md hover:shadow-lg whitespace-nowrap mt-4"
          >
            <Plus className="h-4 w-4" />
            Nouvelle consultation
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
            {total} consultation{total > 1 ? 's' : ''} trouvée{total > 1 ? 's' : ''}
          </p>
        </div>

        {/* Consultations list */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-600 border-r-transparent"></div>
          </div>
        ) : consultations.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <FileText className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-sm text-gray-500">
              Aucune consultation trouvée
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
              <div className="text-left text-xs font-bold text-white uppercase tracking-wider">Motif</div>
              <div className="text-left text-xs font-bold text-white uppercase tracking-wider">Diagnostic</div>
              <div className="text-right text-xs font-bold text-white uppercase tracking-wider">Actions</div>
            </div>

            {/* Consultation Cards with Spacing */}
            {consultations.map((consultation) => (
              <div
                key={consultation.id}
                onClick={() => router.push(`/dashboard/consultations/${consultation.id}`)}
                className="cursor-pointer bg-white rounded-lg border border-gray-200 hover:border-violet-300 hover:shadow-lg transition-all duration-200 p-3 group"
              >
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
                  {/* Date Column */}
                  <div>
                    <p className="md:hidden text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Date</p>
                    <div className="flex items-start gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-violet-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-gray-900">
                          {formatDate(consultation.consultation_date)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTime(consultation.consultation_time)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Patient Column */}
                  <div>
                    <p className="md:hidden text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Patient</p>
                    <div className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4 text-violet-500 flex-shrink-0" />
                      <div className="text-sm font-medium text-gray-900 group-hover:text-violet-600 transition-colors truncate">
                        {consultation.patient_name || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Chief Complaint Column */}
                  <div>
                    <p className="md:hidden text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Motif</p>
                    <p className="text-sm text-gray-900 line-clamp-2">
                      {consultation.chief_complaint}
                    </p>
                  </div>

                  {/* Diagnosis Column */}
                  <div>
                    <p className="md:hidden text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Diagnostic</p>
                    {consultation.diagnosis ? (
                      <span className="inline-flex items-center rounded-full bg-violet-50 px-2 py-1 text-xs font-medium text-violet-700">
                        {consultation.diagnosis}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="md:text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/dashboard/consultations/${consultation.id}`)
                      }}
                      className="inline-flex items-center gap-1 text-violet-600 hover:text-violet-900 text-sm font-medium"
                    >
                      <Eye className="h-4 w-4" />
                      Voir
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
      </div>
    </div>
  )
}
