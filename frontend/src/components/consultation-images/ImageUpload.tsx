'use client'

import { useState, useRef, ChangeEvent, DragEvent } from 'react'
import { Upload, X, FileImage, AlertCircle, Loader2 } from 'lucide-react'
import { api } from '@/lib/api/client'
import { ImageUploadFormData, ImagePreview } from '@/types/consultation-image'
import { toast } from 'sonner'

interface ImageUploadProps {
  consultationId: number
  onUploadSuccess?: () => void
  onClose?: () => void
}

export default function ImageUpload({
  consultationId,
  onUploadSuccess,
  onClose
}: ImageUploadProps) {
  const [previews, setPreviews] = useState<ImagePreview[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  // Form state
  const [imageType, setImageType] = useState('')
  const [bodyLocation, setBodyLocation] = useState('')
  const [description, setDescription] = useState('')
  const [isPrimary, setIsPrimary] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Validation
  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, error: `${file.name} dépasse 10MB` }
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { valid: false, error: `${file.name} n'est pas un format valide (JPEG, PNG, WebP, HEIC)` }
    }
    return { valid: true }
  }

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const newPreviews: ImagePreview[] = []
    const errors: string[] = []

    Array.from(files).forEach((file) => {
      const validation = validateFile(file)

      if (!validation.valid) {
        errors.push(validation.error!)
        return
      }

      // Create preview URL
      const preview = URL.createObjectURL(file)

      newPreviews.push({
        file,
        preview,
        metadata: {
          size: file.size,
          type: file.type,
          name: file.name
        }
      })
    })

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error))
    }

    if (newPreviews.length > 0) {
      setPreviews(prev => [...prev, ...newPreviews])
    }
  }

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }

  const removePreview = (index: number) => {
    setPreviews(prev => {
      const newPreviews = [...prev]
      // Revoke object URL to free memory
      URL.revokeObjectURL(newPreviews[index].preview)
      newPreviews.splice(index, 1)
      return newPreviews
    })
  }

  const handleUpload = async () => {
    if (previews.length === 0) {
      toast.error('Veuillez sélectionner au moins une image')
      return
    }

    setUploading(true)

    try {
      // Upload each image
      const uploadPromises = previews.map(async (preview, index) => {
        const formData = new FormData()
        formData.append('file', preview.file)

        if (imageType) formData.append('image_type', imageType)
        if (bodyLocation) formData.append('body_location', bodyLocation)
        if (description) formData.append('description', description)

        // Only first image can be primary if multiple uploads
        if (isPrimary && index === 0) {
          formData.append('is_primary', 'true')
        }

        return api.consultationImages.upload(consultationId, formData)
      })

      await Promise.all(uploadPromises)

      toast.success(`${previews.length} image(s) téléchargée(s) avec succès`)

      // Cleanup
      previews.forEach(preview => URL.revokeObjectURL(preview.preview))
      setPreviews([])
      setImageType('')
      setBodyLocation('')
      setDescription('')
      setIsPrimary(false)

      // Callback
      onUploadSuccess?.()
      onClose?.()

    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.response?.data?.detail || 'Erreur lors du téléchargement')
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  return (
    <div className="space-y-6">
      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors
          ${dragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/jpg,image/png,image/webp,image/heic"
          onChange={handleFileInput}
          className="hidden"
        />

        <Upload className={`mx-auto h-12 w-12 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />

        <p className="mt-2 text-sm font-medium text-gray-900">
          Glissez-déposez vos images ici
        </p>
        <p className="mt-1 text-xs text-gray-500">
          ou cliquez pour parcourir
        </p>
        <p className="mt-2 text-xs text-gray-400">
          JPEG, PNG, WebP, HEIC • Max 10MB par fichier
        </p>
      </div>

      {/* Preview Grid */}
      {previews.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900">
            Images à télécharger ({previews.length})
          </h3>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {previews.map((preview, index) => (
              <div key={index} className="group relative">
                <div className="aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                  <img
                    src={preview.preview}
                    alt={preview.metadata.name}
                    className="h-full w-full object-cover"
                  />
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removePreview(index)}
                  className="absolute -right-2 -top-2 rounded-full bg-red-500 p-1 text-white shadow-lg opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* File info */}
                <div className="mt-1 text-xs text-gray-500 truncate">
                  {preview.metadata.name}
                </div>
                <div className="text-xs text-gray-400">
                  {formatFileSize(preview.metadata.size)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata Form */}
      {previews.length > 0 && (
        <div className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="text-sm font-medium text-gray-900">
            Métadonnées médicales (optionnel)
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Image Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type d'image
              </label>
              <select
                value={imageType}
                onChange={(e) => setImageType(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Sélectionner...</option>
                <option value="lésion primaire">Lésion primaire</option>
                <option value="vue macro">Vue macro</option>
                <option value="dermatoscope">Dermatoscope</option>
                <option value="évolution">Évolution</option>
                <option value="post-traitement">Post-traitement</option>
                <option value="autre">Autre</option>
              </select>
            </div>

            {/* Body Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Localisation
              </label>
              <input
                type="text"
                value={bodyLocation}
                onChange={(e) => setBodyLocation(e.target.value)}
                placeholder="ex: bras droit, dos, visage..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description médicale de l'image..."
              rows={3}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Primary Image */}
          {previews.length === 1 && (
            <div className="flex items-center">
              <input
                type="checkbox"
                id="is-primary"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="is-primary" className="ml-2 text-sm text-gray-700">
                Définir comme image principale
              </label>
            </div>
          )}

          {previews.length > 1 && (
            <div className="flex items-start rounded-md bg-blue-50 p-3">
              <AlertCircle className="mr-2 h-5 w-5 flex-shrink-0 text-blue-600" />
              <p className="text-sm text-blue-900">
                Les métadonnées seront appliquées à toutes les images. Seule la première sera marquée comme principale si cochée.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end space-x-3">
        {onClose && (
          <button
            onClick={onClose}
            disabled={uploading}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Annuler
          </button>
        )}

        <button
          onClick={handleUpload}
          disabled={uploading || previews.length === 0}
          className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Téléchargement...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Télécharger {previews.length > 0 && `(${previews.length})`}
            </>
          )}
        </button>
      </div>
    </div>
  )
}
