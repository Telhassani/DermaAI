'use client'

import { useState, useEffect } from 'react'
import { X, Check, Loader } from 'lucide-react'
import { ImageResponse } from '@/lib/api/images'

interface ImageAnnotationModalProps {
  isOpen: boolean
  image: ImageResponse | null
  patientName: string
  onSave: (imageId: number, notes: string) => Promise<void>
  onCancel: () => void
}

export function ImageAnnotationModal({
  isOpen,
  image,
  patientName,
  onSave,
  onCancel,
}: ImageAnnotationModalProps) {
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset state when modal opens/closes or image changes
  useEffect(() => {
    if (isOpen && image) {
      setNotes(image.notes || '')
      setError(null)
    }
  }, [isOpen, image])

  const handleSave = async () => {
    if (!image) return

    try {
      setIsSaving(true)
      setError(null)
      await onSave(image.id, notes)
      onCancel() // Close modal after successful save
    } catch (err) {
      setError('Erreur lors de la sauvegarde des annotations')
      console.error('Error saving annotations:', err)
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen || !image) return null

  const uploadDate = new Date(image.uploaded_at)
  const formattedDate = uploadDate.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Annotations d'image</h2>
            <p className="mt-1 text-sm text-gray-600">{patientName}</p>
            <p className="text-xs text-gray-500">{formattedDate}</p>
          </div>
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-6 p-6">
          {/* Image Preview */}
          <div className="flex justify-center">
            <img
              src={image.image_data}
              alt={image.filename}
              className="max-h-96 rounded-lg object-contain shadow-md"
            />
          </div>

          {/* File Info */}
          <div className="grid grid-cols-2 gap-4 rounded-lg bg-gray-50 p-4">
            <div>
              <p className="text-xs text-gray-500">Nom du fichier</p>
              <p className="text-sm font-medium text-gray-900">{image.filename}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Type MIME</p>
              <p className="text-sm font-medium text-gray-900">{image.mime_type}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Taille</p>
              <p className="text-sm font-medium text-gray-900">
                {(image.file_size / 1024).toFixed(2)} KB
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Consultation ID</p>
              <p className="text-sm font-medium text-gray-900">#{image.consultation_id}</p>
            </div>
          </div>

          {/* Annotations Section */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Observations et annotations
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSaving}
              placeholder="Ajoutez vos observations médicales, diagnostics préliminaires, zones d'intérêt, etc."
              className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
              rows={6}
            />
            <p className="mt-2 text-xs text-gray-500">
              Vous pouvez ajouter des commentaires détaillés sur l'état de la peau, les observations particulières, etc.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 p-6">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Sauvegarder
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
