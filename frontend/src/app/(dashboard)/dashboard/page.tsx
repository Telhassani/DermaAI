'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import {
  Users,
  Calendar,
  Microscope,
  FileText,
  TrendingUp,
  Clock,
  Activity,
  AlertCircle
} from 'lucide-react'

export default function DashboardPage() {
  const { user, refetchUser } = useAuth()
  const router = useRouter()

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
    }
  }, [user, router, refetchUser])

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-violet-600 border-r-transparent"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenue, {user.full_name} 👋
        </h1>
        <p className="mt-2 text-gray-600">
          Voici un aperçu de votre activité aujourd'hui
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1 */}
        <div className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Patients total</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
              <p className="mt-2 flex items-center text-sm text-green-600">
                <TrendingUp className="mr-1 h-4 w-4" />
                <span>+0% ce mois</span>
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-violet-100 text-violet-600 transition-colors group-hover:bg-violet-200">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rendez-vous aujourd'hui</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
              <p className="mt-2 flex items-center text-sm text-gray-500">
                <Clock className="mr-1 h-4 w-4" />
                <span>0 en attente</span>
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600 transition-colors group-hover:bg-green-200">
              <Calendar className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Analyses IA</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
              <p className="mt-2 flex items-center text-sm text-purple-600">
                <Activity className="mr-1 h-4 w-4" />
                <span>0 ce mois</span>
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600 transition-colors group-hover:bg-purple-200">
              <Microscope className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Card 4 */}
        <div className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ordonnances</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
              <p className="mt-2 flex items-center text-sm text-orange-600">
                <TrendingUp className="mr-1 h-4 w-4" />
                <span>+0% ce mois</span>
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-100 text-orange-600 transition-colors group-hover:bg-orange-200">
              <FileText className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Actions */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Actions rapides</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <button className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 text-left transition-all hover:border-violet-300 hover:bg-violet-50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Nouveau patient</p>
                  <p className="text-sm text-gray-500">Ajouter un patient</p>
                </div>
              </button>

              <button className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 text-left transition-all hover:border-green-300 hover:bg-green-50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-600">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Rendez-vous</p>
                  <p className="text-sm text-gray-500">Planifier</p>
                </div>
              </button>

              <button className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 text-left transition-all hover:border-purple-300 hover:bg-purple-50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                  <Microscope className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Analyse IA</p>
                  <p className="text-sm text-gray-500">Analyser une image</p>
                </div>
              </button>

              <button className="flex items-center gap-4 rounded-lg border border-gray-200 p-4 text-left transition-all hover:border-orange-300 hover:bg-orange-50">
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

          {/* Recent Activity */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Activité récente</h2>
            <div className="text-center py-12">
              <Activity className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm text-gray-500">Aucune activité récente</p>
            </div>
          </div>
        </div>

        {/* Right column - 1/3 width */}
        <div className="space-y-6">
          {/* Upcoming appointments */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Prochains rendez-vous</h2>
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm text-gray-500">Aucun rendez-vous programmé</p>
            </div>
          </div>

          {/* Alerts */}
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-orange-900">Phase de développement</h3>
                <p className="mt-1 text-sm text-orange-700">
                  Cette application est en cours de développement. Les fonctionnalités seront ajoutées progressivement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
