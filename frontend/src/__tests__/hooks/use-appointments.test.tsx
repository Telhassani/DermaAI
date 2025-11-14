/**
 * Tests for use-appointments hook
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  useAppointments,
  useCreateAppointment,
  useUpdateAppointment,
  useDeleteAppointment,
  AppointmentType,
  AppointmentStatus,
} from '@/lib/hooks/use-appointments'
import { api } from '@/lib/api/client'

// Mock API client
vi.mock('@/lib/api/client', () => ({
  api: {
    appointments: {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      updateStatus: vi.fn(),
      checkConflicts: vi.fn(),
      stats: vi.fn(),
    },
  },
}))

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Helper to create wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useAppointments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch appointments successfully', async () => {
    const mockAppointments = {
      appointments: [
        {
          id: 1,
          patient_id: 1,
          doctor_id: 1,
          start_time: '2025-11-15T10:00:00',
          end_time: '2025-11-15T11:00:00',
          type: AppointmentType.CONSULTATION,
          status: AppointmentStatus.SCHEDULED,
          duration_minutes: 60,
          is_upcoming: true,
          is_past: false,
        },
      ],
      total: 1,
      page: 1,
      page_size: 20,
      total_pages: 1,
    }

    vi.mocked(api.appointments.list).mockResolvedValue({ data: mockAppointments } as any)

    const { result } = renderHook(() => useAppointments(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(mockAppointments)
    expect(api.appointments.list).toHaveBeenCalledTimes(1)
  })

  it('should handle error when fetching appointments', async () => {
    vi.mocked(api.appointments.list).mockRejectedValue(new Error('API Error'))

    const { result } = renderHook(() => useAppointments(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeDefined()
  })

  it('should filter appointments by parameters', async () => {
    const params = {
      doctor_id: 1,
      status: AppointmentStatus.SCHEDULED,
      start_date: '2025-11-15T00:00:00',
      end_date: '2025-11-15T23:59:59',
    }

    vi.mocked(api.appointments.list).mockResolvedValue({
      data: { appointments: [], total: 0, page: 1, page_size: 20, total_pages: 0 },
    } as any)

    const { result } = renderHook(() => useAppointments(params), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(api.appointments.list).toHaveBeenCalledWith(params)
  })
})

describe('useCreateAppointment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create appointment successfully', async () => {
    const newAppointment = {
      patient_id: 1,
      doctor_id: 1,
      start_time: '2025-11-15T10:00:00',
      end_time: '2025-11-15T11:00:00',
      type: AppointmentType.CONSULTATION,
      reason: 'Test consultation',
      is_first_visit: false,
    }

    const createdAppointment = {
      id: 1,
      ...newAppointment,
      status: AppointmentStatus.SCHEDULED,
      duration_minutes: 60,
      is_upcoming: true,
      is_past: false,
      created_at: '2025-11-13T10:00:00',
      updated_at: '2025-11-13T10:00:00',
    }

    vi.mocked(api.appointments.create).mockResolvedValue({ data: createdAppointment } as any)

    const { result } = renderHook(() => useCreateAppointment(), {
      wrapper: createWrapper(),
    })

    result.current.mutate(newAppointment)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(api.appointments.create).toHaveBeenCalledWith(newAppointment)
    expect(result.current.data).toEqual(createdAppointment)
  })

  it('should handle error when creating appointment', async () => {
    vi.mocked(api.appointments.create).mockRejectedValue(new Error('Creation failed'))

    const { result } = renderHook(() => useCreateAppointment(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({
      patient_id: 1,
      doctor_id: 1,
      start_time: '2025-11-15T10:00:00',
      end_time: '2025-11-15T11:00:00',
      type: AppointmentType.CONSULTATION,
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeDefined()
  })
})

describe('useUpdateAppointment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should update appointment successfully', async () => {
    const updateData = {
      reason: 'Updated reason',
      notes: 'Updated notes',
    }

    const updatedAppointment = {
      id: 1,
      patient_id: 1,
      doctor_id: 1,
      start_time: '2025-11-15T10:00:00',
      end_time: '2025-11-15T11:00:00',
      type: AppointmentType.CONSULTATION,
      status: AppointmentStatus.SCHEDULED,
      ...updateData,
      duration_minutes: 60,
      is_upcoming: true,
      is_past: false,
      created_at: '2025-11-13T10:00:00',
      updated_at: '2025-11-13T10:30:00',
    }

    vi.mocked(api.appointments.update).mockResolvedValue({ data: updatedAppointment } as any)

    const { result } = renderHook(() => useUpdateAppointment(), {
      wrapper: createWrapper(),
    })

    result.current.mutate({ id: 1, data: updateData })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(api.appointments.update).toHaveBeenCalledWith(1, updateData)
    expect(result.current.data).toEqual(updatedAppointment)
  })
})

describe('useDeleteAppointment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should delete appointment successfully', async () => {
    vi.mocked(api.appointments.delete).mockResolvedValue({} as any)

    const { result } = renderHook(() => useDeleteAppointment(), {
      wrapper: createWrapper(),
    })

    result.current.mutate(1)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(api.appointments.delete).toHaveBeenCalledWith(1)
  })

  it('should handle error when deleting appointment', async () => {
    vi.mocked(api.appointments.delete).mockRejectedValue(new Error('Deletion failed'))

    const { result } = renderHook(() => useDeleteAppointment(), {
      wrapper: createWrapper(),
    })

    result.current.mutate(1)

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(result.current.error).toBeDefined()
  })
})
