'use client'

import { useState, useEffect } from 'react'
import { X, AlertTriangle, User, Phone, Mail, MapPin, Hash, Heart, Calendar } from 'lucide-react'
import { PatientResponse, updatePatient } from '@/lib/api/patients'

interface PatientEditModalProps {
  isOpen: boolean
  patient: PatientResponse | null
  onClose: () => void
  onSave: (patient: PatientResponse) => void
}

export function PatientEditModal({ isOpen, patient, onClose, onSave }: PatientEditModalProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [country, setCountry] = useState('')
  const [insuranceNumber, setInsuranceNumber] = useState('')
  const [allergies, setAllergies] = useState('')
  const [medicalHistory, setMedicalHistory] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Update local state when patient changes or modal opens
  useEffect(() => {
    if (isOpen && patient) {
      setFirstName(patient.first_name || '')
      setLastName(patient.last_name || '')
      setEmail(patient.email || '')
      setPhone(patient.phone || '')
      setAddress(patient.address || '')
      setCity(patient.city || '')
      setPostalCode(patient.postal_code || '')
      setCountry(patient.country || '')
      setInsuranceNumber(patient.insurance_number || '')
      setAllergies(patient.allergies || '')
      setMedicalHistory(patient.medical_history || '')
      setError(null)
    }
  }, [isOpen, patient])

  const handleSave = async () => {
    if (!patient) return

    // Basic validation
    if (!firstName.trim() || !lastName.trim()) {
      setError('Le prénom et le nom sont obligatoires')
      return
    }

    if (!phone.trim()) {
      setError('Le numéro de téléphone est obligatoire')
      return
    }

    try {
      setIsSaving(true)
      setError(null)

      const updated = await updatePatient(patient.id, {
        first_name: firstName,
        last_name: lastName,
        email: email || undefined,
        phone,
        address: address || undefined,
        city: city || undefined,
        postal_code: postalCode || undefined,
        country: country || undefined,
        insurance_number: insuranceNumber || undefined,
        allergies: allergies || undefined,
        medical_history: medicalHistory || undefined,
      })

      onSave(updated)
      onClose()
    } catch (err) {
      console.error('Error saving patient:', err)
      setError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde du patient')
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen || !patient) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        {/* Header - Gradient Violet Background */}
        <div className="sticky top-0 flex items-center justify-between p-6 bg-gradient-to-r from-violet-600 to-purple-600 border-b-2 border-violet-300">
          <div>
            <h2 className="text-xl font-bold text-white">Éditer le patient</h2>
            <p className="text-sm text-violet-100 mt-1 font-medium">{patient.full_name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 transition-all duration-200 p-2 rounded-lg"
            title="Fermer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-red-800 text-sm flex items-start gap-3 animate-in slide-in-from-top-2">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Full Name - Split into First and Last Name */}
          <div className="grid grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <User className="h-4 w-4 text-violet-600" />
                Prénom
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all duration-200"
                placeholder="Jean"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <User className="h-4 w-4 text-violet-600" />
                Nom
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all duration-200"
                placeholder="Dupont"
              />
            </div>
          </div>

          {/* Email and Phone */}
          <div className="grid grid-cols-2 gap-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Mail className="h-4 w-4 text-violet-600" />
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all duration-200"
                placeholder="jean.dupont@example.com"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Phone className="h-4 w-4 text-violet-600" />
                Téléphone
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all duration-200"
                placeholder="+212 6 12 345 678"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-violet-600" />
              Adresse
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all duration-200"
              placeholder="123 rue de la Paix"
            />
          </div>

          {/* City, Postal Code, Country */}
          <div className="grid grid-cols-3 gap-4">
            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all duration-200"
                placeholder="Casablanca"
              />
            </div>

            {/* Postal Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Hash className="h-4 w-4 text-violet-600" />
                Code Postal
              </label>
              <input
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all duration-200"
                placeholder="20000"
              />
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pays</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white hover:border-violet-300 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all duration-200"
                placeholder="Maroc"
              />
            </div>
          </div>

          {/* Insurance Number */}
          <div className="bg-violet-50 p-4 rounded-lg border border-violet-200 border-l-4 border-l-violet-500">
            <label className="block text-sm font-medium text-violet-900 mb-2 flex items-center gap-2">
              <Hash className="h-4 w-4 text-violet-600" />
              Numéro d'assurance
            </label>
            <input
              type="text"
              value={insuranceNumber}
              onChange={(e) => setInsuranceNumber(e.target.value)}
              className="w-full px-3 py-2 border border-violet-300 rounded-lg text-sm bg-white hover:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all duration-200"
              placeholder="Ex: 123456789"
            />
          </div>

          {/* Allergies */}
          <div className="bg-violet-50 p-4 rounded-lg border border-violet-200 border-l-4 border-l-violet-500">
            <label className="block text-sm font-bold text-violet-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-violet-600" />
              Allergies
            </label>
            <textarea
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-violet-300 rounded-lg text-sm bg-white hover:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all duration-200 resize-none"
              placeholder="Ex: Pénicilline, Arachides..."
            />
          </div>

          {/* Medical History */}
          <div className="bg-violet-50 p-4 rounded-lg border border-violet-200 border-l-4 border-l-violet-500">
            <label className="block text-sm font-bold text-violet-900 mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-violet-600" />
              Antécédents médicaux
            </label>
            <textarea
              value={medicalHistory}
              onChange={(e) => setMedicalHistory(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-violet-300 rounded-lg text-sm bg-white hover:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all duration-200 resize-none"
              placeholder="Ex: Diabète, asthme, hypertension..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 p-6 border-t-2 border-violet-200 bg-gradient-to-r from-violet-50 to-purple-50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-violet-700 border-2 border-violet-300 rounded-lg hover:bg-violet-100 hover:border-violet-400 active:scale-95 transition-all duration-200"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-violet-600 to-purple-600 rounded-lg hover:from-violet-700 hover:to-purple-700 hover:shadow-lg disabled:from-gray-400 disabled:to-gray-400 active:scale-95 transition-all duration-200 flex items-center gap-2"
          >
            {isSaving && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></div>
            )}
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}
