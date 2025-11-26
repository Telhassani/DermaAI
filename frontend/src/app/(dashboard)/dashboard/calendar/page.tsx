'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, startOfWeek } from 'date-fns'
import { CalendarToolbar, CalendarView } from '@/components/calendar/calendar-toolbar'
import { CalendarGrid } from '@/components/calendar/calendar-grid'
import { CalendarWeekViewDnd } from '@/components/calendar/calendar-week-view-dnd'
import { CalendarDayViewDnd } from '@/components/calendar/calendar-day-view-dnd'
import { CalendarAgendaView } from '@/components/calendar/calendar-agenda-view'
import { AppointmentCreateModal } from '@/components/calendar/appointment-create-modal'
import { AppointmentDetailsModal } from '@/components/calendar/appointment-details-modal'
import {
  CalendarFiltersPanel,
  CalendarFilters,
} from '@/components/calendar/calendar-filters-panel'
import {
  useAppointments,
  useUpdateAppointment,
  useDeleteAppointment,
  useCheckAppointmentConflicts,
  Appointment,
} from '@/lib/hooks/use-appointments'
import { toast } from 'sonner'

export default function CalendarPage() {
  // State management
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>('month')
  const [showFilters, setShowFilters] = useState(false)

  // Filters state
  const [filters, setFilters] = useState<CalendarFilters>({
    types: [],
    statuses: [],
    searchQuery: '',
    showCancelled: true,
    showCompleted: true,
  })

  // Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createModalDate, setCreateModalDate] = useState<Date | undefined>()
  const [createModalHour, setCreateModalHour] = useState<number | undefined>()
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  // Calculate date range based on view
  const getDateRange = () => {
    const today = new Date()

    switch (view) {
      case 'month':
        return {
          start_date: format(startOfMonth(currentDate), "yyyy-MM-dd'T'00:00:00"),
          end_date: format(endOfMonth(currentDate), "yyyy-MM-dd'T'23:59:59"),
        }
      case 'week':
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        return {
          start_date: format(weekStart, "yyyy-MM-dd'T'00:00:00"),
          end_date: format(weekEnd, "yyyy-MM-dd'T'23:59:59"),
        }
      case 'day':
        return {
          start_date: format(currentDate, "yyyy-MM-dd'T'00:00:00"),
          end_date: format(currentDate, "yyyy-MM-dd'T'23:59:59"),
        }
      case 'agenda':
        // Show next 30 days for agenda view
        const agendaEnd = new Date(today)
        agendaEnd.setDate(today.getDate() + 30)
        return {
          start_date: format(today, "yyyy-MM-dd'T'00:00:00"),
          end_date: format(agendaEnd, "yyyy-MM-dd'T'23:59:59"),
        }
    }
  }

  // Fetch appointments
  const { data: appointmentsData, isLoading, error } = useAppointments({
    ...getDateRange(),
    page: 1,
    page_size: 100,
    sort_by: 'start_time',
    sort_order: 'asc',
  })

  // Get appointments from data - MUST be defined before handlers that use it
  const allAppointments = appointmentsData?.appointments || []

  // Mutations
  const deleteMutation = useDeleteAppointment()
  const updateMutation = useUpdateAppointment()
  const { mutateAsync: checkConflicts } = useCheckAppointmentConflicts()

  // Handlers
  const handleDateChange = (date: Date) => {
    setCurrentDate(date)
  }

  const handleViewChange = (newView: CalendarView) => {
    setView(newView)
  }

  const handleCreateAppointment = () => {
    setCreateModalDate(undefined)
    setCreateModalHour(undefined)
    setCreateModalOpen(true)
  }

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setDetailsModalOpen(true)
  }

  const handleAppointmentEdit = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setDetailsModalOpen(true)
  }

  const handleAppointmentDelete = (appointment: Appointment) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce rendez-vous ?')) {
      deleteMutation.mutate(appointment.id)
    }
  }

  const handleDayClick = (date: Date) => {
    setCurrentDate(date)
    setView('day')
  }

  const handleTimeSlotClick = (date: Date, hour: number) => {
    setCreateModalDate(date)
    setCreateModalHour(hour)
    setCreateModalOpen(true)
  }

  const handleAppointmentReschedule = async (
    appointmentId: number,
    newStartTime: Date,
    newEndTime: Date
  ) => {
    try {
      // Check for conflicts first
      const currentAppointment = allAppointments.find((a) => a.id === appointmentId)
      const conflictData = await checkConflicts({
        start_time: newStartTime.toISOString(),
        end_time: newEndTime.toISOString(),
        doctor_id: currentAppointment?.doctor_id || 0,
        exclude_appointment_id: appointmentId,
      })

      if (conflictData.has_conflict) {
        toast.error(
          `Conflit détecté avec ${conflictData.conflicts?.length || 0} rendez-vous existant(s)`
        )
        return
      }

      // No conflicts, proceed with rescheduling
      await updateMutation.mutateAsync({
        id: appointmentId,
        data: {
          start_time: newStartTime.toISOString(),
          end_time: newEndTime.toISOString(),
        },
      })

      toast.success('Rendez-vous reprogrammé avec succès')
    } catch (error) {
      toast.error('Erreur lors de la reprogrammation du rendez-vous')
      console.error('Rescheduling error:', error)
    }
  }

  // Apply filters to appointments
  const appointments = allAppointments.filter((appointment) => {
    // Filter by type
    if (filters.types.length > 0 && !filters.types.includes(appointment.type)) {
      return false
    }

    // Filter by status
    if (filters.statuses.length > 0 && !filters.statuses.includes(appointment.status)) {
      return false
    }

    // Filter by search query (patient ID or reason)
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      const matchesPatient = appointment.patient_id.toString().includes(query)
      const matchesReason = appointment.reason?.toLowerCase().includes(query)
      const matchesNotes = appointment.notes?.toLowerCase().includes(query)

      if (!matchesPatient && !matchesReason && !matchesNotes) {
        return false
      }
    }

    // Filter cancelled appointments
    if (!filters.showCancelled && appointment.status === 'CANCELLED') {
      return false
    }

    // Filter completed appointments
    if (!filters.showCompleted && appointment.status === 'COMPLETED') {
      return false
    }

    return true
  })

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendrier</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gérez vos rendez-vous et planifiez votre emploi du temps
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <CalendarToolbar
        currentDate={currentDate}
        view={view}
        onDateChange={handleDateChange}
        onViewChange={handleViewChange}
        onCreateAppointment={handleCreateAppointment}
        onToggleFilters={() => setShowFilters(!showFilters)}
        showFilters={showFilters}
      />

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-1 items-center justify-center rounded-lg border bg-white">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            <p className="mt-4 text-sm text-gray-600">Chargement des rendez-vous...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex flex-1 items-center justify-center rounded-lg border bg-white">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <p className="mt-4 text-sm font-medium text-gray-900">Erreur de chargement</p>
            <p className="mt-1 text-xs text-gray-500">
              Impossible de charger les rendez-vous
            </p>
          </div>
        </div>
      )}

      {/* Calendar views */}
      {!isLoading && !error && (
        <div className="flex-1 overflow-hidden">
          {view === 'month' && (
            <CalendarGrid
              currentDate={currentDate}
              appointments={appointments}
              onDayClick={handleDayClick}
              onAppointmentClick={handleAppointmentClick}
            />
          )}

          {view === 'week' && (
            <div style={{ height: 'calc(100vh - 300px)' }}>
              <CalendarWeekViewDnd
                currentDate={currentDate}
                appointments={appointments}
                onAppointmentClick={handleAppointmentClick}
                onTimeSlotClick={handleTimeSlotClick}
                onAppointmentReschedule={handleAppointmentReschedule}
              />
            </div>
          )}

          {view === 'day' && (
            <div style={{ height: 'calc(100vh - 300px)' }}>
              <CalendarDayViewDnd
                currentDate={currentDate}
                appointments={appointments}
                onAppointmentClick={handleAppointmentClick}
                onAppointmentEdit={handleAppointmentEdit}
                onAppointmentDelete={handleAppointmentDelete}
                onTimeSlotClick={handleTimeSlotClick}
                onAppointmentReschedule={handleAppointmentReschedule}
              />
            </div>
          )}

          {view === 'agenda' && (
            <CalendarAgendaView
              appointments={appointments}
              onAppointmentClick={handleAppointmentClick}
              onAppointmentEdit={handleAppointmentEdit}
              onAppointmentDelete={handleAppointmentDelete}
            />
          )}
        </div>
      )}

      {/* Quick stats footer */}
      {!isLoading && !error && (
        <div className="flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-lg font-semibold text-gray-900">{appointments.length}</p>
            </div>
            <div className="h-10 w-px bg-gray-200" />
            <div>
              <p className="text-xs text-gray-500">À venir</p>
              <p className="text-lg font-semibold text-blue-600">
                {appointments.filter((a) => a.is_upcoming).length}
              </p>
            </div>
            <div className="h-10 w-px bg-gray-200" />
            <div>
              <p className="text-xs text-gray-500">Terminés</p>
              <p className="text-lg font-semibold text-green-600">
                {appointments.filter((a) => a.status === 'completed').length}
              </p>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Dernière mise à jour : {format(new Date(), 'HH:mm')}
          </div>
        </div>
      )}

      {/* Modals */}
      <AppointmentCreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        initialDate={createModalDate}
        initialHour={createModalHour}
      />

      <AppointmentDetailsModal
        appointment={selectedAppointment}
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false)
          setSelectedAppointment(null)
        }}
      />

      {/* Filters Panel */}
      <CalendarFiltersPanel
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={setFilters}
      />
    </div>
  )
}
