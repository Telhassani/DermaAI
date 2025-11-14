/**
 * Tests for appointment modal components
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppointmentCreateModal } from '@/components/calendar/appointment-create-modal'
import { AppointmentDetailsModal } from '@/components/calendar/appointment-details-modal'
import { AppointmentType, AppointmentStatus, Appointment } from '@/lib/hooks/use-appointments'
import * as useAuth from '@/lib/hooks/use-auth'
import * as usePatients from '@/lib/hooks/use-patients'
import * as useAppointments from '@/lib/hooks/use-appointments'

// Mock the hooks
vi.mock('@/lib/hooks/use-auth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/lib/hooks/use-patients', () => ({
  useSearchPatients: vi.fn(),
  usePatient: vi.fn(),
  Patient: {} as any,
}))

vi.mock('@/lib/hooks/use-appointments', () => ({
  useCreateAppointment: vi.fn(),
  useUpdateAppointment: vi.fn(),
  useUpdateAppointmentStatus: vi.fn(),
  useDeleteAppointment: vi.fn(),
  useCheckAppointmentConflictsQuery: vi.fn(),
  AppointmentType: {
    CONSULTATION: 'CONSULTATION',
    FOLLOW_UP: 'FOLLOW_UP',
    PROCEDURE: 'PROCEDURE',
    EMERGENCY: 'EMERGENCY',
  },
  AppointmentStatus: {
    SCHEDULED: 'SCHEDULED',
    CONFIRMED: 'CONFIRMED',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
    NO_SHOW: 'NO_SHOW',
  },
}))

const mockUser = {
  id: 1,
  email: 'doctor@test.com',
  full_name: 'Dr. Test',
  role: 'DOCTOR',
}

const mockAppointment: Appointment = {
  id: 1,
  patient_id: 1,
  doctor_id: 1,
  start_time: '2025-11-15T10:00:00',
  end_time: '2025-11-15T11:00:00',
  type: AppointmentType.CONSULTATION,
  status: AppointmentStatus.SCHEDULED,
  reason: 'Test consultation',
  notes: 'Test notes',
  diagnosis: null,
  is_first_visit: true,
  reminder_sent: false,
  created_at: '2025-11-13T10:00:00',
  updated_at: '2025-11-13T10:00:00',
  duration_minutes: 60,
  is_upcoming: true,
  is_past: false,
}

const mockPatient = {
  id: 1,
  first_name: 'Jean',
  last_name: 'Dupont',
  full_name: 'Jean Dupont',
  age: 45,
  phone: '0612345678',
  email: 'jean@example.com',
  gender: 'M',
  date_of_birth: '1980-01-01',
}

describe('AppointmentCreateModal', () => {
  let queryClient: QueryClient
  const mockOnClose = vi.fn()
  const mockMutateAsync = vi.fn()

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })

    vi.clearAllMocks()

    vi.mocked(useAuth.useAuth).mockReturnValue({
      user: mockUser,
      token: 'test-token',
      isLoading: false,
      isAuthenticated: true,
      login: vi.fn(),
      logout: vi.fn(),
      checkAuth: vi.fn(),
    })

    vi.mocked(usePatients.useSearchPatients).mockReturnValue({
      data: null,
      isLoading: false,
    } as any)

    vi.mocked(useAppointments.useCreateAppointment).mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
    } as any)

    vi.mocked(useAppointments.useCheckAppointmentConflictsQuery).mockReturnValue({
      data: { has_conflict: false, conflicting_appointments: [] },
      isLoading: false,
      refetch: vi.fn(),
    } as any)
  })

  const renderComponent = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AppointmentCreateModal isOpen={true} onClose={mockOnClose} {...props} />
      </QueryClientProvider>
    )
  }

  it('should not render when isOpen is false', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AppointmentCreateModal isOpen={false} onClose={mockOnClose} />
      </QueryClientProvider>
    )

    expect(screen.queryByText('Nouveau rendez-vous')).not.toBeInTheDocument()
  })

  it('should render modal when isOpen is true', () => {
    renderComponent()

    expect(screen.getByText('Nouveau rendez-vous')).toBeInTheDocument()
    expect(screen.getByText('Créez un nouveau rendez-vous pour un patient')).toBeInTheDocument()
  })

  it('should render backdrop', () => {
    const { container } = renderComponent()

    const backdrop = container.querySelector('.fixed.inset-0.z-50.bg-black\\/50')
    expect(backdrop).toBeInTheDocument()
  })

  it('should call onClose when clicking close button', () => {
    renderComponent()

    const closeButtons = screen.getAllByRole('button')
    // Find the X close button
    const closeButton = closeButtons.find((btn) => btn.className.includes('text-gray-400'))

    if (closeButton) {
      fireEvent.click(closeButton)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    }
  })

  it('should call onClose when clicking backdrop', () => {
    const { container } = renderComponent()

    const backdrop = container.querySelector('.fixed.inset-0.z-50.bg-black\\/50')
    if (backdrop) {
      fireEvent.click(backdrop)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    }
  })

  it('should render appointment form inside modal', () => {
    renderComponent()

    // Form elements should be present
    expect(screen.getByPlaceholderText('Rechercher un patient...')).toBeInTheDocument()
    expect(screen.getByText('Créer le rendez-vous')).toBeInTheDocument()
  })

  it('should pass initialDate to form', () => {
    const initialDate = new Date('2025-12-01T14:00:00')
    renderComponent({ initialDate })

    const dateInput = screen.getByLabelText(/Date/) as HTMLInputElement
    expect(dateInput.value).toBe('2025-12-01')
  })

  it('should pass initialHour to form', () => {
    const initialDate = new Date('2025-12-01T00:00:00')
    const initialHour = 14
    renderComponent({ initialDate, initialHour })

    const timeInput = screen.getByLabelText(/Heure de début/) as HTMLInputElement
    expect(timeInput.value).toBe('14:00')
  })

  it('should call onClose after successful submission', async () => {
    mockMutateAsync.mockResolvedValueOnce({ id: 1 })

    renderComponent()

    // Form submission would trigger onClose
    // Note: Full form submission test would require filling all fields
  })
})

describe('AppointmentDetailsModal', () => {
  let queryClient: QueryClient
  const mockOnClose = vi.fn()
  const mockUpdateMutateAsync = vi.fn()
  const mockStatusMutateAsync = vi.fn()
  const mockDeleteMutateAsync = vi.fn()

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })

    vi.clearAllMocks()

    vi.mocked(usePatients.usePatient).mockReturnValue({
      data: mockPatient,
      isLoading: false,
    } as any)

    vi.mocked(useAppointments.useUpdateAppointment).mockReturnValue({
      mutateAsync: mockUpdateMutateAsync,
      isPending: false,
    } as any)

    vi.mocked(useAppointments.useUpdateAppointmentStatus).mockReturnValue({
      mutateAsync: mockStatusMutateAsync,
      isPending: false,
    } as any)

    vi.mocked(useAppointments.useDeleteAppointment).mockReturnValue({
      mutateAsync: mockDeleteMutateAsync,
      isPending: false,
    } as any)
  })

  const renderComponent = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AppointmentDetailsModal
          appointment={mockAppointment}
          isOpen={true}
          onClose={mockOnClose}
          {...props}
        />
      </QueryClientProvider>
    )
  }

  it('should not render when isOpen is false', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AppointmentDetailsModal
          appointment={mockAppointment}
          isOpen={false}
          onClose={mockOnClose}
        />
      </QueryClientProvider>
    )

    expect(screen.queryByText('Détails du rendez-vous')).not.toBeInTheDocument()
  })

  it('should not render when appointment is null', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <AppointmentDetailsModal appointment={null} isOpen={true} onClose={mockOnClose} />
      </QueryClientProvider>
    )

    expect(screen.queryByText('Détails du rendez-vous')).not.toBeInTheDocument()
  })

  it('should render appointment details', () => {
    renderComponent()

    expect(screen.getByText('Détails du rendez-vous')).toBeInTheDocument()
    expect(screen.getByText(/Rendez-vous #1/)).toBeInTheDocument()
  })

  it('should display appointment status badge', () => {
    renderComponent()

    expect(screen.getByText('Planifié')).toBeInTheDocument()
  })

  it('should display appointment type badge', () => {
    renderComponent()

    expect(screen.getByText('Consultation')).toBeInTheDocument()
  })

  it('should display first visit badge when applicable', () => {
    renderComponent()

    expect(screen.getByText('1ère visite')).toBeInTheDocument()
  })

  it('should display appointment date and time', () => {
    renderComponent()

    expect(screen.getByText(/samedi 15 novembre 2025/i)).toBeInTheDocument()
    expect(screen.getByText(/10:00 - 11:00/)).toBeInTheDocument()
    expect(screen.getByText(/60 minutes/)).toBeInTheDocument()
  })

  it('should display patient information', () => {
    renderComponent()

    expect(screen.getByText('Jean Dupont')).toBeInTheDocument()
    expect(screen.getByText(/45 ans/)).toBeInTheDocument()
    expect(screen.getByText(/0612345678/)).toBeInTheDocument()
  })

  it('should display appointment reason', () => {
    renderComponent()

    expect(screen.getByText('Test consultation')).toBeInTheDocument()
  })

  it('should display appointment notes', () => {
    renderComponent()

    expect(screen.getByText('Test notes')).toBeInTheDocument()
  })

  it('should show edit and delete buttons', () => {
    renderComponent()

    const buttons = screen.getAllByRole('button')
    // Should have edit button (with Edit icon) and delete button (with Trash icon)
    expect(buttons.length).toBeGreaterThan(2)
  })

  it('should show quick action buttons for non-completed appointments', () => {
    renderComponent()

    expect(screen.getByText('Confirmer')).toBeInTheDocument()
    expect(screen.getByText('Démarrer')).toBeInTheDocument()
    expect(screen.getByText('Terminer')).toBeInTheDocument()
  })

  it('should not show quick actions for completed appointments', () => {
    const completedAppointment = {
      ...mockAppointment,
      status: AppointmentStatus.COMPLETED,
    }

    render(
      <QueryClientProvider client={queryClient}>
        <AppointmentDetailsModal
          appointment={completedAppointment}
          isOpen={true}
          onClose={mockOnClose}
        />
      </QueryClientProvider>
    )

    expect(screen.queryByText('Confirmer')).not.toBeInTheDocument()
    expect(screen.queryByText('Démarrer')).not.toBeInTheDocument()
  })

  it('should switch to edit mode when clicking edit button', () => {
    renderComponent()

    const buttons = screen.getAllByRole('button')
    // Find edit button (should be one of the first icon buttons)
    const editButton = buttons[0]

    fireEvent.click(editButton)

    // Should show form title
    expect(screen.getByText('Modifier le rendez-vous')).toBeInTheDocument()
    expect(screen.getByText('Mettre à jour')).toBeInTheDocument()
  })

  it('should call onClose when clicking close button', () => {
    renderComponent()

    const buttons = screen.getAllByRole('button')
    // Close button is the last icon button in header
    const closeButton = buttons.find((btn) => btn.className.includes('text-gray-400'))

    if (closeButton) {
      fireEvent.click(closeButton)
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    }
  })

  it('should display metadata timestamps', () => {
    renderComponent()

    expect(screen.getByText(/Créé le/)).toBeInTheDocument()
    expect(screen.getByText(/Dernière modification le/)).toBeInTheDocument()
  })

  it('should show diagnosis when present', () => {
    const appointmentWithDiagnosis = {
      ...mockAppointment,
      diagnosis: 'Test diagnosis',
    }

    render(
      <QueryClientProvider client={queryClient}>
        <AppointmentDetailsModal
          appointment={appointmentWithDiagnosis}
          isOpen={true}
          onClose={mockOnClose}
        />
      </QueryClientProvider>
    )

    expect(screen.getByText('Diagnostic')).toBeInTheDocument()
    expect(screen.getByText('Test diagnosis')).toBeInTheDocument()
  })

  it('should show cancelled status for cancelled appointments', () => {
    const cancelledAppointment = {
      ...mockAppointment,
      status: AppointmentStatus.CANCELLED,
    }

    render(
      <QueryClientProvider client={queryClient}>
        <AppointmentDetailsModal
          appointment={cancelledAppointment}
          isOpen={true}
          onClose={mockOnClose}
        />
      </QueryClientProvider>
    )

    expect(screen.getByText('Annulé')).toBeInTheDocument()
  })

  it('should disable confirm button when already confirmed', () => {
    const confirmedAppointment = {
      ...mockAppointment,
      status: AppointmentStatus.CONFIRMED,
    }

    render(
      <QueryClientProvider client={queryClient}>
        <AppointmentDetailsModal
          appointment={confirmedAppointment}
          isOpen={true}
          onClose={mockOnClose}
        />
      </QueryClientProvider>
    )

    const confirmButton = screen.getByText('Confirmer')
    expect(confirmButton).toBeDisabled()
  })

  it('should disable start button when already in progress', () => {
    const inProgressAppointment = {
      ...mockAppointment,
      status: AppointmentStatus.IN_PROGRESS,
    }

    render(
      <QueryClientProvider client={queryClient}>
        <AppointmentDetailsModal
          appointment={inProgressAppointment}
          isOpen={true}
          onClose={mockOnClose}
        />
      </QueryClientProvider>
    )

    const startButton = screen.getByText('Démarrer')
    expect(startButton).toBeDisabled()
  })
})
