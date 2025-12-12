import { ForgotPasswordForm } from '@/components/forms/forgot-password-form'

export const metadata = {
  title: 'Mot de passe oublié | DermAI',
  description: 'Réinitialisez votre mot de passe',
}

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 py-12 sm:px-6 lg:px-8">
      <ForgotPasswordForm />
    </div>
  )
}
