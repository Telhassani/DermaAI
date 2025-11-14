'use client'

import { useState } from 'react'
import {
  X,
  ZoomIn,
  ZoomOut,
  Download,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Star,
  MapPin,
  Calendar,
  Camera,
  FileImage
} from 'lucide-react'
import { ConsultationImage } from '@/types/consultation-image'
import { api } from '@/lib/api/client'
import { toast } from 'sonner'

interface ImageGalleryProps {
  images: ConsultationImage[]
  onImageDeleted?: () => void
  onImageUpdated?: () => void
}

export default function ImageGallery({
  images,
  onImageDeleted,
  onImageUpdated
}: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [showLightbox, setShowLightbox] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [deleting, setDeleting] = useState(false)

  const openLightbox = (index: number) => {
    setSelectedIndex(index)
    setShowLightbox(true)
    setZoom(1)
  }

  const closeLightbox = () => {
    setShowLightbox(false)
    setSelectedIndex(null)
    setZoom(1)
  }

  const goToPrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1)
      setZoom(1)
    }
  }

  const goToNext = () => {
    if (selectedIndex !== null && selectedIndex < images.length - 1) {
      setSelectedIndex(selectedIndex + 1)
      setZoom(1)
    }
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showLightbox) return

    switch (e.key) {
      case 'Escape':
        closeLightbox()
        break
      case 'ArrowLeft':
        goToPrevious()
        break
      case 'ArrowRight':
        goToNext()
        break
      case '+':
      case '=':
        handleZoomIn()
        break
      case '-':
        handleZoomOut()
        break
    }
  }

  const handleDelete = async (imageId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette image ? Cette action est irréversible.')) {
      return
    }

    try {
      setDeleting(true)
      await api.consultationImages.delete(imageId)
      toast.success('Image supprimée avec succès')
      closeLightbox()
      onImageDeleted?.()
    } catch (error: any) {
      console.error('Delete error:', error)
      toast.error(error.response?.data?.detail || 'Erreur lors de la suppression')
    } finally {
      setDeleting(false)
    }
  }

  const handleDownload = async (image: ConsultationImage) => {
    try {
      const response = await fetch(image.image_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = image.original_filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Image téléchargée')
    } catch (error) {
      toast.error('Erreur lors du téléchargement')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  if (images.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
        <FileImage className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">Aucune image disponible</p>
      </div>
    )
  }

  const selectedImage = selectedIndex !== null ? images[selectedIndex] : null

  return (
    <>
      {/* Gallery Grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {images.map((image, index) => (
          <div
            key={image.id}
            onClick={() => openLightbox(index)}
            className="group relative cursor-pointer"
          >
            {/* Thumbnail */}
            <div className="aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100 transition-transform group-hover:scale-105">
              <img
                src={image.thumbnail_url || image.image_url}
                alt={image.description || `Image ${index + 1}`}
                className="h-full w-full object-cover"
              />
            </div>

            {/* Overlay */}
            <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
              <ZoomIn className="h-8 w-8 text-white" />
            </div>

            {/* Primary Badge */}
            {image.is_primary && (
              <div className="absolute left-2 top-2 rounded-full bg-yellow-500 p-1">
                <Star className="h-3 w-3 fill-white text-white" />
              </div>
            )}

            {/* Info */}
            <div className="mt-2">
              {image.image_type && (
                <p className="text-xs font-medium text-gray-700 truncate">
                  {image.image_type}
                </p>
              )}
              {image.body_location && (
                <p className="text-xs text-gray-500 truncate">
                  {image.body_location}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {showLightbox && selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={closeLightbox}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Close Button */}
          <button
            onClick={closeLightbox}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm hover:bg-white/20"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Navigation */}
          {selectedIndex! > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                goToPrevious()
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm hover:bg-white/20"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {selectedIndex! < images.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                goToNext()
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white backdrop-blur-sm hover:bg-white/20"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Main Content */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex h-full w-full max-w-7xl flex-col lg:flex-row lg:space-x-4"
          >
            {/* Image Viewer */}
            <div className="flex flex-1 items-center justify-center overflow-hidden rounded-lg bg-black">
              <img
                src={selectedImage.image_url}
                alt={selectedImage.description || 'Image médicale'}
                style={{ transform: `scale(${zoom})` }}
                className="max-h-full max-w-full object-contain transition-transform"
              />
            </div>

            {/* Sidebar */}
            <div className="mt-4 w-full overflow-y-auto rounded-lg bg-white p-6 lg:mt-0 lg:w-80">
              {/* Counter */}
              <div className="mb-4 text-center text-sm text-gray-500">
                {selectedIndex! + 1} / {images.length}
              </div>

              {/* Zoom Controls */}
              <div className="mb-6 flex items-center justify-center space-x-2">
                <button
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                  className="rounded-md border border-gray-300 bg-white p-2 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ZoomOut className="h-4 w-4" />
                </button>
                <span className="text-sm font-medium">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                  className="rounded-md border border-gray-300 bg-white p-2 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ZoomIn className="h-4 w-4" />
                </button>
              </div>

              {/* Image Info */}
              <div className="space-y-4">
                {selectedImage.is_primary && (
                  <div className="flex items-center rounded-md bg-yellow-50 p-2">
                    <Star className="mr-2 h-4 w-4 fill-yellow-500 text-yellow-500" />
                    <span className="text-sm font-medium text-yellow-900">
                      Image principale
                    </span>
                  </div>
                )}

                {selectedImage.image_type && (
                  <div>
                    <div className="text-xs font-medium text-gray-500">Type</div>
                    <div className="mt-1 text-sm text-gray-900">{selectedImage.image_type}</div>
                  </div>
                )}

                {selectedImage.body_location && (
                  <div className="flex items-start">
                    <MapPin className="mr-2 mt-0.5 h-4 w-4 text-gray-400" />
                    <div>
                      <div className="text-xs font-medium text-gray-500">Localisation</div>
                      <div className="mt-1 text-sm text-gray-900">{selectedImage.body_location}</div>
                    </div>
                  </div>
                )}

                {selectedImage.description && (
                  <div>
                    <div className="text-xs font-medium text-gray-500">Description</div>
                    <div className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">
                      {selectedImage.description}
                    </div>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="mr-1 h-3 w-3" />
                    {formatDate(selectedImage.created_at)}
                  </div>

                  {selectedImage.camera_model && (
                    <div className="mt-2 flex items-center text-xs text-gray-500">
                      <Camera className="mr-1 h-3 w-3" />
                      {selectedImage.camera_model}
                    </div>
                  )}

                  <div className="mt-2 text-xs text-gray-500">
                    {selectedImage.original_filename}
                  </div>

                  <div className="mt-1 text-xs text-gray-400">
                    {selectedImage.width} × {selectedImage.height} •{' '}
                    {formatFileSize(selectedImage.file_size)}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 space-y-2">
                <button
                  onClick={() => handleDownload(selectedImage)}
                  className="flex w-full items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger
                </button>

                <button
                  onClick={() => handleDelete(selectedImage.id)}
                  disabled={deleting}
                  className="flex w-full items-center justify-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deleting ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>

              {/* Keyboard Hints */}
              <div className="mt-6 rounded-md bg-gray-50 p-3">
                <div className="text-xs font-medium text-gray-700">Raccourcis clavier</div>
                <div className="mt-2 space-y-1 text-xs text-gray-500">
                  <div>← → : Navigation</div>
                  <div>+ - : Zoom</div>
                  <div>Esc : Fermer</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
