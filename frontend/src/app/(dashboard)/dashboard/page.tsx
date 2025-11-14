'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import {
  Users,
  Calendar,
  FileText,
  TrendingUp,
  Clock,
  Stethoscope,
  CalendarCheck,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { api } from '@/lib/api/client'
import { DashboardData } from '@/types/analytics'
import StatCard from '@/components/dashboard/StatCard'
import SimpleBarChart from '@/components/dashboard/SimpleBarChart'
import SimpleLineChart from '@/components/dashboard/SimpleLineChart'
import RecentActivityFeed from '@/components/dashboard/RecentActivityFeed'
import { toast } from 'sonner'

export default function DashboardPage() {
  const { user, refetchUser } = useAuth()
  const router = useRouter()

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('access_token')
    if (!token) {
      router.push('/login')
      return
    }

    // Fetch user data if not loaded
    if (!user) {
      refetchUser()
    } else {
      fetchDashboardData()
    }
  }, [user, router, refetchUser])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const response = await api.analytics.dashboard()
      setDashboardData(response.data)
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Erreur lors du chargement des statistiques')
    } finally {
      setLoading(false)
    }
  }

  if (!user || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-blue-600" />
          <p className="text-gray-600">Chargement du dashboard...</p>
        </div>
      </div>
    )
  }

  const stats = dashboardData?.global_stats

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenue, {user.full_name} 👋
        </h1>
        <p className="mt-2 text-gray-600">
          Voici un aperçu de votre activité
          {stats && ` (${stats.period.days} derniers jours)`}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Patients actifs"
          value={stats?.active_patients || 0}
          icon={Users}
          description="Total patients"
          color="blue"
        />

        <StatCard
          title="Consultations"
          value={stats?.total_consultations || 0}
          icon={Stethoscope}
          description={`${stats?.consultations_this_month || 0} ce mois`}
          color="green"
        />

        <StatCard
          title="Rendez-vous à venir"
          value={stats?.upcoming_appointments || 0}
          icon={Calendar}
          description="7 prochains jours"
          color="purple"
        />

        <StatCard
          title="Ordonnances"
          value={stats?.total_prescriptions || 0}
          icon={FileText}
          description="Période sélectionnée"
          color="orange"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Consultation Timeline */}
        <SimpleLineChart
          title="Évolution des consultations"
          data={
            dashboardData?.consultation_timeline.map((item) => ({
              label: item.date,
              value: item.count,
            })) || []
          }
          color="#10b981"
        />

        {/* Top Diagnoses */}
        <SimpleBarChart
          title="Top diagnostics"
          data={
            dashboardData?.top_diagnoses.map((item) => ({
              label: item.diagnosis,
              value: item.count,
            })) || []
          }
          showValues
        />
      </div>

      {/* Appointment Stats */}
      {dashboardData?.appointment_stats && (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taux de complétion</p>
                <p className="mt-2 text-3xl font-bold text-green-600">
                  {dashboardData.appointment_stats.completion_rate.toFixed(1)}%
                </p>
              </div>
              <div className="rounded-lg bg-green-50 p-3">
                <CalendarCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taux d'annulation</p>
                <p className="mt-2 text-3xl font-bold text-orange-600">
                  {dashboardData.appointment_stats.cancellation_rate.toFixed(1)}%
                </p>
              </div>
              <div className="rounded-lg bg-orange-50 p-3">
                <AlertCircle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Taux d'absence</p>
                <p className="mt-2 text-3xl font-bold text-red-600">
                  {dashboardData.appointment_stats.no_show_rate.toFixed(1)}%
                </p>
              </div>
              <div className="rounded-lg bg-red-50 p-3">
                <Clock className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - 2/3 width */}
        <div className="space-y-6 lg:col-span-2">
          {/* Quick Actions */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Actions rapides</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <button
                onClick={() => router.push('/dashboard/patients/new')}
                className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 text-left transition-all hover:border-blue-300 hover:bg-blue-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Nouveau patient</p>
                  <p className="text-sm text-gray-500">Ajouter un patient</p>
                </div>
              </button>

              <button
                onClick={() => router.push('/dashboard/appointments/new')}
                className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 text-left transition-all hover:border-green-300 hover:bg-green-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Rendez-vous</p>
                  <p className="text-sm text-gray-500">Planifier</p>
                </div>
              </button>

              <button
                onClick={() => router.push('/dashboard/consultations/new')}
                className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 text-left transition-all hover:border-purple-300 hover:bg-purple-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Consultation</p>
                  <p className="text-sm text-gray-500">Nouvelle consultation</p>
                </div>
              </button>

              <button
                onClick={() => router.push('/dashboard/prescriptions/new')}
                className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 text-left transition-all hover:border-orange-300 hover:bg-orange-50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Ordonnance</p>
                  <p className="text-sm text-gray-500">Créer</p>
                </div>
              </button>
            </div>
          </div>

          {/* Appointment Status Breakdown */}
          {dashboardData?.appointment_stats && (
            <SimpleBarChart
              title="Rendez-vous par statut"
              data={Object.entries(dashboardData.appointment_stats.by_status).map(
                ([status, count]) => ({
                  label:
                    status === 'scheduled'
                      ? 'Planifié'
                      : status === 'confirmed'
                      ? 'Confirmé'
                      : status === 'completed'
                      ? 'Complété'
                      : status === 'cancelled'
                      ? 'Annulé'
                      : status === 'no_show'
                      ? 'Absence'
                      : status,
                  value: count,
                })
              )}
              showValues
            />
          )}
        </div>

        {/* Right column - 1/3 width */}
        <div className="space-y-6">
          {/* Recent Activity */}
          {dashboardData?.recent_activity && (
            <RecentActivityFeed activities={dashboardData.recent_activity} />
          )}

          {/* Period Info */}
          {stats && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <TrendingUp className="mt-0.5 h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-blue-900">Période d'analyse</h3>
                  <p className="mt-1 text-sm text-blue-700">
                    Du {new Date(stats.period.start_date).toLocaleDateString('fr-FR')} au{' '}
                    {new Date(stats.period.end_date).toLocaleDateString('fr-FR')}
                  </p>
                  <p className="mt-1 text-sm text-blue-700">
                    {stats.period.days} jours de données
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
