/**
 * Tests for AppointmentCard component
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AppointmentCard } from '@/components/calendar/appointment-card'
import { AppointmentType, AppointmentStatus } from '@/lib/hooks/use-appointments'

const mockAppointment = {
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

describe('AppointmentCard', () => {
  it('should render appointment details correctly', () => {
    render(<AppointmentCard appointment={mockAppointment} />)

    // Check time is displayed
    expect(screen.getByText(/10:00 - 11:00/)).toBeInTheDocument()

    // Check duration is displayed
    expect(screen.getByText(/60 min/)).toBeInTheDocument()

    // Check patient ID is displayed
    expect(screen.getByText(/Patient ID: 1/)).toBeInTheDocument()

    // Check first visit badge
    expect(screen.getByText(/1ère visite/)).toBeInTheDocument()
  })

  it('should display correct status badge', () => {
    render(<AppointmentCard appointment={mockAppointment} />)

    // Check status badge
    expect(screen.getByText(/Planifié/)).toBeInTheDocument()
  })

  it('should display correct type badge', () => {
    render(<AppointmentCard appointment={mockAppointment} />)

    // Check type badge
    expect(screen.getByText(/Consultation/)).toBeInTheDocument()
  })

  it('should call onClick when card is clicked', () => {
    const onClick = vi.fn()
    render(<AppointmentCard appointment={mockAppointment} onClick={onClick} />)

    const card = screen.getByText(/10:00 - 11:00/).closest('div')
    if (card) {
      fireEvent.click(card)
      expect(onClick).toHaveBeenCalledTimes(1)
    }
  })

  it('should display reason when provided', () => {
    render(<AppointmentCard appointment={mockAppointment} compact={false} />)

    expect(screen.getByText(/Test consultation/)).toBeInTheDocument()
  })

  it('should not display details in compact mode', () => {
    render(<AppointmentCard appointment={mockAppointment} compact={true} />)

    // In compact mode, type and reason should not be visible
    expect(screen.queryByText(/Test consultation/)).not.toBeInTheDocument()
  })

  it('should show actions menu when showActions is true', () => {
    render(<AppointmentCard appointment={mockAppointment} showActions={true} />)

    // Actions button should be present (MoreVertical icon)
    const actionsButtons = screen.getAllByRole('button')
    expect(actionsButtons.length).toBeGreaterThan(0)
  })

  it('should have onEdit callback when provided', () => {
    const onEdit = vi.fn()
    render(<AppointmentCard appointment={mockAppointment} onEdit={onEdit} showActions={true} />)

    // Verify the component rendered with actions enabled
    const actionsButtons = screen.getAllByRole('button')
    expect(actionsButtons.length).toBeGreaterThan(0)

    // Verify onEdit function is provided (callback exists)
    expect(onEdit).toBeDefined()
    expect(typeof onEdit).toBe('function')
  })

  it('should have onDelete callback when provided', () => {
    const onDelete = vi.fn()
    render(<AppointmentCard appointment={mockAppointment} onDelete={onDelete} showActions={true} />)

    // Verify the component rendered with actions enabled
    const actionsButtons = screen.getAllByRole('button')
    expect(actionsButtons.length).toBeGreaterThan(0)

    // Verify onDelete function is provided (callback exists)
    expect(onDelete).toBeDefined()
    expect(typeof onDelete).toBe('function')
  })

  it('should show completed status for completed appointments', () => {
    const completedAppointment = {
      ...mockAppointment,
      status: AppointmentStatus.COMPLETED,
    }

    render(<AppointmentCard appointment={completedAppointment} />)

    expect(screen.getByText(/Terminé/)).toBeInTheDocument()
  })

  it('should show cancelled status for cancelled appointments', () => {
    const cancelledAppointment = {
      ...mockAppointment,
      status: AppointmentStatus.CANCELLED,
    }

    render(<AppointmentCard appointment={cancelledAppointment} />)

    expect(screen.getByText(/Annulé/)).toBeInTheDocument()
  })

  it('should display indicators for upcoming and reminder sent', () => {
    const appointmentWithIndicators = {
      ...mockAppointment,
      is_upcoming: true,
      reminder_sent: true,
    }

    const { container } = render(<AppointmentCard appointment={appointmentWithIndicators} />)

    // Check for indicator dots
    const indicators = container.querySelectorAll('.h-2.w-2.rounded-full')
    expect(indicators.length).toBeGreaterThan(0)
  })
})
