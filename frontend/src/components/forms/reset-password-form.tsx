'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2 } from 'lucide-react'

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
      .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
      .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
      .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
      .regex(
        /[!@#$%^&*]/,
        'Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*)'
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

export function ResetPasswordForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  })

  const password = watch('password')

  // Password strength indicator
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { strength: 0, label: '', color: '' }

    let strength = 0
    if (pwd.length >= 8) strength++
    if (/[A-Z]/.test(pwd)) strength++
    if (/[a-z]/.test(pwd)) strength++
    if (/[0-9]/.test(pwd)) strength++
    if (/[!@#$%^&*]/.test(pwd)) strength++

    if (strength <= 2) return { strength, label: 'Faible', color: 'bg-red-500' }
    if (strength <= 3) return { strength, label: 'Moyen', color: 'bg-yellow-500' }
    if (strength <= 4) return { strength, label: 'Bon', color: 'bg-blue-500' }
    return { strength, label: 'Excellent', color: 'bg-green-500' }
  }

  const passwordStrength = getPasswordStrength(password)

  const onSubmit = async (data: ResetPasswordFormData) => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { error } = await supabase.auth.updateUser({
        password: data.password,
      })

      if (error) {
        throw error
      }

      setSuccess(true)

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err: any) {
      console.error('Password reset error:', err)
      setError(err.message || 'Une erreur est survenue lors de la réinitialisation du mot de passe')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="mt-6 text-2xl font-semibold">Mot de passe réinitialisé !</h2>
          <p className="mt-2 text-sm text-gray-600">
            Votre mot de passe a été réinitialisé avec succès.
            <br />
            Redirection vers la page de connexion...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">
          Derm<span className="text-blue-600">AI</span>
        </h1>
        <h2 className="mt-6 text-2xl font-semibold">Nouveau mot de passe</h2>
        <p className="mt-2 text-sm text-gray-600">
          Choisissez un nouveau mot de passe sécurisé pour votre compte
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
        {error && (
          <div className="rounded-md bg-red-50 p-4 border border-red-200">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Erreur</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="password">Nouveau mot de passe</Label>
          <div className="relative mt-1">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <span className="text-sm">Masquer</span>
              ) : (
                <span className="text-sm">Voir</span>
              )}
            </button>
          </div>
          {password && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">Force du mot de passe:</span>
                <span className={`font-medium ${
                  passwordStrength.strength <= 2 ? 'text-red-600' :
                  passwordStrength.strength <= 3 ? 'text-yellow-600' :
                  passwordStrength.strength <= 4 ? 'text-blue-600' :
                  'text-green-600'
                }`}>
                  {passwordStrength.label}
                </span>
              </div>
              <div className="h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${passwordStrength.color}`}
                  style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                />
              </div>
            </div>
          )}
          {errors.password && (
            <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
          <div className="relative mt-1">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="new-password"
              required
              {...register('confirmPassword')}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? (
                <span className="text-sm">Masquer</span>
              ) : (
                <span className="text-sm">Voir</span>
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        <div className="rounded-md bg-blue-50 p-4">
          <p className="text-xs font-medium text-blue-800 mb-2">Le mot de passe doit contenir :</p>
          <ul className="space-y-1 text-xs text-blue-700">
            <li className={password?.length >= 8 ? 'text-green-600' : ''}>
              ✓ Au moins 8 caractères
            </li>
            <li className={/[A-Z]/.test(password || '') ? 'text-green-600' : ''}>
              ✓ Une lettre majuscule
            </li>
            <li className={/[a-z]/.test(password || '') ? 'text-green-600' : ''}>
              ✓ Une lettre minuscule
            </li>
            <li className={/[0-9]/.test(password || '') ? 'text-green-600' : ''}>
              ✓ Un chiffre
            </li>
            <li className={/[!@#$%^&*]/.test(password || '') ? 'text-green-600' : ''}>
              ✓ Un caractère spécial (!@#$%^&*)
            </li>
          </ul>
        </div>

        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
          {isLoading ? 'Réinitialisation en cours...' : 'Réinitialiser le mot de passe'}
        </Button>
      </form>
    </div>
  )
}
