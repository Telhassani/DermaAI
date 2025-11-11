'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast, toastMessages } from '@/lib/utils/toast'

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Mot de passe doit contenir au moins 8 caractères'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const { login, isLoading } = useAuth()
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (data: LoginFormData) => {
    login({
      username: data.email,
      password: data.password,
    })
  }

  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">
          Derm<span className="text-blue-600">AI</span>
        </h1>
        <h2 className="mt-6 text-2xl font-semibold">Connexion</h2>
        <p className="mt-2 text-sm text-gray-600">
          Accédez à votre cabinet dermatologique
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
        <div className="space-y-4">
          {/* Email */}
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="docteur@exemple.com"
              autoComplete="email"
              {...register('email')}
              className="mt-1"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Mot de passe</Label>
              <Link
                href="/auth/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Mot de passe oublié ?
              </Link>
            </div>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="current-password"
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
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>
        </div>

        {/* Demo accounts info */}
        <div className="rounded-md bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-800">Comptes de démonstration :</p>
          <ul className="mt-2 space-y-1 text-xs text-blue-700">
            <li>👨‍⚕️ Doctor: doctor@dermai.com / Doctor123!</li>
            <li>🔐 Admin: admin@dermai.com / Admin123!</li>
            <li>📋 Secretary: secretary@dermai.com / Secretary123!</li>
          </ul>
        </div>

        {/* Submit button */}
        <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
          {isLoading ? 'Connexion en cours...' : 'Se connecter'}
        </Button>

        {/* Register link */}
        <p className="text-center text-sm text-gray-600">
          Pas encore de compte ?{' '}
          <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
            Créer un compte
          </Link>
        </p>
      </form>
    </div>
  )
}
