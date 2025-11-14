'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText,
  Search,
  Eye,
  Download,
  Printer,
  Filter,
  X,
  Calendar,
  User as UserIcon,
  Package,
  Clock
} from 'lucide-react'
import { api } from '@/lib/api/client'
import { Prescription, PrescriptionListResponse } from '@/types/prescription'
import { toast } from 'sonner'

export default function PrescriptionsPage() {
  const router = useRouter()
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  // Search filters
  const [searchPatientId, setSearchPatientId] = useState('')
  const [searchConsultationId, setSearchConsultationId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchPrescriptions()
  }, [currentPage])

  const fetchPrescriptions = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: currentPage,
        page_size: 20
      }

      if (searchPatientId) params.patient_id = parseInt(searchPatientId)
      if (searchConsultationId) params.consultation_id = parseInt(searchConsultationId)

      const response = await api.prescriptions.list(params)
      const data: PrescriptionListResponse = response.data

      setPrescriptions(data.prescriptions)
      setTotal(data.total)
      setTotalPages(data.total_pages)
    } catch (error) {
      console.error('Error fetching prescriptions:', error)
      toast.error('Erreur lors du chargement des prescriptions')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setCurrentPage(1)
    fetchPrescriptions()
  }

  const clearFilters = () => {
    setSearchPatientId('')
    setSearchConsultationId('')
    setStartDate('')
    setEndDate('')
    setCurrentPage(1)
    fetchPrescriptions()
  }

  const handleDownloadPdf = async (id: number) => {
    try {
      const response = await api.prescriptions.downloadPdf(id)
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `prescription-${id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('PDF téléchargé avec succès')
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error('Erreur lors du téléchargement du PDF')
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

  const isExpired = (validUntil: string | null) => {
    if (!validUntil) return false
    return new Date(validUntil) < new Date()
  }

  const hasActiveFilters = searchPatientId || searchConsultationId || startDate || endDate

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ordonnances</h1>
              <p className="mt-1 text-sm text-gray-500">
                Gérer et consulter toutes les ordonnances médicales
              </p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 rounded-lg bg-white p-4 shadow">
          <div className="flex items-center justify-between">
            <div className="flex flex-1 items-center space-x-3">
              <Search className="h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="ID Patient..."
                value={searchPatientId}
                onChange={(e) => setSearchPatientId(e.target.value)}
                className="flex-1 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="ID Consultation..."
                value={searchConsultationId}
                onChange={(e) => setSearchConsultationId(e.target.value)}
                className="flex-1 rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              <button
                onClick={handleSearch}
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Rechercher
              </button>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="ml-3 flex items-center space-x-2 rounded-md border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-50"
            >
              <Filter className="h-4 w-4" />
              <span>Filtres</span>
            </button>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 grid grid-cols-3 gap-4 border-t pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date début
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 w-full rounded-md border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Date fin
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 w-full rounded-md border-gray-300"
                />
              </div>
              <div className="flex items-end">
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center space-x-2 text-sm text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                    <span>Effacer filtres</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Results count */}
        <div className="mb-4 text-sm text-gray-600">
          {total} ordonnance{total !== 1 ? 's' : ''} trouvée{total !== 1 ? 's' : ''}
        </div>

        {/* Prescriptions List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-600">Aucune ordonnance trouvée</p>
          </div>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((prescription) => (
              <div
                key={prescription.id}
                className="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <FileText className="h-6 w-6 text-blue-600" />
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Ordonnance #{prescription.id}
                          </h3>
                          <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Calendar className="mr-1 h-4 w-4" />
                              {formatDate(prescription.prescription_date)}
                            </span>
                            <span className="flex items-center">
                              <UserIcon className="mr-1 h-4 w-4" />
                              Patient #{prescription.patient_id}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status badges */}
                      <div className="flex items-center space-x-2">
                        {prescription.valid_until && isExpired(prescription.valid_until) && (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
                            <Clock className="mr-1 h-3 w-3" />
                            Expirée
                          </span>
                        )}
                        {prescription.is_printed && (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">
                            <Printer className="mr-1 h-3 w-3" />
                            Imprimée
                          </span>
                        )}
                        {prescription.is_delivered && (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
                            <Package className="mr-1 h-3 w-3" />
                            Délivrée
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Medications */}
                    <div className="mb-4">
                      <h4 className="mb-2 text-sm font-medium text-gray-700">
                        Médicaments ({prescription.medications.length})
                      </h4>
                      <div className="space-y-2">
                        {prescription.medications.slice(0, 3).map((med, idx) => (
                          <div
                            key={idx}
                            className="flex items-start rounded-md bg-gray-50 p-3"
                          >
                            <Package className="mr-2 h-5 w-5 flex-shrink-0 text-gray-400" />
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{med.name}</div>
                              <div className="mt-1 text-sm text-gray-600">
                                {med.dosage} - {med.duration}
                              </div>
                            </div>
                          </div>
                        ))}
                        {prescription.medications.length > 3 && (
                          <div className="text-sm text-gray-500">
                            +{prescription.medications.length - 3} autre(s) médicament(s)
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Instructions */}
                    {prescription.instructions && (
                      <div className="mb-4 rounded-md bg-blue-50 p-3">
                        <p className="text-sm text-blue-900">
                          <strong>Instructions:</strong> {prescription.instructions}
                        </p>
                      </div>
                    )}

                    {/* Validity */}
                    {prescription.valid_until && (
                      <div className="text-sm text-gray-600">
                        Valide jusqu'au {formatDate(prescription.valid_until)}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="ml-6 flex flex-col space-y-2">
                    <button
                      onClick={() => router.push(`/dashboard/prescriptions/${prescription.id}`)}
                      className="flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Voir
                    </button>
                    <button
                      onClick={() => handleDownloadPdf(prescription.id)}
                      className="flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      PDF
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between rounded-lg bg-white px-4 py-3 shadow">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="rounded-md border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Précédent
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} sur {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="rounded-md border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Suivant
              </button>
            </div>
            <div className="text-sm text-gray-600">
              {(currentPage - 1) * 20 + 1}-{Math.min(currentPage * 20, total)} sur {total}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
