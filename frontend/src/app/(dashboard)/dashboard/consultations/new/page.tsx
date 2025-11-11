'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, User, ArrowLeft, Calendar } from 'lucide-react'
import { searchPatients, PatientResponse } from '@/lib/api/patients'

export default function NewConsultationPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<PatientResponse[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<PatientResponse | null>(null)

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([])
      return
    }

    try {
      setSearching(true)
      const data = await searchPatients(searchTerm)
      setSearchResults(data.patients)
    } catch (error) {
      console.error('Error searching patients:', error)
    } finally {
      setSearching(false)
    }
  }

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (searchTerm.trim()) {
        handleSearch()
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(delaySearch)
  }, [searchTerm])

  const handleSelectPatient = (patient: PatientResponse) => {
    setSelectedPatient(patient)
    // Navigate to the patient's new consultation page
    router.push(`/dashboard/patients/${patient.id}/consultation/new`)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Nouvelle consultation</h1>
          <p className="mt-1 text-sm text-gray-500">
            Recherchez un patient pour créer une nouvelle consultation
          </p>
        </div>

        {/* Search section */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Rechercher un patient
          </h2>

          {/* Search input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Nom, prénom ou identifiant (CIN/Passeport)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              autoFocus
            />
          </div>

          {/* Search results */}
          {searching ? (
            <div className="mt-4 flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-500 mb-2">
                {searchResults.length} patient{searchResults.length > 1 ? 's' : ''} trouvé{searchResults.length > 1 ? 's' : ''}
              </p>
              {searchResults.map((patient) => (
                <button
                  key={patient.id}
                  onClick={() => handleSelectPatient(patient)}
                  className="w-full rounded-lg border border-gray-200 p-4 text-left hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {patient.first_name} {patient.last_name}
                        </h3>
                        {patient.identification_type && patient.identification_number && (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                            {patient.identification_type.toUpperCase()}: {patient.identification_number}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
                        {patient.date_of_birth && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(patient.date_of_birth)}
                          </div>
                        )}
                        {patient.phone && (
                          <span>{patient.phone}</span>
                        )}
                        {patient.email && (
                          <span>{patient.email}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : searchTerm.trim() && !searching ? (
            <div className="mt-4 rounded-lg bg-gray-50 p-8 text-center">
              <User className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm text-gray-500">
                Aucun patient trouvé pour "{searchTerm}"
              </p>
              <button
                onClick={() => router.push('/dashboard/patients/new')}
                className="mt-4 text-sm text-blue-600 hover:text-blue-700"
              >
                Créer un nouveau patient
              </button>
            </div>
          ) : (
            <div className="mt-4 rounded-lg bg-gray-50 p-8 text-center">
              <Search className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm text-gray-500">
                Commencez à taper pour rechercher un patient
              </p>
            </div>
          )}
        </div>

        {/* Quick info */}
        <div className="mt-4 rounded-lg bg-blue-50 border border-blue-100 p-4">
          <p className="text-sm text-blue-800">
            <strong>Astuce:</strong> Vous pouvez rechercher par nom, prénom ou numéro d'identification (CIN/Passeport)
          </p>
        </div>
      </div>
    </div>
  )
}
