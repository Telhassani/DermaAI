'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
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
  Loader2,
  Plus,
  ArrowRight,
  Activity,
  BarChart3
} from 'lucide-react'
import { api } from '@/lib/api/client'
import { DashboardData } from '@/types/analytics'
import SimpleBarChart from '@/components/dashboard/SimpleBarChart'
import SimpleLineChart from '@/components/dashboard/SimpleLineChart'
import RecentActivityFeed from '@/components/dashboard/RecentActivityFeed'
import { Button, ElevatedCard, BentoCard, Badge, GlassCard } from '@/components/ui/modern'
import { toast } from 'sonner'
import { cn } from '@/lib/theme'

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
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-accent-600" />
          <p className="text-mono-600">Chargement du dashboard...</p>
        </motion.div>
      </div>
    )
  }

  const stats = dashboardData?.global_stats

  return (
    <div className="space-y-8">
      {/* Hero Section avec gradient */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'relative overflow-hidden rounded-3xl',
          'bg-gradient-to-br from-mono-900 via-mono-800 to-mono-900',
          'p-8 md:p-12'
        )}
      >
        {/* Background effects */}
        <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-accent-500/20 blur-3xl animate-blob" />
        <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-accent-600/10 blur-3xl animate-blob animation-delay-2000" />

        <div className="relative z-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            Bienvenue, Dr. {user.full_name} 👋
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-mono-300 mb-8"
          >
            Voici un aperçu de votre activité
            {stats && ` • ${stats.period.days} derniers jours`}
          </motion.p>

          {/* Quick stats in hero */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Patients', value: stats?.active_patients || 0, icon: Users },
              { label: 'Consultations', value: stats?.total_consultations || 0, icon: Stethoscope },
              { label: 'Rendez-vous', value: stats?.upcoming_appointments || 0, icon: Calendar },
              { label: 'Ordonnances', value: stats?.total_prescriptions || 0, icon: FileText },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
              >
                <GlassCard
                  variant="dark"
                  padding="md"
                  className="group hover:bg-white/20 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="rounded-lg bg-white/10 p-2 group-hover:bg-white/20 transition-colors">
                      <stat.icon className="h-5 w-5 text-accent-300" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                  <p className="text-sm text-mono-300">{stat.label}</p>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              variant="accent"
              leftIcon={<Plus className="h-5 w-5" />}
              onClick={() => router.push('/dashboard/patients/new')}
            >
              Nouveau patient
            </Button>
            <Button
              variant="outline"
              leftIcon={<Calendar className="h-5 w-5" />}
              onClick={() => router.push('/dashboard/appointments/new')}
            >
              Planifier RDV
            </Button>
            <Button
              variant="ghost"
              rightIcon={<ArrowRight className="h-5 w-5" />}
              onClick={() => router.push('/dashboard/consultations/new')}
            >
              Nouvelle consultation
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Bento Grid - Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Appointment Rates */}
        {dashboardData?.appointment_stats && (
          <>
            <ElevatedCard hover padding="lg" className="group">
              <div className="flex items-center justify-between mb-4">
                <div className="rounded-xl bg-success-50 p-3 group-hover:scale-110 transition-transform">
                  <CalendarCheck className="h-6 w-6 text-success" />
                </div>
                <Badge variant="solidSuccess" size="sm">
                  Excellent
                </Badge>
              </div>
              <p className="text-sm font-medium text-mono-600 mb-2">Taux de complétion</p>
              <p className="text-4xl font-bold text-success mb-1">
                {dashboardData.appointment_stats.completion_rate.toFixed(1)}%
              </p>
              <p className="text-xs text-mono-500">
                {dashboardData.appointment_stats.by_status.completed || 0} rendez-vous complétés
              </p>
            </ElevatedCard>

            <ElevatedCard hover padding="lg" className="group">
              <div className="flex items-center justify-between mb-4">
                <div className="rounded-xl bg-warning-50 p-3 group-hover:scale-110 transition-transform">
                  <AlertCircle className="h-6 w-6 text-warning" />
                </div>
                <Badge variant="solidWarning" size="sm">
                  Attention
                </Badge>
              </div>
              <p className="text-sm font-medium text-mono-600 mb-2">Taux d'annulation</p>
              <p className="text-4xl font-bold text-warning mb-1">
                {dashboardData.appointment_stats.cancellation_rate.toFixed(1)}%
              </p>
              <p className="text-xs text-mono-500">
                {dashboardData.appointment_stats.by_status.cancelled || 0} annulations
              </p>
            </ElevatedCard>

            <ElevatedCard hover padding="lg" className="group">
              <div className="flex items-center justify-between mb-4">
                <div className="rounded-xl bg-danger-50 p-3 group-hover:scale-110 transition-transform">
                  <Clock className="h-6 w-6 text-danger" />
                </div>
                <Badge variant="solidDanger" size="sm">
                  À réduire
                </Badge>
              </div>
              <p className="text-sm font-medium text-mono-600 mb-2">Taux d'absence</p>
              <p className="text-4xl font-bold text-danger mb-1">
                {dashboardData.appointment_stats.no_show_rate.toFixed(1)}%
              </p>
              <p className="text-xs text-mono-500">
                {dashboardData.appointment_stats.by_status.no_show || 0} absences
              </p>
            </ElevatedCard>
          </>
        )}
      </motion.div>

      {/* Bento Grid - Charts */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Timeline Chart */}
        <BentoCard
          size="md"
          icon={<Activity className="h-8 w-8 text-accent-600" />}
        >
          <h3 className="text-xl font-semibold text-mono-900 mb-4">
            Évolution des consultations
          </h3>
          <SimpleLineChart
            title=""
            data={
              dashboardData?.consultation_timeline.map((item) => ({
                label: item.date,
                value: item.count,
              })) || []
            }
            color="#10b981"
          />
        </BentoCard>

        {/* Top Diagnoses */}
        <BentoCard
          size="md"
          icon={<BarChart3 className="h-8 w-8 text-accent-600" />}
        >
          <h3 className="text-xl font-semibold text-mono-900 mb-4">
            Top diagnostics
          </h3>
          <SimpleBarChart
            title=""
            data={
              dashboardData?.top_diagnoses.slice(0, 5).map((item) => ({
                label: item.diagnosis.length > 20 ? item.diagnosis.substring(0, 20) + '...' : item.diagnosis,
                value: item.count,
              })) || []
            }
            showValues
          />
        </BentoCard>
      </motion.div>

      {/* Activity Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <ElevatedCard padding="none">
          <div className="p-6 border-b border-mono-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-mono-900">Activité récente</h3>
                <p className="text-sm text-mono-500 mt-1">Dernières actions sur votre compte</p>
              </div>
              <Badge variant="primary" size="md">
                {dashboardData?.recent_activity.length || 0} activités
              </Badge>
            </div>
          </div>
          <div className="p-6">
            {dashboardData?.recent_activity && dashboardData.recent_activity.length > 0 ? (
              <RecentActivityFeed activities={dashboardData.recent_activity} />
            ) : (
              <div className="text-center py-12">
                <Activity className="mx-auto h-12 w-12 text-mono-300 mb-4" />
                <p className="text-sm text-mono-500">Aucune activité récente</p>
              </div>
            )}
          </div>
        </ElevatedCard>
      </motion.div>

      {/* Stats by Status (if data available) */}
      {dashboardData?.appointment_stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <ElevatedCard padding="lg">
            <h3 className="text-xl font-semibold text-mono-900 mb-6">
              Répartition des rendez-vous
            </h3>
            <SimpleBarChart
              title=""
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
          </ElevatedCard>
        </motion.div>
      )}

      {/* Period Info Badge */}
      {stats && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex justify-center"
        >
          <GlassCard variant="colored" padding="md" hover={false}>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-accent-600" />
              <div>
                <p className="text-sm font-medium text-mono-900">Période d'analyse</p>
                <p className="text-xs text-mono-600">
                  Du {new Date(stats.period.start_date).toLocaleDateString('fr-FR')} au{' '}
                  {new Date(stats.period.end_date).toLocaleDateString('fr-FR')} • {stats.period.days} jours
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}
    </div>
  )
}
