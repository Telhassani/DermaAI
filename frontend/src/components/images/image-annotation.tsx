'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Square,
  Circle,
  Type,
  Pencil,
  Eraser,
  Save,
  X,
  Undo,
  Redo,
  Trash2,
  Download,
} from 'lucide-react'
import { ImageMetadata, ImageAnnotation, addAnnotation, deleteAnnotation } from '@/lib/api/images'
import { Button } from '@/components/ui/button'
import { toast } from '@/lib/utils/toast'
import { cn } from '@/lib/utils/cn'

interface ImageAnnotationEditorProps {
  image: ImageMetadata
  onSave?: (annotations: ImageAnnotation[]) => void
  onClose?: () => void
  className?: string
}

type AnnotationTool = 'select' | 'rectangle' | 'circle' | 'arrow' | 'text' | 'pen'

interface DrawingAnnotation {
  id: string
  type: AnnotationTool
  x: number
  y: number
  width?: number
  height?: number
  radius?: number
  text?: string
  color: string
  label: string
  points?: { x: number; y: number }[]
}

const COLORS = [
  { name: 'Rouge', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Jaune', value: '#EAB308' },
  { name: 'Vert', value: '#22C55E' },
  { name: 'Bleu', value: '#3B82F6' },
  { name: 'Violet', value: '#A855F7' },
  { name: 'Rose', value: '#EC4899' },
]

export function ImageAnnotationEditor({
  image,
  onSave,
  onClose,
  className,
}: ImageAnnotationEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [tool, setTool] = useState<AnnotationTool>('rectangle')
  const [color, setColor] = useState(COLORS[0].value)
  const [annotations, setAnnotations] = useState<DrawingAnnotation[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentAnnotation, setCurrentAnnotation] = useState<DrawingAnnotation | null>(null)
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null)
  const [history, setHistory] = useState<DrawingAnnotation[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isSaving, setIsSaving] = useState(false)
  const [showLabelInput, setShowLabelInput] = useState(false)
  const [labelText, setLabelText] = useState('')
  const [imageLoaded, setImageLoaded] = useState(false)

  // Load existing annotations
  useEffect(() => {
    if (image.annotations && image.annotations.length > 0) {
      const existingAnnotations: DrawingAnnotation[] = image.annotations.map((ann) => ({
        id: ann.id.toString(),
        type: 'rectangle',
        x: ann.x,
        y: ann.y,
        width: ann.width,
        height: ann.height,
        color: ann.color || COLORS[0].value,
        label: ann.label,
      }))
      setAnnotations(existingAnnotations)
      setHistory([existingAnnotations])
      setHistoryIndex(0)
    }
  }, [image])

  // Redraw canvas whenever annotations change
  useEffect(() => {
    if (imageLoaded) {
      drawCanvas()
    }
  }, [annotations, currentAnnotation, imageLoaded])

  // Handle image load
  const handleImageLoad = () => {
    setImageLoaded(true)
    if (canvasRef.current && imageRef.current) {
      canvasRef.current.width = imageRef.current.width
      canvasRef.current.height = imageRef.current.height
      drawCanvas()
    }
  }

  // Draw canvas
  const drawCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx || !imageRef.current) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw all annotations
    ;[...annotations, currentAnnotation].filter(Boolean).forEach((ann) => {
      if (!ann) return
      ctx.strokeStyle = ann.color
      ctx.fillStyle = ann.color + '33' // 20% opacity
      ctx.lineWidth = 3

      switch (ann.type) {
        case 'rectangle':
          if (ann.width && ann.height) {
            ctx.strokeRect(ann.x, ann.y, ann.width, ann.height)
            ctx.fillRect(ann.x, ann.y, ann.width, ann.height)
          }
          break

        case 'circle':
          if (ann.radius) {
            ctx.beginPath()
            ctx.arc(ann.x, ann.y, ann.radius, 0, 2 * Math.PI)
            ctx.stroke()
            ctx.fill()
          }
          break

        case 'pen':
          if (ann.points && ann.points.length > 1) {
            ctx.beginPath()
            ctx.moveTo(ann.points[0].x, ann.points[0].y)
            ann.points.forEach((point) => {
              ctx.lineTo(point.x, point.y)
            })
            ctx.stroke()
          }
          break
      }

      // Draw label
      if (ann.label) {
        ctx.font = '14px sans-serif'
        ctx.fillStyle = '#FFFFFF'
        const textWidth = ctx.measureText(ann.label).width
        ctx.fillRect(ann.x - 2, ann.y - 22, textWidth + 8, 20)
        ctx.fillStyle = ann.color
        ctx.fillText(ann.label, ann.x + 2, ann.y - 6)
      }
    })
  }

  // Get mouse position relative to canvas
  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  // Start drawing
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (tool === 'select') return

    const pos = getMousePos(e)
    setIsDrawing(true)
    setStartPoint(pos)

    const newAnnotation: DrawingAnnotation = {
      id: Date.now().toString(),
      type: tool,
      x: pos.x,
      y: pos.y,
      color,
      label: '',
      points: tool === 'pen' ? [pos] : undefined,
    }

    setCurrentAnnotation(newAnnotation)
  }

  // Continue drawing
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint || !currentAnnotation) return

    const pos = getMousePos(e)

    switch (tool) {
      case 'rectangle':
        setCurrentAnnotation({
          ...currentAnnotation,
          width: pos.x - startPoint.x,
          height: pos.y - startPoint.y,
        })
        break

      case 'circle':
        const radius = Math.sqrt(
          Math.pow(pos.x - startPoint.x, 2) + Math.pow(pos.y - startPoint.y, 2)
        )
        setCurrentAnnotation({
          ...currentAnnotation,
          radius,
        })
        break

      case 'pen':
        setCurrentAnnotation({
          ...currentAnnotation,
          points: [...(currentAnnotation.points || []), pos],
        })
        break
    }
  }

  // Finish drawing
  const handleMouseUp = () => {
    if (!isDrawing || !currentAnnotation) return

    setIsDrawing(false)
    setShowLabelInput(true)
  }

  // Add label to annotation
  const handleAddLabel = () => {
    if (!currentAnnotation) return

    const newAnnotation = {
      ...currentAnnotation,
      label: labelText,
    }

    const newAnnotations = [...annotations, newAnnotation]
    setAnnotations(newAnnotations)

    // Update history
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newAnnotations)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)

    // Reset
    setCurrentAnnotation(null)
    setLabelText('')
    setShowLabelInput(false)
  }

  // Cancel current annotation
  const handleCancelLabel = () => {
    setCurrentAnnotation(null)
    setLabelText('')
    setShowLabelInput(false)
  }

  // Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setAnnotations(history[historyIndex - 1])
    }
  }

  // Redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setAnnotations(history[historyIndex + 1])
    }
  }

  // Clear all
  const handleClear = () => {
    setAnnotations([])
    setHistory([[]])
    setHistoryIndex(0)
  }

  // Save annotations
  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Convert to API format and save
      const promises = annotations.map((ann) =>
        addAnnotation(image.id, {
          x: ann.x,
          y: ann.y,
          width: ann.width || 0,
          height: ann.height || 0,
          label: ann.label,
          color: ann.color,
        })
      )

      await Promise.all(promises)
      toast.success('Annotations enregistrées', `${annotations.length} annotation(s) sauvegardée(s)`)

      if (onSave) {
        // Fetch updated image with annotations
        const apiAnnotations: ImageAnnotation[] = annotations.map((ann, i) => ({
          id: i,
          image_id: image.id,
          x: ann.x,
          y: ann.y,
          width: ann.width || 0,
          height: ann.height || 0,
          label: ann.label,
          color: ann.color,
          created_at: new Date().toISOString(),
          created_by: 1, // TODO: Get from auth context
        }))
        onSave(apiAnnotations)
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Erreur', 'Impossible de sauvegarder les annotations')
    } finally {
      setIsSaving(false)
    }
  }

  // Download annotated image
  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${image.filename.replace(/\.[^/.]+$/, '')}_annotated.png`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Image téléchargée', 'Image avec annotations')
      }
    })
  }

  return (
    <div className={cn('flex flex-col h-full bg-slate-50', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 p-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          {/* Tools */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <Button
              variant={tool === 'rectangle' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTool('rectangle')}
              title="Rectangle"
            >
              <Square className="h-4 w-4" />
            </Button>
            <Button
              variant={tool === 'circle' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTool('circle')}
              title="Cercle"
            >
              <Circle className="h-4 w-4" />
            </Button>
            <Button
              variant={tool === 'pen' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setTool('pen')}
              title="Crayon"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>

          {/* Colors */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg ml-2">
            {COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                className={cn(
                  'w-8 h-8 rounded-md border-2 transition-all',
                  color === c.value ? 'border-slate-900 scale-110' : 'border-transparent'
                )}
                style={{ backgroundColor: c.value }}
                title={c.name}
              />
            ))}
          </div>

          {/* History */}
          <div className="flex items-center gap-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title="Annuler"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Refaire"
            >
              <Redo className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              disabled={annotations.length === 0}
              title="Tout effacer"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Télécharger
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving || annotations.length === 0}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
        <div className="relative inline-block">
          <img
            ref={imageRef}
            src={image.url}
            alt={image.filename}
            className="max-w-full h-auto"
            onLoad={handleImageLoad}
            style={{ display: imageLoaded ? 'block' : 'none' }}
          />
          {imageLoaded && (
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 cursor-crosshair"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => setIsDrawing(false)}
            />
          )}
        </div>
      </div>

      {/* Label input modal */}
      <AnimatePresence>
        {showLabelInput && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCancelLabel}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Ajouter un label</h3>
              <input
                type="text"
                value={labelText}
                onChange={(e) => setLabelText(e.target.value)}
                placeholder="Ex: Lésion suspecte, Zone inflammatoire..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddLabel()
                  if (e.key === 'Escape') handleCancelLabel()
                }}
              />
              <div className="flex items-center justify-end gap-3 mt-4">
                <Button variant="outline" onClick={handleCancelLabel}>
                  Annuler
                </Button>
                <Button onClick={handleAddLabel} disabled={!labelText.trim()}>
                  Ajouter
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info */}
      <div className="p-4 bg-white border-t border-slate-200 text-sm text-slate-600">
        <p>
          <strong>{annotations.length}</strong> annotation{annotations.length > 1 ? 's' : ''} •
          Cliquez et glissez pour dessiner • Utilisez les outils ci-dessus
        </p>
      </div>
    </div>
  )
}
