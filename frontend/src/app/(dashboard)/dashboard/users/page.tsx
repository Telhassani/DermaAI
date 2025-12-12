/**
 * Users Management Page
 * Admin panel for creating and managing users (doctors, assistants, secretaries)
 */

'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { UserCreateForm } from '@/components/users/user-create-form'
import { UserListTable } from '@/components/users/user-list-table'
import { useAuthStore } from '@/lib/stores/auth-store'

export default function UsersPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const { user } = useAuthStore()

  // Check admin permission
  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="text-6xl">🔒</div>
          <h1 className="text-2xl font-bold">Accès refusé</h1>
          <p className="text-muted-foreground">
            Cette page est réservée aux administrateurs.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestion des Utilisateurs</h1>
          <p className="text-muted-foreground mt-1">
            Créer et gérer les comptes utilisateurs (docteurs, assistants, secrétaires)
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Créer un utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
            </DialogHeader>
            <UserCreateForm
              onSuccess={() => setIsCreateDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* User List Table */}
      <UserListTable />
    </div>
  )
}
