/**
 * Tests for PatientSearchSelect component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PatientSearchSelect } from '@/components/calendar/patient-search-select'
import * as usePatients from '@/lib/hooks/use-patients'

// Mock the hooks
vi.mock('@/lib/hooks/use-patients', () => ({
  useSearchPatients: vi.fn(),
  Patient: {} as any,
}))

const mockPatients = [
  {
    id: 1,
    first_name: 'Jean',
    last_name: 'Dupont',
    full_name: 'Jean Dupont',
    age: 45,
    phone: '0612345678',
    email: 'jean@example.com',
    gender: 'M',
    date_of_birth: '1980-01-01',
  },
  {
    id: 2,
    first_name: 'Marie',
    last_name: 'Martin',
    full_name: 'Marie Martin',
    age: 32,
    phone: '0687654321',
    email: 'marie@example.com',
    gender: 'F',
    date_of_birth: '1993-05-15',
  },
]

describe('PatientSearchSelect', () => {
  let queryClient: QueryClient
  const mockOnSelect = vi.fn()

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })
    vi.clearAllMocks()
  })

  const renderComponent = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <PatientSearchSelect onSelect={mockOnSelect} {...props} />
      </QueryClientProvider>
    )
  }

  it('should render search input with placeholder', () => {
    vi.mocked(usePatients.useSearchPatients).mockReturnValue({
      data: null,
      isLoading: false,
    } as any)

    renderComponent()

    expect(screen.getByPlaceholderText('Rechercher un patient...')).toBeInTheDocument()
  })

  it('should render custom placeholder', () => {
    vi.mocked(usePatients.useSearchPatients).mockReturnValue({
      data: null,
      isLoading: false,
    } as any)

    renderComponent({ placeholder: 'Chercher...' })

    expect(screen.getByPlaceholderText('Chercher...')).toBeInTheDocument()
  })

  it('should show loading spinner when searching', () => {
    vi.mocked(usePatients.useSearchPatients).mockReturnValue({
      data: null,
      isLoading: true,
    } as any)

    renderComponent()

    const input = screen.getByPlaceholderText('Rechercher un patient...')
    fireEvent.change(input, { target: { value: 'Jean' } })

    // Loading spinner should be visible
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('should not trigger search with less than 2 characters', () => {
    vi.mocked(usePatients.useSearchPatients).mockReturnValue({
      data: null,
      isLoading: false,
    } as any)

    renderComponent()

    const input = screen.getByPlaceholderText('Rechercher un patient...')
    fireEvent.change(input, { target: { value: 'J' } })

    // Dropdown should not open
    expect(screen.queryByText('Tapez au moins 2 caractères pour rechercher')).not.toBeInTheDocument()
  })

  it('should show dropdown with results when typing 2+ characters', async () => {
    vi.mocked(usePatients.useSearchPatients).mockReturnValue({
      data: { patients: mockPatients, total: 2 },
      isLoading: false,
    } as any)

    renderComponent()

    const input = screen.getByPlaceholderText('Rechercher un patient...')
    fireEvent.change(input, { target: { value: 'Jean' } })
    fireEvent.focus(input)

    await waitFor(() => {
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
      expect(screen.getByText('Marie Martin')).toBeInTheDocument()
    })
  })

  it('should display patient details in dropdown', async () => {
    vi.mocked(usePatients.useSearchPatients).mockReturnValue({
      data: { patients: [mockPatients[0]], total: 1 },
      isLoading: false,
    } as any)

    renderComponent()

    const input = screen.getByPlaceholderText('Rechercher un patient...')
    fireEvent.change(input, { target: { value: 'Jean' } })
    fireEvent.focus(input)

    await waitFor(() => {
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
      expect(screen.getByText(/45 ans/)).toBeInTheDocument()
      expect(screen.getByText(/0612345678/)).toBeInTheDocument()
    })
  })

  it('should show "no patients found" message when no results', async () => {
    vi.mocked(usePatients.useSearchPatients).mockReturnValue({
      data: { patients: [], total: 0 },
      isLoading: false,
    } as any)

    renderComponent()

    const input = screen.getByPlaceholderText('Rechercher un patient...')
    fireEvent.change(input, { target: { value: 'XYZ' } })
    fireEvent.focus(input)

    await waitFor(() => {
      expect(screen.getByText('Aucun patient trouvé')).toBeInTheDocument()
    })
  })

  it('should call onSelect when clicking a patient', async () => {
    vi.mocked(usePatients.useSearchPatients).mockReturnValue({
      data: { patients: mockPatients, total: 2 },
      isLoading: false,
    } as any)

    renderComponent()

    const input = screen.getByPlaceholderText('Rechercher un patient...')
    fireEvent.change(input, { target: { value: 'Jean' } })
    fireEvent.focus(input)

    await waitFor(() => {
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Jean Dupont'))

    expect(mockOnSelect).toHaveBeenCalledWith(mockPatients[0])
    expect(mockOnSelect).toHaveBeenCalledTimes(1)
  })

  it('should display selected patient after selection', async () => {
    vi.mocked(usePatients.useSearchPatients).mockReturnValue({
      data: { patients: mockPatients, total: 2 },
      isLoading: false,
    } as any)

    renderComponent()

    const input = screen.getByPlaceholderText('Rechercher un patient...')
    fireEvent.change(input, { target: { value: 'Jean' } })
    fireEvent.focus(input)

    await waitFor(() => {
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Jean Dupont'))

    // Selected patient should be displayed
    await waitFor(() => {
      const displayedNames = screen.getAllByText('Jean Dupont')
      expect(displayedNames.length).toBeGreaterThan(0)
    })
  })

  it('should show change button when patient is selected', async () => {
    vi.mocked(usePatients.useSearchPatients).mockReturnValue({
      data: { patients: mockPatients, total: 2 },
      isLoading: false,
    } as any)

    renderComponent()

    const input = screen.getByPlaceholderText('Rechercher un patient...')
    fireEvent.change(input, { target: { value: 'Jean' } })
    fireEvent.focus(input)

    await waitFor(() => {
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Jean Dupont'))

    await waitFor(() => {
      expect(screen.getByText('Changer')).toBeInTheDocument()
    })
  })

  it('should clear selection when clicking change button', async () => {
    vi.mocked(usePatients.useSearchPatients).mockReturnValue({
      data: { patients: mockPatients, total: 2 },
      isLoading: false,
    } as any)

    renderComponent()

    const input = screen.getByPlaceholderText('Rechercher un patient...')
    fireEvent.change(input, { target: { value: 'Jean' } })
    fireEvent.focus(input)

    await waitFor(() => {
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Jean Dupont'))

    await waitFor(() => {
      expect(screen.getByText('Changer')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Changer'))

    expect(mockOnSelect).toHaveBeenCalledWith(null)
    // Search input should be visible again
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Rechercher un patient...')).toBeInTheDocument()
    })
  })

  it('should close dropdown when clicking backdrop', async () => {
    vi.mocked(usePatients.useSearchPatients).mockReturnValue({
      data: { patients: mockPatients, total: 2 },
      isLoading: false,
    } as any)

    renderComponent()

    const input = screen.getByPlaceholderText('Rechercher un patient...')
    fireEvent.change(input, { target: { value: 'Jean' } })
    fireEvent.focus(input)

    await waitFor(() => {
      expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
    })

    // Find and click backdrop
    const backdrop = document.querySelector('.fixed.inset-0.z-40')
    if (backdrop) {
      fireEvent.click(backdrop)
    }

    // Dropdown should close (patients not visible)
    await waitFor(() => {
      const dropdownResults = document.querySelector('.z-50.mt-2')
      expect(dropdownResults).not.toBeInTheDocument()
    })
  })

  it('should display result count in footer', async () => {
    vi.mocked(usePatients.useSearchPatients).mockReturnValue({
      data: { patients: mockPatients, total: 2 },
      isLoading: false,
    } as any)

    renderComponent()

    const input = screen.getByPlaceholderText('Rechercher un patient...')
    fireEvent.change(input, { target: { value: 'Jean' } })
    fireEvent.focus(input)

    await waitFor(() => {
      expect(screen.getByText('2 patients trouvés')).toBeInTheDocument()
    })
  })

  it('should display singular count text for 1 patient', async () => {
    vi.mocked(usePatients.useSearchPatients).mockReturnValue({
      data: { patients: [mockPatients[0]], total: 1 },
      isLoading: false,
    } as any)

    renderComponent()

    const input = screen.getByPlaceholderText('Rechercher un patient...')
    fireEvent.change(input, { target: { value: 'Jean' } })
    fireEvent.focus(input)

    await waitFor(() => {
      expect(screen.getByText('1 patient trouvé')).toBeInTheDocument()
    })
  })

  it('should display error message when provided', () => {
    vi.mocked(usePatients.useSearchPatients).mockReturnValue({
      data: null,
      isLoading: false,
    } as any)

    renderComponent({ error: 'Veuillez sélectionner un patient' })

    expect(screen.getByText('Veuillez sélectionner un patient')).toBeInTheDocument()
  })

  it('should apply error styles to input when error is present', () => {
    vi.mocked(usePatients.useSearchPatients).mockReturnValue({
      data: null,
      isLoading: false,
    } as any)

    renderComponent({ error: 'Error message' })

    const input = screen.getByPlaceholderText('Rechercher un patient...')
    expect(input.className).toContain('border-red-500')
  })

  it('should show loading state in dropdown', async () => {
    vi.mocked(usePatients.useSearchPatients).mockReturnValue({
      data: null,
      isLoading: true,
    } as any)

    renderComponent()

    const input = screen.getByPlaceholderText('Rechercher un patient...')
    fireEvent.change(input, { target: { value: 'Jean' } })
    fireEvent.focus(input)

    await waitFor(() => {
      expect(screen.getByText('Recherche en cours...')).toBeInTheDocument()
    })
  })
})
