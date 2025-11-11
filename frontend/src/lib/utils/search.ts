import { listPatients, PatientResponse } from '@/lib/api/patients'

export type SearchCategory = 'patients' | 'consultations' | 'appointments'

export interface SearchResult {
  id: string
  category: SearchCategory
  title: string
  subtitle?: string
  url: string
  metadata?: string[]
  score?: number
}

// Simple fuzzy search implementation
function fuzzyMatch(text: string, query: string): boolean {
  const normalizedText = text.toLowerCase().trim()
  const normalizedQuery = query.toLowerCase().trim()

  // Exact match
  if (normalizedText.includes(normalizedQuery)) {
    return true
  }

  // Fuzzy match - check if all characters of query exist in text in order
  let queryIndex = 0
  for (let i = 0; i < normalizedText.length && queryIndex < normalizedQuery.length; i++) {
    if (normalizedText[i] === normalizedQuery[queryIndex]) {
      queryIndex++
    }
  }

  return queryIndex === normalizedQuery.length
}

// Calculate relevance score
function calculateScore(text: string, query: string): number {
  const normalizedText = text.toLowerCase()
  const normalizedQuery = query.toLowerCase()

  // Exact match gets highest score
  if (normalizedText === normalizedQuery) return 100

  // Starts with query gets high score
  if (normalizedText.startsWith(normalizedQuery)) return 90

  // Contains query gets medium score
  if (normalizedText.includes(normalizedQuery)) return 70

  // Fuzzy match gets lower score
  if (fuzzyMatch(text, query)) return 50

  return 0
}

// Search patients
async function searchPatients(query: string): Promise<SearchResult[]> {
  try {
    const { patients } = await listPatients({ search: query, page: 1, page_size: 10 })

    return patients.map((patient: PatientResponse) => {
      const fullName = patient.full_name
      const score = calculateScore(fullName, query)

      return {
        id: `patient-${patient.id}`,
        category: 'patients' as SearchCategory,
        title: fullName,
        subtitle: patient.email || patient.phone || undefined,
        url: `/dashboard/patients/${patient.id}`,
        metadata: [
          patient.age ? `${patient.age} ans` : '',
          patient.gender === 'male' ? 'Homme' : patient.gender === 'female' ? 'Femme' : 'Autre',
          patient.identification_number || '',
        ].filter(Boolean),
        score,
      }
    })
  } catch (error) {
    console.error('Error searching patients:', error)
    return []
  }
}

// Search consultations (mock for now - will be implemented when consultations API is ready)
async function searchConsultations(query: string): Promise<SearchResult[]> {
  // TODO: Implement when consultations API is available
  return []
}

// Search appointments (mock for now)
async function searchAppointments(query: string): Promise<SearchResult[]> {
  // TODO: Implement when appointments API is available
  return []
}

// Main search function
export async function searchAll(query: string): Promise<SearchResult[]> {
  if (!query || query.trim().length < 2) {
    return []
  }

  try {
    // Run all searches in parallel
    const [patientsResults, consultationsResults, appointmentsResults] = await Promise.all([
      searchPatients(query),
      searchConsultations(query),
      searchAppointments(query),
    ])

    // Combine and sort by score
    const allResults = [...patientsResults, ...consultationsResults, ...appointmentsResults]

    return allResults
      .filter((result) => result.score && result.score > 0)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 20) // Limit to top 20 results
  } catch (error) {
    console.error('Search error:', error)
    return []
  }
}

// Get search suggestions based on recent searches and common actions
export function getSearchSuggestions(): string[] {
  return [
    'Nouveau patient',
    'Nouvelle consultation',
    'Rendez-vous du jour',
    'Patients récents',
  ]
}
