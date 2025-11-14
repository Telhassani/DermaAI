/**
 * Modern Header Component
 * Glass morphism header with search and notifications
 */

'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Bell,
  Settings,
  Plus,
  Command,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/theme'
import { Button, Badge, Avatar, ThemeToggle } from '@/components/ui/modern'

interface QuickAction {
  icon: LucideIcon
  label: string
  onClick: () => void
}

interface ModernHeaderProps {
  onSearch?: (query: string) => void
  quickActions?: QuickAction[]
  user?: {
    full_name: string
    email: string
  }
  notificationsCount?: number
}

export default function ModernHeader({
  onSearch,
  quickActions = [],
  user,
  notificationsCount = 0,
}: ModernHeaderProps) {
  const [searchFocused, setSearchFocused] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(searchQuery)
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-40',
        'h-16 border-b border-mono-200/50',
        // Glass morphism
        'bg-white/80 backdrop-blur-xl',
        // Shadow
        'shadow-[0_1px_3px_0_rgba(0,0,0,0.04)]'
      )}
    >
      <div className="flex h-full items-center justify-between gap-4 px-6">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <form onSubmit={handleSearch}>
            <div
              className={cn(
                'relative flex items-center rounded-xl border-2 transition-all duration-200',
                searchFocused
                  ? 'border-accent-500 shadow-glow'
                  : 'border-mono-200 bg-mono-50/50'
              )}
            >
              <Search
                className={cn(
                  'ml-4 h-5 w-5 transition-colors',
                  searchFocused ? 'text-accent-600' : 'text-mono-400'
                )}
              />
              <input
                type="search"
                placeholder="Rechercher patients, consultations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className={cn(
                  'w-full bg-transparent px-4 py-2.5 text-sm outline-none',
                  'placeholder:text-mono-400'
                )}
              />
              <kbd
                className={cn(
                  'mr-3 hidden rounded-md px-2 py-1 text-xs font-mono',
                  'bg-mono-100 text-mono-500',
                  'sm:inline-block'
                )}
              >
                <Command className="inline h-3 w-3" />K
              </kbd>
            </div>
          </form>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Quick Actions */}
          {quickActions.length > 0 && (
            <div className="hidden items-center gap-2 lg:flex">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  leftIcon={<action.icon className="h-4 w-4" />}
                  onClick={action.onClick}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={cn(
                'relative rounded-xl p-2.5 transition-colors',
                'hover:bg-mono-100',
                showNotifications && 'bg-mono-100'
              )}
            >
              <Bell className="h-5 w-5 text-mono-600" />
              {notificationsCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-xs font-semibold text-white">
                  {notificationsCount > 9 ? '9+' : notificationsCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    'absolute right-0 top-full mt-2 w-80',
                    'rounded-2xl border border-mono-200 bg-white shadow-soft-lg',
                    'overflow-hidden'
                  )}
                >
                  <div className="border-b border-mono-200 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-mono-900">Notifications</h3>
                      <Badge variant="primary" size="sm">
                        {notificationsCount}
                      </Badge>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto p-2">
                    {notificationsCount === 0 ? (
                      <div className="py-8 text-center">
                        <Bell className="mx-auto mb-2 h-8 w-8 text-mono-300" />
                        <p className="text-sm text-mono-500">Aucune notification</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {/* Placeholder notifications */}
                        <NotificationItem
                          title="Nouveau rendez-vous"
                          description="Marie Dupont - 14:00"
                          time="Il y a 5 min"
                          unread
                        />
                        <NotificationItem
                          title="Rappel consultation"
                          description="Jean Martin demain à 10:00"
                          time="Il y a 1h"
                        />
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Theme Toggle */}
          <ThemeToggle variant="icon" />

          {/* Settings */}
          <button
            className={cn(
              'rounded-xl p-2.5 transition-colors',
              'hover:bg-mono-100 dark:hover:bg-mono-700'
            )}
          >
            <Settings className="h-5 w-5 text-mono-600 dark:text-mono-300" />
          </button>

          {/* User Avatar */}
          {user && (
            <button className="flex items-center gap-3 rounded-xl p-1 transition-colors hover:bg-mono-100">
              <Avatar
                name={user.full_name}
                size="md"
                variant="ring"
                status="online"
                showStatus
              />
              <div className="hidden text-left lg:block">
                <p className="text-sm font-medium text-mono-900">{user.full_name}</p>
                <p className="text-xs text-mono-500">En ligne</p>
              </div>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

interface NotificationItemProps {
  title: string
  description: string
  time: string
  unread?: boolean
}

function NotificationItem({ title, description, time, unread }: NotificationItemProps) {
  return (
    <button
      className={cn(
        'w-full rounded-lg p-3 text-left transition-colors',
        'hover:bg-mono-50',
        unread && 'bg-accent-50/50'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-mono-900">{title}</p>
            {unread && (
              <span className="h-2 w-2 rounded-full bg-accent-500" />
            )}
          </div>
          <p className="mt-1 text-xs text-mono-600">{description}</p>
        </div>
        <span className="text-xs text-mono-400">{time}</span>
      </div>
    </button>
  )
}
