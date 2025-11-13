'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { CalendarToolbar, CalendarView } from '@/components/calendar/calendar-toolbar'
import { CalendarGrid } from '@/components/calendar/calendar-grid'
import { CalendarWeekView } from '@/components/calendar/calendar-week-view'
import { CalendarDayView } from '@/components/calendar/calendar-day-view'
import { CalendarAgendaView } from '@/components/calendar/calendar-agenda-view'
import {
  useAppointments,
  useDeleteAppointment,
  Appointment,
} from '@/lib/hooks/use-appointments'
import { toast } from 'sonner'

export default function CalendarPage() {
  // State management
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>('month')
  const [showFilters, setShowFilters] = useState(false)

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
        const weekStart = new Date(currentDate)
        weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1)
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

  // Delete mutation
  const deleteMutation = useDeleteAppointment()

  // Handlers
  const handleDateChange = (date: Date) => {
    setCurrentDate(date)
  }

  const handleViewChange = (newView: CalendarView) => {
    setView(newView)
  }

  const handleCreateAppointment = () => {
    // TODO: Open create appointment modal
    toast.info('Fonctionnalité de création en développement (Phase 3)')
  }

  const handleAppointmentClick = (appointment: Appointment) => {
    // TODO: Open appointment details modal
    toast.info(`Rendez-vous #${appointment.id} - Détails à venir (Phase 3)`)
  }

  const handleAppointmentEdit = (appointment: Appointment) => {
    // TODO: Open edit appointment modal
    toast.info(`Édition du rendez-vous #${appointment.id} à venir (Phase 3)`)
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
    // TODO: Open create appointment modal with pre-filled date and time
    toast.info(`Créer un rendez-vous le ${format(date, 'dd/MM/yyyy')} à ${hour}:00`)
  }

  // Get appointments from data
  const appointments = appointmentsData?.appointments || []

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
              <CalendarWeekView
                currentDate={currentDate}
                appointments={appointments}
                onAppointmentClick={handleAppointmentClick}
                onTimeSlotClick={handleTimeSlotClick}
              />
            </div>
          )}

          {view === 'day' && (
            <div style={{ height: 'calc(100vh - 300px)' }}>
              <CalendarDayView
                currentDate={currentDate}
                appointments={appointments}
                onAppointmentClick={handleAppointmentClick}
                onAppointmentEdit={handleAppointmentEdit}
                onAppointmentDelete={handleAppointmentDelete}
                onTimeSlotClick={handleTimeSlotClick}
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
    </div>
  )
}
