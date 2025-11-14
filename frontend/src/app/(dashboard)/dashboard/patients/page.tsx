/**
 * Patients List Page
 * Modern card-based patient list with search and filters
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Users, ChevronLeft, ChevronRight } from 'lucide-react'
import { listPatients, deletePatient, PatientResponse } from '@/lib/api/patients'
import { cn } from '@/lib/theme'
import { Button } from '@/components/ui/modern'
import {
  PatientCard,
  SearchBar,
  FilterChips,
  EmptyState,
  PatientCardSkeleton,
  type FilterType,
} from '@/components/patients'

export default function PatientsPage() {
  const router = useRouter()
  const [patients, setPatients] = useState<PatientResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterType>('all')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 12 // Grid layout works better with 12 (3x4 or 4x3)

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

  // Filter patients by status
  const filteredPatients = patients.filter((patient) => {
    switch (activeFilter) {
      case 'active':
        return patient.is_active
      case 'inactive':
        return !patient.is_active
      case 'recent':
        // Recent = created in last 30 days
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        return new Date(patient.created_at) > thirtyDaysAgo
      default:
        return true
    }
  })

  // Calculate filter counts
  const filterCounts = {
    all: total,
    active: patients.filter((p) => p.is_active).length,
    inactive: patients.filter((p) => !p.is_active).length,
    recent: patients.filter((p) => {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      return new Date(p.created_at) > thirtyDaysAgo
    }).length,
  }

  // Handle search
  const handleSearch = (value: string) => {
    setSearch(value)
    setPage(1) // Reset to first page
  }

  // Handle filter change
  const handleFilterChange = (filter: FilterType) => {
    setActiveFilter(filter)
    setPage(1) // Reset to first page
  }

  // Handle clear filters
  const handleClearFilters = () => {
    setActiveFilter('all')
    setSearch('')
    setPage(1)
  }

  // Determine empty state type
  const getEmptyStateType = () => {
    if (search) return 'no-results'
    if (activeFilter !== 'all') return 'no-filter-results'
    return 'no-patients'
  }

  return (
    <div className="space-y-8">
      {/* Header with gradient background */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={cn(
          'relative overflow-hidden rounded-3xl',
          'bg-gradient-to-br from-mono-900 via-mono-800 to-mono-900',
          'px-8 py-12'
        )}
      >
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent-500/20 blur-3xl animate-blob" />
          <div className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-accent-500/10 blur-3xl animate-blob animation-delay-2000" />
        </div>

        {/* Content */}
        <div className="relative flex items-end justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-500 to-accent-600 shadow-glow">
                <Users className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">Patients</h1>
                <p className="mt-1 text-mono-300">
                  Gestion de vos patients ({total} au total)
                </p>
              </div>
            </div>
          </div>

          {/* Add Patient Button */}
          <Button
            variant="glass"
            size="lg"
            leftIcon={<Plus className="h-5 w-5" />}
            onClick={() => router.push('/dashboard/patients/new')}
            className="backdrop-blur-md"
          >
            Nouveau patient
          </Button>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="space-y-4"
      >
        {/* Search Bar */}
        <SearchBar
          value={search}
          onChange={handleSearch}
          placeholder="Rechercher par nom, email, téléphone..."
          showAdvancedFilters={false}
        />

        {/* Filter Chips */}
        <FilterChips
          activeFilter={activeFilter}
          onFilterChange={handleFilterChange}
          counts={filterCounts}
        />
      </motion.div>

      {/* Patients Grid */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            <PatientCardSkeleton count={pageSize} />
          </motion.div>
        ) : filteredPatients.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <EmptyState
              type={getEmptyStateType()}
              searchQuery={search}
              onAddPatient={() => router.push('/dashboard/patients/new')}
              onClearFilters={handleClearFilters}
            />
          </motion.div>
        ) : (
          <motion.div
            key="patients"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {filteredPatients.map((patient, index) => (
              <motion.div
                key={patient.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, duration: 0.3 }}
              >
                <PatientCard
                  patient={{
                    id: patient.id,
                    first_name: patient.first_name,
                    last_name: patient.last_name,
                    email: patient.email,
                    phone: patient.phone,
                    date_of_birth: patient.date_of_birth,
                    address: patient.address,
                    is_active: patient.is_active,
                    consultations_count: patient.consultations_count,
                    appointments_count: patient.appointments_count,
                    prescriptions_count: patient.prescriptions_count,
                  }}
                  onClick={() => router.push(`/dashboard/patients/${patient.id}`)}
                  onEdit={() => router.push(`/dashboard/patients/${patient.id}/edit`)}
                  onDelete={() => handleDelete(patient.id, patient.full_name)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className={cn(
            'flex items-center justify-between',
            'rounded-2xl border border-mono-200 bg-white px-6 py-4',
            'shadow-soft'
          )}
        >
          {/* Page Info */}
          <div className="text-sm text-mono-600">
            Page <span className="font-semibold text-mono-900">{page}</span> sur{' '}
            <span className="font-semibold text-mono-900">{totalPages}</span>
            <span className="ml-2 text-mono-400">
              ({total} patients au total)
            </span>
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="md"
              leftIcon={<ChevronLeft className="h-4 w-4" />}
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              size="md"
              rightIcon={<ChevronRight className="h-4 w-4" />}
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Suivant
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
