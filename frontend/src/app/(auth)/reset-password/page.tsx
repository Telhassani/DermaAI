import { ResetPasswordForm } from '@/components/forms/reset-password-form'

export const metadata = {
  title: 'Réinitialiser le mot de passe | DermAI',
  description: 'Définissez un nouveau mot de passe',
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 py-12 sm:px-6 lg:px-8">
      <ResetPasswordForm />
    </div>
  )
}
