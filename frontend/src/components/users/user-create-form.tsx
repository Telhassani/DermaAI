/**
 * User Creation Form Component
 * Form to create new users with validation (admin only)
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Eye, EyeOff, RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createUser } from '@/lib/api/users'

const createUserSchema = z.object({
  email: z.string().email('Email invalide'),
  full_name: z.string().min(2, 'Nom complet requis (minimum 2 caractères)'),
  role: z.enum(['DOCTOR', 'ASSISTANT', 'SECRETARY', 'ADMIN'], {
    errorMap: () => ({ message: 'Sélectionnez un rôle' })
  }),
  phone: z.string().optional(),
  password: z.string()
    .min(8, 'Mot de passe minimum 8 caractères')
    .regex(/[A-Z]/, 'Doit contenir une majuscule')
    .regex(/[a-z]/, 'Doit contenir une minuscule')
    .regex(/[0-9]/, 'Doit contenir un chiffre')
    .regex(/[!@#$%^&*]/, 'Doit contenir un caractère spécial (!@#$%^&*)'),
})

type FormValues = z.infer<typeof createUserSchema>

interface UserCreateFormProps {
  onSuccess?: () => void
}

/**
 * Generate secure random password
 */
function generatePassword(): string {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lowercase = 'abcdefghijkmnopqrstuvwxyz'
  const numbers = '23456789'
  const special = '!@#$%^&*'
  const all = uppercase + lowercase + numbers + special

  let password = ''
  // Ensure at least one of each required type
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]

  // Fill rest with random characters (total 12 chars)
  for (let i = 0; i < 8; i++) {
    password += all[Math.floor(Math.random() * all.length)]
  }

  // Shuffle password
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

export function UserCreateForm({ onSuccess }: UserCreateFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const queryClient = useQueryClient()

  const form = useForm<FormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      full_name: '',
      role: 'DOCTOR',
      phone: '',
      password: '',
    },
  })

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      toast.success('Utilisateur créé avec succès')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      form.reset()
      onSuccess?.()
    },
    onError: (error: any) => {
      const message = error.response?.data?.detail || 'Erreur lors de la création'
      toast.error(message)
    },
  })

  const onSubmit = (data: FormValues) => {
    createMutation.mutate(data)
  }

  const handleGeneratePassword = () => {
    const password = generatePassword()
    form.setValue('password', password)
    toast.success('Mot de passe généré')
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="utilisateur@dermai.com"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="full_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom complet</FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Dr. Marie Dupont"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rôle</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un rôle" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="DOCTOR">Docteur</SelectItem>
                  <SelectItem value="ASSISTANT">Assistant</SelectItem>
                  <SelectItem value="SECRETARY">Secrétaire</SelectItem>
                  <SelectItem value="ADMIN">Administrateur</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Téléphone (optionnel)</FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="+33 6 12 34 56 78"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mot de passe</FormLabel>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <FormControl>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      {...field}
                    />
                  </FormControl>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGeneratePassword}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Générer
                </Button>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="submit"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Création...' : 'Créer l\'utilisateur'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
