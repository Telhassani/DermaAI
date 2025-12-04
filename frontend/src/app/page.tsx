import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Microscope, Pill, FileText, ArrowRight, CheckCircle2 } from 'lucide-react'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-blue-50 via-white to-white px-4 py-24 text-center md:py-32">
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>

        <div className="animate-fade-in space-y-6 max-w-4xl mx-auto">
          <div className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-800 backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 mr-2"></span>
            Nouvelle version 2.0 disponible
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl md:text-7xl">
            Derm<span className="text-blue-600">AI</span>
          </h1>

          <p className="mx-auto max-w-2xl text-xl text-gray-600 md:text-2xl leading-relaxed">
            La première plateforme SAAS intelligente pour les cabinets dermatologiques.
            <br className="hidden sm:inline" />
            Optimisez votre pratique avec l'IA.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6 pt-4">
            <Link href="/login">
              <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-blue-500/20 transition-all hover:scale-105 hover:shadow-blue-500/40">
                Se connecter
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base backdrop-blur-sm hover:bg-gray-50/50">
                Démo en direct
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Feature 1 */}
          <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/5">
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform duration-300">
              <Microscope className="h-6 w-6" />
            </div>
            <h3 className="mb-3 text-xl font-bold text-gray-900">Analyse IA Avancée</h3>
            <p className="text-gray-600 leading-relaxed">
              Diagnostic assisté par intelligence artificielle avec 92% de précision sur les lésions cutanées.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/5">
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform duration-300">
              <Pill className="h-6 w-6" />
            </div>
            <h3 className="mb-3 text-xl font-bold text-gray-900">Sécurité Médicamenteuse</h3>
            <p className="text-gray-600 leading-relaxed">
              Vérification automatique et instantanée des interactions médicamenteuses pour chaque prescription.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-green-500/5">
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600 group-hover:scale-110 transition-transform duration-300">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="mb-3 text-xl font-bold text-gray-900">Gestion Labo</h3>
            <p className="text-gray-600 leading-relaxed">
              Centralisation et interprétation intelligente des résultats d'analyses biologiques.
            </p>
          </div>
        </div>
      </section>

      {/* Trust/Footer Section */}
      <footer className="border-t border-gray-100 bg-gray-50/50 py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-8 flex justify-center gap-8 text-sm font-medium text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              HIPAA Compliant
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              RGPD Ready
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              HDS Certifié
            </div>
          </div>
          <p className="text-xs text-gray-400">
            © 2025 DermAI. Tous droits réservés. Version 0.1.0
          </p>
        </div>
      </footer>
    </div>
  )
}
