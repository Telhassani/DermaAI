'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
  Tag,
  Calendar,
  Maximize2,
} from 'lucide-react'
import { ImageMetadata, deleteImage } from '@/lib/api/images'
import { Button } from '@/components/ui/button'
import { toast, toastMessages } from '@/lib/utils/toast'
import { cn } from '@/lib/utils/cn'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface ImageGalleryProps {
  images: ImageMetadata[]
  onImageDeleted?: (imageId: number) => void
  onImageClick?: (image: ImageMetadata) => void
  columns?: 2 | 3 | 4 | 5
  className?: string
}

export function ImageGallery({
  images,
  onImageDeleted,
  onImageClick,
  columns = 4,
  className,
}: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<ImageMetadata | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const [zoom, setZoom] = useState(1)
  const [isDeleting, setIsDeleting] = useState(false)

  // Keyboard navigation
  useEffect(() => {
    if (!selectedImage) return

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          handleClose()
          break
        case 'ArrowLeft':
          navigateImage('prev')
          break
        case 'ArrowRight':
          navigateImage('next')
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

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedImage, selectedIndex])

  // Open lightbox
  const openLightbox = (image: ImageMetadata, index: number) => {
    setSelectedImage(image)
    setSelectedIndex(index)
    setZoom(1)
    if (onImageClick) {
      onImageClick(image)
    }
  }

  // Close lightbox
  const handleClose = () => {
    setSelectedImage(null)
    setZoom(1)
  }

  // Navigate images
  const navigateImage = (direction: 'prev' | 'next') => {
    if (!selectedImage) return

    let newIndex = selectedIndex
    if (direction === 'prev') {
      newIndex = selectedIndex > 0 ? selectedIndex - 1 : images.length - 1
    } else {
      newIndex = selectedIndex < images.length - 1 ? selectedIndex + 1 : 0
    }

    setSelectedImage(images[newIndex])
    setSelectedIndex(newIndex)
    setZoom(1)
  }

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3))
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5))
  const handleResetZoom = () => setZoom(1)

  // Download image
  const handleDownload = async (image: ImageMetadata) => {
    try {
      const response = await fetch(image.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = image.filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Image téléchargée', image.filename)
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Erreur', 'Impossible de télécharger l\'image')
    }
  }

  // Delete image
  const handleDelete = async (image: ImageMetadata) => {
    toast.withAction(`Supprimer cette image?`, {
      description: 'Cette action est définitive et ne peut être annulée',
      actionLabel: 'Supprimer',
      cancelLabel: 'Annuler',
      onAction: async () => {
        setIsDeleting(true)
        try {
          await deleteImage(image.id)
          toast.success('Image supprimée', 'L\'image a été supprimée avec succès')
          if (onImageDeleted) {
            onImageDeleted(image.id)
          }
          handleClose()
        } catch (error) {
          console.error('Delete error:', error)
          toast.error('Erreur', 'Impossible de supprimer l\'image')
        } finally {
          setIsDeleting(false)
        }
      },
    })
  }

  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
        <Maximize2 className="mx-auto h-12 w-12 text-slate-300 mb-3" />
        <p className="text-sm text-slate-500">Aucune image disponible</p>
      </div>
    )
  }

  return (
    <>
      {/* Gallery Grid */}
      <div className={cn('grid gap-4', gridCols[columns], className)}>
        {images.map((image, index) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ delay: index * 0.05 }}
            className="group relative aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => openLightbox(image, index)}
          >
            <img
              src={image.thumbnail_url || image.url}
              alt={image.description || image.filename}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />

            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                <p className="text-xs font-medium truncate">
                  {image.description || image.filename}
                </p>
                {image.body_part && (
                  <p className="text-xs text-slate-300 flex items-center gap-1 mt-1">
                    <Tag className="h-3 w-3" />
                    {image.body_part}
                  </p>
                )}
                <p className="text-xs text-slate-300 flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(image.created_at), 'dd MMM yyyy', { locale: fr })}
                </p>
              </div>
            </div>

            {/* Tags badge */}
            {image.tags && image.tags.length > 0 && (
              <div className="absolute top-2 left-2 flex gap-1">
                {image.tags.slice(0, 2).map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 text-xs font-medium bg-white/90 text-slate-700 rounded-full backdrop-blur-sm"
                  >
                    {tag}
                  </span>
                ))}
                {image.tags.length > 2 && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-white/90 text-slate-700 rounded-full backdrop-blur-sm">
                    +{image.tags.length - 2}
                  </span>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
            onClick={handleClose}
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="fixed top-4 right-4 z-60 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Navigation buttons */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigateImage('prev')
                  }}
                  className="fixed left-4 top-1/2 -translate-y-1/2 z-60 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    navigateImage('next')
                  }}
                  className="fixed right-4 top-1/2 -translate-y-1/2 z-60 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Toolbar */}
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-60 flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full p-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleZoomOut()
                }}
                className="p-2 hover:bg-white/20 text-white rounded-full transition-colors"
                disabled={zoom <= 0.5}
              >
                <ZoomOut className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleResetZoom()
                }}
                className="px-3 py-2 hover:bg-white/20 text-white text-sm font-medium rounded-full transition-colors"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleZoomIn()
                }}
                className="p-2 hover:bg-white/20 text-white rounded-full transition-colors"
                disabled={zoom >= 3}
              >
                <ZoomIn className="h-5 w-5" />
              </button>
              <div className="w-px h-6 bg-white/20" />
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDownload(selectedImage)
                }}
                className="p-2 hover:bg-white/20 text-white rounded-full transition-colors"
              >
                <Download className="h-5 w-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete(selectedImage)
                }}
                className="p-2 hover:bg-red-500/50 text-white rounded-full transition-colors"
                disabled={isDeleting}
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>

            {/* Image container */}
            <div
              className="absolute inset-0 flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.img
                key={selectedImage.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: zoom }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                src={selectedImage.url}
                alt={selectedImage.description || selectedImage.filename}
                className="max-w-full max-h-full object-contain"
                style={{ cursor: zoom > 1 ? 'move' : 'default' }}
              />
            </div>

            {/* Image info */}
            <div className="fixed bottom-4 left-4 right-4 z-60 max-w-2xl mx-auto bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">
                    {selectedImage.description || selectedImage.filename}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-300">
                    {selectedImage.body_part && (
                      <span className="flex items-center gap-1">
                        <Tag className="h-4 w-4" />
                        {selectedImage.body_part}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {format(new Date(selectedImage.created_at), 'dd MMMM yyyy', { locale: fr })}
                    </span>
                    {selectedImage.width && selectedImage.height && (
                      <span>
                        {selectedImage.width} × {selectedImage.height}
                      </span>
                    )}
                    <span>{(selectedImage.file_size / 1024 / 1024).toFixed(2)} MB</span>
                  </div>
                  {selectedImage.tags && selectedImage.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedImage.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 text-xs bg-white/20 rounded-full backdrop-blur-sm"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-sm text-slate-300">
                  {selectedIndex + 1} / {images.length}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
