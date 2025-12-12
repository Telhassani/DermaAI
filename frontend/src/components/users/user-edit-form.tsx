/**
 * User Edit Form Component
 * Form for editing existing user information (admin only)
 */

'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateUser, User, UpdateUserRequest } from '@/lib/api/users'

// Validation schema for user update
const updateUserSchema = z.object({
  full_name: z.string().min(2, 'Nom complet requis (minimum 2 caractères)'),
  role: z.enum(['DOCTOR', 'ASSISTANT', 'SECRETARY', 'ADMIN'], {
    errorMap: () => ({ message: 'Sélectionnez un rôle' }),
  }),
  phone: z.string().optional(),
  is_active: z.boolean(),
})

type UpdateUserFormData = z.infer<typeof updateUserSchema>

interface UserEditFormProps {
  user: User
  onSuccess?: () => void
}

export function UserEditForm({ user, onSuccess }: UserEditFormProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateUserFormData>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      full_name: user.full_name,
      role: user.role as 'DOCTOR' | 'ASSISTANT' | 'SECRETARY' | 'ADMIN',
      phone: user.phone || '',
      is_active: user.is_active,
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: UpdateUserRequest) => updateUser(user.id, data),
    onSuccess: () => {
      toast.success('Utilisateur modifié avec succès')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      onSuccess?.()
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.detail || 'Erreur lors de la modification'
      )
    },
  })

  const onSubmit = (data: UpdateUserFormData) => {
    updateMutation.mutate({
      full_name: data.full_name,
      role: data.role,
      phone: data.phone || undefined,
      is_active: data.is_active,
    })
  }

  const selectedRole = watch('role')
  const isActive = watch('is_active')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Email (readonly) */}
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={user.email}
          disabled
          className="mt-1 bg-muted"
        />
        <p className="text-xs text-muted-foreground mt-1">
          L'email ne peut pas être modifié
        </p>
      </div>

      {/* Full Name */}
      <div>
        <Label htmlFor="full_name">Nom complet *</Label>
        <Input
          id="full_name"
          placeholder="Dr. Jean Dupont"
          {...register('full_name')}
          className="mt-1"
        />
        {errors.full_name && (
          <p className="text-sm text-red-600 mt-1">{errors.full_name.message}</p>
        )}
      </div>

      {/* Role */}
      <div>
        <Label htmlFor="role">Rôle *</Label>
        <Select
          value={selectedRole}
          onValueChange={(value) =>
            setValue('role', value as 'DOCTOR' | 'ASSISTANT' | 'SECRETARY' | 'ADMIN')
          }
        >
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Sélectionnez un rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ADMIN">Administrateur</SelectItem>
            <SelectItem value="DOCTOR">Docteur</SelectItem>
            <SelectItem value="ASSISTANT">Assistant</SelectItem>
            <SelectItem value="SECRETARY">Secrétaire</SelectItem>
          </SelectContent>
        </Select>
        {errors.role && (
          <p className="text-sm text-red-600 mt-1">{errors.role.message}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <Label htmlFor="phone">Téléphone</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+33 6 12 34 56 78"
          {...register('phone')}
          className="mt-1"
        />
        {errors.phone && (
          <p className="text-sm text-red-600 mt-1">{errors.phone.message}</p>
        )}
      </div>

      {/* Active Status */}
      <div>
        <Label htmlFor="is_active">Statut</Label>
        <Select
          value={isActive ? 'active' : 'inactive'}
          onValueChange={(value) => setValue('is_active', value === 'active')}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Actif</SelectItem>
            <SelectItem value="inactive">Inactif</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">
          Les utilisateurs inactifs ne peuvent pas se connecter
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="submit"
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? 'Modification...' : 'Modifier l\'utilisateur'}
        </Button>
      </div>
    </form>
  )
}
