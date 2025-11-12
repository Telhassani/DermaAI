'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  Calendar,
  Microscope,
  FileText,
  Settings,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  Brain,
  BarChart3,
  Pill,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  className?: string
  collapsed: boolean
  onToggle: () => void
}

const menuItems = [
  {
    title: 'Vue d\'ensemble',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', badge: null },
      { icon: BarChart3, label: 'Statistiques', href: '/dashboard/stats', badge: null },
    ],
  },
  {
    title: 'Gestion',
    items: [
      { icon: Users, label: 'Patients', href: '/dashboard/patients', badge: null },
      { icon: FileText, label: 'Consultations', href: '/dashboard/consultations', badge: null },
      { icon: Calendar, label: 'Rendez-vous', href: '/dashboard/appointments', badge: '3' },
      { icon: Pill, label: 'Ordonnances', href: '/dashboard/prescriptions', badge: null },
    ],
  },
  {
    title: 'IA & Analyse',
    items: [
      { icon: Brain, label: 'Analyse IA', href: '/dashboard/ai-analysis', badge: 'BETA' },
      { icon: Microscope, label: 'Images', href: '/dashboard/images', badge: null },
    ],
  },
  {
    title: 'Paramètres',
    items: [
      { icon: Settings, label: 'Réglages', href: '/dashboard/settings', badge: null },
      { icon: CreditCard, label: 'Facturation', href: '/dashboard/billing', badge: null },
    ],
  },
]

export function Sidebar({ className, collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-gray-200 bg-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">
              Derm<span className="text-violet-600">AI</span>
            </span>
          </Link>
        )}
        {collapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600">
            <Stethoscope className="h-5 w-5 text-white" />
          </div>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white shadow-md hover:bg-gray-50 transition-colors"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4 text-gray-600" />
        ) : (
          <ChevronLeft className="h-4 w-4 text-gray-600" />
        )}
      </button>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          {menuItems.map((section, sectionIdx) => (
            <div key={sectionIdx}>
              {!collapsed && (
                <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {section.title}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                        isActive
                          ? 'bg-violet-50 text-violet-700'
                          : 'text-gray-700 hover:bg-violet-50 hover:text-gray-900 group-hover:text-violet-600',
                        collapsed && 'justify-center'
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <Icon
                        className={cn(
                          'h-5 w-5 flex-shrink-0',
                          isActive ? 'text-violet-600' : 'text-gray-400 group-hover:text-violet-600'
                        )}
                      />
                      {!collapsed && (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {item.badge && (
                            <span
                              className={cn(
                                'rounded-full px-2 py-0.5 text-xs font-semibold',
                                item.badge === 'BETA'
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-blue-100 text-blue-700'
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* User section - will be added later */}
    </aside>
  )
}
