'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileImage, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { uploadImages, validateImageFile, compressImage, ImageUploadRequest } from '@/lib/api/images'
import { toast } from '@/lib/utils/toast'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils/cn'

interface ImageUploadProps {
  patientId: number
  consultationId?: number
  onUploadComplete?: (imageIds: number[]) => void
  maxFiles?: number
  compressImages?: boolean
  className?: string
}

interface FileWithPreview extends File {
  preview: string
  id: string
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

export function ImageUpload({
  patientId,
  consultationId,
  onUploadComplete,
  maxFiles = 10,
  compressImages = true,
  className,
}: ImageUploadProps) {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Handle file drop
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Validate number of files
      if (files.length + acceptedFiles.length > maxFiles) {
        toast.error('Trop de fichiers', `Vous ne pouvez télécharger que ${maxFiles} fichiers maximum.`)
        return
      }

      // Validate and process files
      const newFiles: FileWithPreview[] = []
      acceptedFiles.forEach((file) => {
        const validation = validateImageFile(file)
        if (validation.valid) {
          const fileWithPreview = Object.assign(file, {
            preview: URL.createObjectURL(file),
            id: Math.random().toString(36).substring(7),
            uploadStatus: 'pending' as const,
          })
          newFiles.push(fileWithPreview)
        } else {
          toast.error('Fichier invalide', validation.error)
        }
      })

      setFiles((prev) => [...prev, ...newFiles])
    },
    [files.length, maxFiles]
  )

  // Setup dropzone
  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.heic'],
    },
    maxFiles,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploading,
  })

  // Remove file from list
  const removeFile = (fileId: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === fileId)
      if (file) {
        URL.revokeObjectURL(file.preview)
      }
      return prev.filter((f) => f.id !== fileId)
    })
  }

  // Upload all files
  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    try {
      // Compress images if enabled
      let filesToUpload = files
      if (compressImages) {
        toast.loading('Compression des images...')
        filesToUpload = await Promise.all(
          files.map(async (file) => {
            try {
              const compressed = await compressImage(file)
              return Object.assign(compressed, {
                preview: file.preview,
                id: file.id,
                uploadStatus: 'pending' as const,
              })
            } catch (error) {
              console.error('Compression error:', error)
              return file
            }
          })
        )
        toast.dismiss()
      }

      // Upload files
      const metadata: ImageUploadRequest = {
        patient_id: patientId,
        consultation_id: consultationId,
      }

      const response = await uploadImages(filesToUpload, metadata, (progress) => {
        setUploadProgress(progress)
      })

      // Handle response
      if (response.success_count > 0) {
        toast.success(
          'Images téléchargées',
          `${response.success_count} image(s) téléchargée(s) avec succès`
        )

        // Call callback with uploaded image IDs
        if (onUploadComplete) {
          const imageIds = response.images.map((img) => img.id)
          onUploadComplete(imageIds)
        }

        // Clear files
        files.forEach((file) => URL.revokeObjectURL(file.preview))
        setFiles([])
      }

      if (response.error_count > 0) {
        toast.error('Erreur de téléchargement', `${response.error_count} image(s) non téléchargée(s)`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Erreur', 'Une erreur est survenue lors du téléchargement')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  // Clear all files
  const clearAll = () => {
    files.forEach((file) => URL.revokeObjectURL(file.preview))
    setFiles([])
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          'relative rounded-xl border-2 border-dashed transition-all cursor-pointer',
          'hover:border-blue-400 hover:bg-blue-50/50',
          isDragActive && !isDragReject && 'border-blue-500 bg-blue-50 scale-[1.02]',
          isDragReject && 'border-red-500 bg-red-50',
          uploading && 'opacity-50 cursor-not-allowed',
          !isDragActive && !isDragReject && 'border-slate-300 bg-slate-50/50'
        )}
      >
        <input {...getInputProps()} />
        <div className="p-12 text-center">
          <motion.div
            animate={{
              scale: isDragActive ? 1.1 : 1,
              rotate: isDragActive ? 5 : 0,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Upload
              className={cn(
                'mx-auto h-12 w-12 mb-4 transition-colors',
                isDragActive && !isDragReject && 'text-blue-500',
                isDragReject && 'text-red-500',
                !isDragActive && !isDragReject && 'text-slate-400'
              )}
            />
          </motion.div>

          {isDragReject ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-red-600">Fichiers non supportés</p>
              <p className="text-xs text-red-500">Seules les images sont acceptées (JPG, PNG, WEBP, HEIC)</p>
            </div>
          ) : isDragActive ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-blue-600">Déposez les fichiers ici</p>
              <p className="text-xs text-blue-500">Relâchez pour ajouter les images</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">
                Glissez-déposez des images ici, ou cliquez pour sélectionner
              </p>
              <p className="text-xs text-slate-500">
                JPG, PNG, WEBP, HEIC jusqu'à 10MB • Maximum {maxFiles} fichiers
              </p>
            </div>
          )}
        </div>
      </div>

      {/* File previews */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-700">
                {files.length} fichier{files.length > 1 ? 's' : ''} sélectionné{files.length > 1 ? 's' : ''}
              </p>
              <Button variant="ghost" size="sm" onClick={clearAll} disabled={uploading}>
                <X className="h-4 w-4 mr-1" />
                Tout effacer
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {files.map((file) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="relative group"
                >
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-full h-full object-cover"
                      onLoad={() => URL.revokeObjectURL(file.preview)}
                    />

                    {/* Remove button */}
                    {!uploading && (
                      <button
                        onClick={() => removeFile(file.id)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}

                    {/* Status indicator */}
                    {file.uploadStatus === 'success' && (
                      <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                      </div>
                    )}
                    {file.uploadStatus === 'error' && (
                      <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                        <AlertCircle className="h-8 w-8 text-red-600" />
                      </div>
                    )}
                  </div>

                  <p className="mt-1 text-xs text-slate-600 truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload progress */}
      {uploading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-2"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-700 flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Téléchargement en cours...
            </span>
            <span className="text-slate-500">{uploadProgress}%</span>
          </div>
          <Progress value={uploadProgress} className="h-2" />
        </motion.div>
      )}

      {/* Actions */}
      {files.length > 0 && !uploading && (
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" onClick={clearAll}>
            Annuler
          </Button>
          <Button onClick={handleUpload} className="bg-blue-600 hover:bg-blue-700">
            <Upload className="h-4 w-4 mr-2" />
            Télécharger {files.length} image{files.length > 1 ? 's' : ''}
          </Button>
        </div>
      )}
    </div>
  )
}
