import { LoginForm } from '@/components/forms/login-form'

export const metadata = {
  title: 'Connexion | DermAI',
  description: 'Connectez-vous à votre cabinet dermatologique',
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4 py-12 sm:px-6 lg:px-8">
      <LoginForm />
    </div>
  )
}
