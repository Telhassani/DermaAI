/**
 * User Actions Component
 * Dropdown menu for user management actions (edit, deactivate, delete)
 */

'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MoreHorizontal, Edit, UserX, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { deactivateUser, User } from '@/lib/api/users'
import { UserEditForm } from './user-edit-form'

interface UserActionsProps {
  user: User
}

export function UserActions({ user }: UserActionsProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeactivateDialogOpen, setIsDeactivateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  const deactivateMutation = useMutation({
    mutationFn: (userId: string) => deactivateUser(userId),
    onSuccess: () => {
      toast.success('Utilisateur désactivé avec succès')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setIsDeactivateDialogOpen(false)
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.detail || 'Erreur lors de la désactivation'
      )
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => deactivateUser(userId),
    onSuccess: () => {
      toast.success('Utilisateur supprimé avec succès')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setIsDeleteDialogOpen(false)
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.detail || 'Erreur lors de la suppression'
      )
    },
  })

  const handleDeactivate = () => {
    deactivateMutation.mutate(user.id)
  }

  const handleDelete = () => {
    deleteMutation.mutate(user.id)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setIsDeactivateDialogOpen(true)}
            disabled={!user.is_active}
          >
            <UserX className="mr-2 h-4 w-4" />
            Désactiver
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>
              Modification de {user.full_name} ({user.email})
            </DialogDescription>
          </DialogHeader>
          <UserEditForm
            user={user}
            onSuccess={() => setIsEditDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation Dialog */}
      <Dialog
        open={isDeactivateDialogOpen}
        onOpenChange={setIsDeactivateDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Désactiver l'utilisateur</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir désactiver <strong>{user.full_name}</strong>{' '}
              ({user.email})? L'utilisateur ne pourra plus se connecter à
              l'application.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeactivateDialogOpen(false)}
              disabled={deactivateMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeactivate}
              disabled={deactivateMutation.isPending}
            >
              {deactivateMutation.isPending
                ? 'Désactivation...'
                : 'Désactiver'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer l'utilisateur</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer définitivement{' '}
              <strong>{user.full_name}</strong> ({user.email})? Cette action est
              irréversible et supprimera toutes les données associées à cet
              utilisateur.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
