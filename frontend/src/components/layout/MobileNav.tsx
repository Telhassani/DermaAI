/**
 * Mobile Navigation Component
 * Bottom tab bar for mobile devices
 */

'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Home,
  Users,
  Calendar,
  Stethoscope,
  Menu,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/theme'

interface NavItem {
  icon: LucideIcon
  label: string
  path: string
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Accueil', path: '/dashboard' },
  { icon: Users, label: 'Patients', path: '/dashboard/patients' },
  { icon: Calendar, label: 'RDV', path: '/dashboard/appointments' },
  { icon: Stethoscope, label: 'Consulter', path: '/dashboard/consultations' },
  { icon: Menu, label: 'Menu', path: '/dashboard/menu' },
]

export default function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'md:hidden', // Seulement mobile
        // Glass morphism
        'bg-white/80 backdrop-blur-xl',
        'border-t border-mono-200/50',
        // Safe area (iPhone notch)
        'pb-safe',
        'shadow-[0_-1px_3px_0_rgba(0,0,0,0.04)]'
      )}
    >
      <div className="grid grid-cols-5 gap-1 px-2 py-2">
        {navItems.map((item) => (
          <MobileNavItem
            key={item.path}
            item={item}
            isActive={
              pathname === item.path ||
              (item.path !== '/dashboard' && pathname?.startsWith(item.path + '/'))
            }
          />
        ))}
      </div>
    </nav>
  )
}

interface MobileNavItemProps {
  item: NavItem
  isActive: boolean
}

function MobileNavItem({ item, isActive }: MobileNavItemProps) {
  const Icon = item.icon

  return (
    <Link
      href={item.path}
      className={cn(
        'relative flex flex-col items-center justify-center gap-1 rounded-xl p-2',
        'transition-all duration-200',
        'active:scale-95',
        isActive && 'bg-accent-500/10 text-accent-600',
        !isActive && 'text-mono-500 hover:text-mono-700'
      )}
    >
      {/* Icon avec animation */}
      <div className="relative">
        <Icon
          className={cn(
            'h-6 w-6 transition-transform',
            isActive && 'animate-bounce-subtle'
          )}
        />

        {/* Active indicator (top bar) */}
        {isActive && (
          <motion.div
            layoutId="mobile-nav-active"
            className="absolute -top-3 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-gradient-to-r from-accent-500 to-accent-600"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}
      </div>

      {/* Label */}
      <span
        className={cn(
          'text-xs font-medium transition-colors',
          isActive && 'font-semibold'
        )}
      >
        {item.label}
      </span>
    </Link>
  )
}
