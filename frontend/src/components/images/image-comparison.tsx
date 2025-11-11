'use client'

import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { GripVertical, Maximize2, Calendar, ArrowRight } from 'lucide-react'
import { ImageMetadata } from '@/lib/api/images'
import { cn } from '@/lib/utils/cn'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface ImageComparisonProps {
  beforeImage: ImageMetadata
  afterImage: ImageMetadata
  defaultPosition?: number
  showLabels?: boolean
  className?: string
}

export function ImageComparison({
  beforeImage,
  afterImage,
  defaultPosition = 50,
  showLabels = true,
  className,
}: ImageComparisonProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [sliderPosition, setSliderPosition] = useState(defaultPosition)
  const [isDragging, setIsDragging] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Handle slider drag
  const handleMouseDown = () => {
    setIsDragging(true)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = (x / rect.width) * 100

    setSliderPosition(Math.max(0, Math.min(100, percentage)))
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = e.touches[0].clientX - rect.left
    const percentage = (x / rect.width) * 100

    setSliderPosition(Math.max(0, Math.min(100, percentage)))
  }

  // Setup event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      window.addEventListener('touchmove', handleTouchMove)
      window.addEventListener('touchend', handleMouseUp)
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleMouseUp)
    }
  }, [isDragging])

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  // Handle escape key in fullscreen
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false)
      }
    }

    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isFullscreen])

  const ComparisonContent = () => (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden rounded-xl bg-slate-100',
        isFullscreen && 'rounded-none'
      )}
    >
      {/* After image (background) */}
      <div className="relative w-full aspect-[4/3]">
        <img
          src={afterImage.url}
          alt="Après"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Before image (clipped) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img
            src={beforeImage.url}
            alt="Avant"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>

        {/* Slider */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-lg z-10"
          style={{ left: `${sliderPosition}%` }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
        >
          {/* Slider handle */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center cursor-grab active:cursor-grabbing">
            <GripVertical className="h-6 w-6 text-slate-600" />
          </div>
        </div>

        {/* Labels */}
        {showLabels && (
          <>
            <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Avant</p>
              <p className="text-xs text-slate-500">
                {format(new Date(beforeImage.created_at), 'dd MMM yyyy', { locale: fr })}
              </p>
            </div>
            <div className="absolute top-4 right-4 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Après</p>
              <p className="text-xs text-slate-500">
                {format(new Date(afterImage.created_at), 'dd MMM yyyy', { locale: fr })}
              </p>
            </div>
          </>
        )}

        {/* Fullscreen button */}
        <button
          onClick={toggleFullscreen}
          className="absolute bottom-4 right-4 p-2 bg-white/90 hover:bg-white backdrop-blur-sm rounded-lg shadow-sm transition-colors"
        >
          <Maximize2 className="h-5 w-5 text-slate-700" />
        </button>
      </div>
    </div>
  )

  if (isFullscreen) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black flex items-center justify-center"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setIsFullscreen(false)
          }
        }}
      >
        <button
          onClick={() => setIsFullscreen(false)}
          className="absolute top-4 right-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm rounded-lg transition-colors"
        >
          Fermer
        </button>
        <div className="w-full h-full p-4">
          <ComparisonContent />
        </div>
      </motion.div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      <ComparisonContent />

      {/* Descriptions */}
      {(beforeImage.description || afterImage.description) && (
        <div className="flex items-start gap-4 text-sm">
          {beforeImage.description && (
            <div className="flex-1">
              <p className="font-medium text-slate-700">Avant:</p>
              <p className="text-slate-600">{beforeImage.description}</p>
            </div>
          )}
          {afterImage.description && (
            <div className="flex-1">
              <p className="font-medium text-slate-700">Après:</p>
              <p className="text-slate-600">{afterImage.description}</p>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <p className="text-xs text-slate-500 text-center">
        Glissez le curseur pour comparer les images
      </p>
    </div>
  )
}

// Variant: Side by side comparison
interface SideBySideComparisonProps {
  beforeImage: ImageMetadata
  afterImage: ImageMetadata
  className?: string
}

export function SideBySideComparison({
  beforeImage,
  afterImage,
  className,
}: SideBySideComparisonProps) {
  return (
    <div className={cn('grid grid-cols-2 gap-4', className)}>
      {/* Before */}
      <div className="space-y-2">
        <div className="relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
          <img
            src={beforeImage.url}
            alt="Avant"
            className="w-full aspect-[4/3] object-cover"
          />
          <div className="absolute top-3 left-3 px-3 py-1.5 bg-red-500/90 backdrop-blur-sm rounded-lg">
            <p className="text-sm font-semibold text-white">Avant</p>
          </div>
        </div>
        <div className="text-sm">
          <p className="font-medium text-slate-700 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {format(new Date(beforeImage.created_at), 'dd MMMM yyyy', { locale: fr })}
          </p>
          {beforeImage.description && (
            <p className="text-slate-600 mt-1">{beforeImage.description}</p>
          )}
        </div>
      </div>

      {/* After */}
      <div className="space-y-2">
        <div className="relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
          <img
            src={afterImage.url}
            alt="Après"
            className="w-full aspect-[4/3] object-cover"
          />
          <div className="absolute top-3 left-3 px-3 py-1.5 bg-green-500/90 backdrop-blur-sm rounded-lg">
            <p className="text-sm font-semibold text-white">Après</p>
          </div>
        </div>
        <div className="text-sm">
          <p className="font-medium text-slate-700 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {format(new Date(afterImage.created_at), 'dd MMMM yyyy', { locale: fr })}
          </p>
          {afterImage.description && (
            <p className="text-slate-600 mt-1">{afterImage.description}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// Variant: Timeline view
interface TimelineComparisonProps {
  images: ImageMetadata[]
  className?: string
}

export function TimelineComparison({ images, className }: TimelineComparisonProps) {
  const sortedImages = [...images].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Calendar className="h-4 w-4" />
        <span>Évolution chronologique • {sortedImages.length} étapes</span>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-8 top-12 bottom-12 w-0.5 bg-slate-200" />

        {/* Images */}
        <div className="space-y-8">
          {sortedImages.map((image, index) => (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative flex items-start gap-6"
            >
              {/* Timeline dot */}
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold shadow-lg z-10">
                  {index + 1}
                </div>
                {index < sortedImages.length - 1 && (
                  <ArrowRight className="absolute -bottom-6 left-1/2 -translate-x-1/2 h-5 w-5 text-slate-400" />
                )}
              </div>

              {/* Image card */}
              <div className="flex-1 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="flex gap-4 p-4">
                  <img
                    src={image.thumbnail_url || image.url}
                    alt={image.description || `Étape ${index + 1}`}
                    className="w-32 h-32 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">
                          Étape {index + 1}
                          {index === 0 && ' • Avant'}
                          {index === sortedImages.length - 1 && ' • Après'}
                        </p>
                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(image.created_at), 'dd MMMM yyyy', { locale: fr })}
                        </p>
                      </div>
                      {image.body_part && (
                        <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-full">
                          {image.body_part}
                        </span>
                      )}
                    </div>
                    {image.description && (
                      <p className="text-sm text-slate-600 mt-2">{image.description}</p>
                    )}
                    {image.tags && image.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {image.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
