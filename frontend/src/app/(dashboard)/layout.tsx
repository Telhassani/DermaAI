'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ModernSidebar, ModernHeader, MobileNav } from '@/components/layout'
import { useAuth } from '@/lib/hooks/use-auth'
import { Plus, Calendar, Users } from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const handleLogout = () => {
    logout()
    router.push('/auth/login')
  }

  const quickActions = [
    {
      icon: Plus,
      label: 'Nouveau patient',
      onClick: () => router.push('/dashboard/patients/new'),
    },
    {
      icon: Calendar,
      label: 'Rendez-vous',
      onClick: () => router.push('/dashboard/appointments/new'),
    },
  ]

  return (
    <div className="min-h-screen bg-mono-50">
      {/* Sidebar Desktop */}
      <div className="hidden md:block">
        <ModernSidebar user={user} onLogout={handleLogout} />
      </div>

      {/* Header */}
      <div
        className="transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? '80px' : '280px' }}
      >
        <ModernHeader
          user={user}
          quickActions={quickActions}
          notificationsCount={3}
          onSearch={(query) => console.log('Search:', query)}
        />

        {/* Main content */}
        <main className="min-h-[calc(100vh-4rem)] p-6 md:p-8">
          {/* Background decorative elements */}
          <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
            <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-accent-200 opacity-20 blur-3xl" />
            <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-mono-200 opacity-30 blur-3xl" />
          </div>

          {/* Content */}
          {children}
        </main>
      </div>

      {/* Mobile Navigation */}
      <MobileNav />

      {/* Mobile padding bottom */}
      <div className="h-20 md:hidden" />
    </div>
  )
}
