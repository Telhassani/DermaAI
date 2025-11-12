'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { AuthGuard } from '@/components/auth/AuthGuard'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Sidebar
          className=""
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
        <Header sidebarCollapsed={sidebarCollapsed} />

        {/* Main content */}
        <main
          className="transition-all duration-300 pt-16"
          style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}
        >
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  )
}
