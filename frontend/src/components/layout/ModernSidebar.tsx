/**
 * Modern Sidebar Component
 * Collapsible sidebar with glass morphism and smooth animations
 */

'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home,
  Users,
  Calendar,
  Stethoscope,
  FileText,
  BarChart3,
  Settings,
  ChevronLeft,
  LogOut,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/theme'
import { Avatar } from '@/components/ui/modern'

interface MenuItem {
  icon: LucideIcon
  label: string
  path: string
  badge?: number
}

const menuItems: MenuItem[] = [
  { icon: Home, label: 'Dashboard', path: '/dashboard' },
  { icon: Users, label: 'Patients', path: '/dashboard/patients' },
  { icon: Calendar, label: 'Rendez-vous', path: '/dashboard/appointments' },
  { icon: Stethoscope, label: 'Consultations', path: '/dashboard/consultations' },
  { icon: FileText, label: 'Ordonnances', path: '/dashboard/prescriptions' },
  { icon: BarChart3, label: 'Analytics', path: '/dashboard/analytics' },
  { icon: Settings, label: 'Paramètres', path: '/dashboard/settings' },
]

interface ModernSidebarProps {
  user?: {
    full_name: string
    email: string
  }
  onLogout?: () => void
}

export default function ModernSidebar({ user, onLogout }: ModernSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'fixed left-0 top-0 z-50 h-screen',
        'bg-gradient-to-b from-mono-900 to-mono-950',
        'border-r border-mono-800/50',
        'backdrop-blur-xl bg-opacity-95'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo Section */}
        <div className="flex h-16 items-center justify-between border-b border-mono-800/50 px-6">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex items-center space-x-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-accent-600 shadow-glow">
                  <Stethoscope className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">DermaAI</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              'rounded-lg p-2 text-mono-400 transition-colors',
              'hover:bg-mono-800 hover:text-white',
              isCollapsed && 'mx-auto'
            )}
          >
            <ChevronLeft
              className={cn(
                'h-5 w-5 transition-transform duration-300',
                isCollapsed && 'rotate-180'
              )}
            />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {menuItems.map((item) => (
            <SidebarItem
              key={item.path}
              item={item}
              isCollapsed={isCollapsed}
              isActive={pathname === item.path || pathname?.startsWith(item.path + '/')}
            />
          ))}
        </nav>

        {/* User Section */}
        <div className="border-t border-mono-800/50 p-4">
          <div
            className={cn(
              'flex items-center gap-3 rounded-xl p-3',
              'bg-mono-800/30 transition-colors',
              'hover:bg-mono-800/50',
              isCollapsed && 'justify-center'
            )}
          >
            <Avatar
              name={user?.full_name || 'User'}
              size={isCollapsed ? 'md' : 'lg'}
              variant="ring"
              status="online"
              showStatus
            />

            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="flex-1 overflow-hidden"
                >
                  <p className="truncate text-sm font-medium text-white">
                    {user?.full_name || 'User'}
                  </p>
                  <p className="truncate text-xs text-mono-400">
                    {user?.email || 'email@example.com'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {!isCollapsed && (
              <button
                onClick={onLogout}
                className="rounded-lg p-2 text-mono-400 transition-colors hover:bg-mono-700 hover:text-danger"
                title="Se déconnecter"
              >
                <LogOut className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.aside>
  )
}

interface SidebarItemProps {
  item: MenuItem
  isCollapsed: boolean
  isActive: boolean
}

function SidebarItem({ item, isCollapsed, isActive }: SidebarItemProps) {
  const Icon = item.icon

  return (
    <Link
      href={item.path}
      className={cn(
        'group relative flex items-center gap-3 rounded-xl px-4 py-3',
        'text-mono-300 transition-all duration-200',
        'hover:text-white',
        isActive && 'bg-mono-800/50 text-white shadow-inner-soft',
        !isActive && 'hover:bg-mono-800/30',
        isCollapsed && 'justify-center px-0'
      )}
    >
      {/* Icon avec effet glow au hover */}
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg',
          'transition-all duration-200',
          isActive &&
            'bg-gradient-to-br from-accent-500/20 to-accent-600/20 text-accent-400',
          !isActive && 'group-hover:bg-mono-700/50'
        )}
      >
        <Icon className="h-5 w-5" />
      </div>

      {/* Label */}
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="font-medium"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Badge */}
      {!isCollapsed && item.badge && (
        <span className="ml-auto rounded-full bg-accent-500 px-2 py-0.5 text-xs font-semibold text-white">
          {item.badge}
        </span>
      )}

      {/* Active Indicator */}
      {isActive && (
        <motion.div
          layoutId="sidebar-active-indicator"
          className="absolute right-0 h-8 w-1 rounded-l-full bg-gradient-to-b from-accent-400 to-accent-600"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}

      {/* Tooltip pour collapsed state */}
      {isCollapsed && (
        <div
          className={cn(
            'absolute left-full ml-2 whitespace-nowrap rounded-lg px-3 py-2',
            'bg-mono-800 text-sm text-white shadow-soft-lg',
            'pointer-events-none opacity-0 transition-opacity',
            'group-hover:opacity-100'
          )}
        >
          {item.label}
          {item.badge && (
            <span className="ml-2 rounded-full bg-accent-500 px-2 py-0.5 text-xs">
              {item.badge}
            </span>
          )}
        </div>
      )}
    </Link>
  )
}
