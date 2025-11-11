'use client'

import { useState } from 'react'
import { Bell, Search, User, LogOut, Settings, HelpCircle } from 'lucide-react'
import { useAuth } from '@/lib/hooks/use-auth'
import { useKeyboardShortcut, isMacOS } from '@/lib/hooks/use-keyboard-shortcut'
import { SearchModal } from '@/components/search/search-modal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface HeaderProps {
  sidebarCollapsed: boolean
}

export function Header({ sidebarCollapsed }: HeaderProps) {
  const { user, logout } = useAuth()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const isMac = typeof window !== 'undefined' && isMacOS()

  // Cmd+K or Ctrl+K to open search
  useKeyboardShortcut(
    [
      { key: 'k', metaKey: true }, // Mac
      { key: 'k', ctrlKey: true }, // Windows/Linux
    ],
    () => setIsSearchOpen(true)
  )

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header
      className="fixed top-0 right-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 transition-all duration-300"
      style={{ left: sidebarCollapsed ? '4rem' : '16rem' }}
    >
      {/* Search button */}
      <div className="flex flex-1 items-center gap-4">
        <button
          onClick={() => setIsSearchOpen(true)}
          className="group flex w-full max-w-md items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-2 text-sm text-slate-600 transition-all hover:border-slate-300 hover:bg-white hover:shadow-sm"
        >
          <Search className="h-4 w-4 text-slate-400" />
          <span>Rechercher...</span>
          <kbd className="ml-auto hidden rounded border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-500 shadow-sm sm:inline-block">
            {isMac ? '⌘K' : 'Ctrl+K'}
          </kbd>
        </button>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Help button */}
        <Button variant="ghost" size="icon" className="relative">
          <HelpCircle className="h-5 w-5 text-gray-600" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-gray-600" />
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
          </span>
        </Button>

        {/* User menu */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 px-2 hover:bg-gray-100"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-xs text-white">
                    {getInitials(user.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden text-left md:block">
                  <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                  <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user.full_name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Mon profil</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Paramètres</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()} className="text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Déconnexion</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  )
}
