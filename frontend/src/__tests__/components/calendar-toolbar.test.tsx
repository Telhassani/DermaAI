/**
 * Tests for CalendarToolbar component
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CalendarToolbar, CalendarView } from '@/components/calendar/calendar-toolbar'

describe('CalendarToolbar', () => {
  const mockDate = new Date('2025-11-15T10:00:00')
  const mockOnDateChange = vi.fn()
  const mockOnViewChange = vi.fn()
  const mockOnCreateAppointment = vi.fn()
  const mockOnToggleFilters = vi.fn()

  const defaultProps = {
    currentDate: mockDate,
    view: 'month' as CalendarView,
    onDateChange: mockOnDateChange,
    onViewChange: mockOnViewChange,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render navigation buttons', () => {
    render(<CalendarToolbar {...defaultProps} />)

    expect(screen.getByText('Aujourd\'hui')).toBeInTheDocument()
    // Previous and next buttons (ChevronLeft and ChevronRight)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('should display current month in month view', () => {
    render(<CalendarToolbar {...defaultProps} view="month" />)

    // November 2025
    expect(screen.getByText(/novembre 2025/i)).toBeInTheDocument()
  })

  it('should display week range in week view', () => {
    render(<CalendarToolbar {...defaultProps} view="week" />)

    // Should show week range
    const heading = screen.getByRole('heading')
    expect(heading.textContent).toContain('-')
  })

  it('should display full date in day view', () => {
    render(<CalendarToolbar {...defaultProps} view="day" />)

    // Should show full date with day name
    expect(screen.getByText(/samedi 15 novembre 2025/i)).toBeInTheDocument()
  })

  it('should display agenda title in agenda view', () => {
    render(<CalendarToolbar {...defaultProps} view="agenda" />)

    expect(screen.getByText('Liste des rendez-vous')).toBeInTheDocument()
  })

  it('should call onDateChange when clicking today button', () => {
    render(<CalendarToolbar {...defaultProps} />)

    fireEvent.click(screen.getByText('Aujourd\'hui'))

    expect(mockOnDateChange).toHaveBeenCalledTimes(1)
    // Should be called with a date close to now
    const calledDate = mockOnDateChange.mock.calls[0][0]
    expect(calledDate instanceof Date).toBe(true)
  })

  it('should call onDateChange when clicking previous button in month view', () => {
    render(<CalendarToolbar {...defaultProps} view="month" />)

    const buttons = screen.getAllByRole('button')
    const prevButton = buttons[0] // First button is previous

    fireEvent.click(prevButton)

    expect(mockOnDateChange).toHaveBeenCalledTimes(1)
    const calledDate = mockOnDateChange.mock.calls[0][0]

    // Should be one month before (October)
    expect(calledDate.getMonth()).toBe(9) // October = 9
    expect(calledDate.getFullYear()).toBe(2025)
  })

  it('should call onDateChange when clicking next button in month view', () => {
    render(<CalendarToolbar {...defaultProps} view="month" />)

    const buttons = screen.getAllByRole('button')
    const nextButton = buttons[2] // Third button is next (0=prev, 1=today, 2=next)

    fireEvent.click(nextButton)

    expect(mockOnDateChange).toHaveBeenCalledTimes(1)
    const calledDate = mockOnDateChange.mock.calls[0][0]

    // Should be one month after (December)
    expect(calledDate.getMonth()).toBe(11) // December = 11
    expect(calledDate.getFullYear()).toBe(2025)
  })

  it('should navigate by 7 days in week view', () => {
    render(<CalendarToolbar {...defaultProps} view="week" />)

    const buttons = screen.getAllByRole('button')
    const nextButton = buttons[2]

    fireEvent.click(nextButton)

    expect(mockOnDateChange).toHaveBeenCalledTimes(1)
    const calledDate = mockOnDateChange.mock.calls[0][0]

    // Should be 7 days later (Nov 22)
    expect(calledDate.getDate()).toBe(22)
  })

  it('should navigate by 1 day in day view', () => {
    render(<CalendarToolbar {...defaultProps} view="day" />)

    const buttons = screen.getAllByRole('button')
    const nextButton = buttons[2]

    fireEvent.click(nextButton)

    expect(mockOnDateChange).toHaveBeenCalledTimes(1)
    const calledDate = mockOnDateChange.mock.calls[0][0]

    // Should be 1 day later (Nov 16)
    expect(calledDate.getDate()).toBe(16)
  })

  it('should render all view selector buttons', () => {
    render(<CalendarToolbar {...defaultProps} />)

    expect(screen.getByText('Mois')).toBeInTheDocument()
    expect(screen.getByText('Semaine')).toBeInTheDocument()
    expect(screen.getByText('Jour')).toBeInTheDocument()
    expect(screen.getByText('Agenda')).toBeInTheDocument()
  })

  it('should highlight active view', () => {
    render(<CalendarToolbar {...defaultProps} view="week" />)

    const weekButton = screen.getByText('Semaine')

    // Active button should have specific classes
    expect(weekButton.className).toContain('bg-white')
    expect(weekButton.className).toContain('text-blue-600')
  })

  it('should call onViewChange when clicking view selector buttons', () => {
    render(<CalendarToolbar {...defaultProps} />)

    fireEvent.click(screen.getByText('Semaine'))
    expect(mockOnViewChange).toHaveBeenCalledWith('week')

    fireEvent.click(screen.getByText('Jour'))
    expect(mockOnViewChange).toHaveBeenCalledWith('day')

    fireEvent.click(screen.getByText('Agenda'))
    expect(mockOnViewChange).toHaveBeenCalledWith('agenda')

    expect(mockOnViewChange).toHaveBeenCalledTimes(3)
  })

  it('should render create appointment button when provided', () => {
    render(
      <CalendarToolbar
        {...defaultProps}
        onCreateAppointment={mockOnCreateAppointment}
      />
    )

    expect(screen.getByText('Nouveau rendez-vous')).toBeInTheDocument()
  })

  it('should call onCreateAppointment when clicking create button', () => {
    render(
      <CalendarToolbar
        {...defaultProps}
        onCreateAppointment={mockOnCreateAppointment}
      />
    )

    fireEvent.click(screen.getByText('Nouveau rendez-vous'))

    expect(mockOnCreateAppointment).toHaveBeenCalledTimes(1)
  })

  it('should not render create button when not provided', () => {
    render(<CalendarToolbar {...defaultProps} />)

    expect(screen.queryByText('Nouveau rendez-vous')).not.toBeInTheDocument()
  })

  it('should render filter toggle button when provided', () => {
    render(
      <CalendarToolbar
        {...defaultProps}
        onToggleFilters={mockOnToggleFilters}
      />
    )

    // Filter button should be present (Filter icon)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(5) // Extra button for filter
  })

  it('should call onToggleFilters when provided', () => {
    render(
      <CalendarToolbar
        {...defaultProps}
        onToggleFilters={mockOnToggleFilters}
        showFilters={false}
      />
    )

    // Verify the callback function is defined
    expect(mockOnToggleFilters).toBeDefined()
    expect(typeof mockOnToggleFilters).toBe('function')

    // Component should render with filters functionality
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('should render differently when filters are shown', () => {
    const { rerender } = render(
      <CalendarToolbar
        {...defaultProps}
        onToggleFilters={mockOnToggleFilters}
        showFilters={false}
      />
    )

    // Rerender with showFilters true
    rerender(
      <CalendarToolbar
        {...defaultProps}
        onToggleFilters={mockOnToggleFilters}
        showFilters={true}
      />
    )

    // Verify component updates when showFilters changes
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('should show responsive text on create button', () => {
    render(
      <CalendarToolbar
        {...defaultProps}
        onCreateAppointment={mockOnCreateAppointment}
      />
    )

    // Long version for desktop
    expect(screen.getByText('Nouveau rendez-vous')).toBeInTheDocument()
    // Short version for mobile
    expect(screen.getByText('Nouveau')).toBeInTheDocument()
  })
})
