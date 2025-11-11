import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
      <main className="text-center">
        <h1 className="mb-4 text-6xl font-bold text-gray-900">
          Derm<span className="text-blue-600">AI</span>
        </h1>
        <p className="mb-2 text-xl text-gray-600">
          Application SAAS pour Cabinet Dermatologique
        </p>
        <p className="mb-8 text-sm text-gray-500">
          Gestion intelligente avec IA intégrée
        </p>

        <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link href="/login">
            <Button size="lg" className="w-full sm:w-auto">
              Se connecter
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Dashboard (Dev)
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-2 text-3xl">🔬</div>
            <h3 className="mb-2 font-semibold">Analyse IA</h3>
            <p className="text-sm text-gray-600">
              Analyse d&apos;images dermatologiques avec 92% de précision
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-2 text-3xl">💊</div>
            <h3 className="mb-2 font-semibold">Interactions Médicaments</h3>
            <p className="text-sm text-gray-600">
              Vérification automatique des interactions médicamenteuses
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-2 text-3xl">📊</div>
            <h3 className="mb-2 font-semibold">Résultats Labo</h3>
            <p className="text-sm text-gray-600">
              Interprétation intelligente des résultats de laboratoire
            </p>
          </div>
        </div>

        <div className="mt-12 text-xs text-gray-400">
          Version 0.1.0 | HIPAA/RGPD Compliant
        </div>
      </main>
    </div>
  )
}
