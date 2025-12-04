'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, AlertCircle, CheckCircle2, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { useFileUpload, FileUploadProgress } from '@/lib/hooks/useFileUpload'

interface EnhancedImageUploadProps {
  patientId: number
  consultationId?: number
  onSuccess: (imageData: any) => void
  onError?: (error: string) => void
  endpoint?: string
  disabled?: boolean
  showProgressBar?: boolean
}

/**
 * Enhanced image upload component with real-time progress tracking
 * Supports drag-and-drop and displays upload percentage and speed
 */
export function EnhancedImageUpload({
  patientId,
  consultationId,
  onSuccess,
  onError,
  endpoint = '/api/v1/images',
  disabled = false,
  showProgressBar = true,
}: EnhancedImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadSpeed, setUploadSpeed] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const startTimeRef = useRef<number>(0)
  const lastLoadedRef = useRef<number>(0)

  const {
    upload,
    progress,
    isUploading,
    cancel,
    validateFile,
  } = useFileUpload({
    maxFileSize: 10 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    onProgress: (prog) => {
      // Calculate speed
      const elapsed = Date.now() - startTimeRef.current
      if (elapsed > 0) {
        const speed = prog.loaded / (elapsed / 1000)
        setUploadSpeed(speed)
      }
      lastLoadedRef.current = prog.loaded
    },
    onSuccess: (data) => {
      setSelectedFile(null)
      onSuccess(data)
    },
    onError: (error) => {
      onError?.(error)
    },
  })

  useEffect(() => {
    if (isUploading && startTimeRef.current === 0) {
      startTimeRef.current = Date.now()
      lastLoadedRef.current = 0
    }
    if (!isUploading) {
      startTimeRef.current = 0
      lastLoadedRef.current = 0
    }
  }, [isUploading])

  const handleFileSelect = useCallback(
    async (file: File) => {
      // Validate file
      const validation = validateFile(file)
      if (!validation.valid) {
        onError?.(validation.error || 'File validation failed')
        return
      }

      setSelectedFile(file)

      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('patient_id', patientId.toString())
        if (consultationId) {
          formData.append('consultation_id', consultationId.toString())
        }
        formData.append('filename', file.name)
        formData.append('file_size', file.size.toString())
        formData.append('mime_type', file.type)

        await upload(file, formData, endpoint)
      } catch (error) {
        console.error('Upload error:', error)
      }
    },
    [patientId, consultationId, endpoint, upload, validateFile, onError]
  )

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled && !isUploading) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files.length > 0 && !isUploading) {
      handleFileSelect(files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleCancel = () => {
    cancel()
    setSelectedFile(null)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const formatSpeed = (bytesPerSecond: number) => {
    return (bytesPerSecond / (1024 * 1024)).toFixed(1) + ' MB/s'
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) {
      return Math.round(seconds) + 's'
    }
    const minutes = Math.round(seconds / 60)
    return minutes + 'm'
  }

  const isError = progress.status === 'error'
  const isSuccess = progress.status === 'success'

  return (
    <div className="space-y-4">
      {/* Drag and Drop Area */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer',
          isDragging && !isUploading
            ? 'border-purple-500 bg-purple-50'
            : isError
              ? 'border-red-300 bg-red-50'
              : isSuccess
                ? 'border-green-300 bg-green-50'
                : 'border-gray-300 bg-gray-50 hover:border-gray-400',
          (disabled || isUploading) && 'opacity-60 cursor-not-allowed'
        )}
      >
        <div className="flex flex-col items-center justify-center space-y-3">
          {isSuccess ? (
            <>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Upload successful</p>
                <p className="text-xs text-gray-500 mt-1">{selectedFile?.name}</p>
              </div>
            </>
          ) : isError ? (
            <>
              <AlertCircle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-900">Upload failed</p>
                <p className="text-xs text-red-600 mt-1">{progress.error}</p>
              </div>
            </>
          ) : isUploading ? (
            <>
              <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
              <div>
                <p className="text-sm font-medium text-gray-900">Uploading...</p>
                <p className="text-xs text-gray-500 mt-1">{selectedFile?.name}</p>
              </div>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Drag and drop your image here
                </p>
                <p className="text-xs text-gray-500 mt-1">or click to browse</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
              >
                Browse Files
              </Button>
            </>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileInput}
          disabled={disabled || isUploading}
        />
      </div>

      {/* Progress Bar and Stats */}
      {isUploading && showProgressBar && (
        <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-900">Uploading</span>
              <span className="text-gray-600">{progress.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-purple-600 h-full transition-all duration-300 ease-out"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
          </div>

          {/* Upload Stats */}
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="bg-white rounded p-2">
              <p className="text-gray-500">Uploaded</p>
              <p className="font-medium text-gray-900">
                {formatFileSize(progress.loaded)} / {formatFileSize(progress.total)}
              </p>
            </div>
            <div className="bg-white rounded p-2">
              <p className="text-gray-500">Speed</p>
              <p className="font-medium text-gray-900">
                {uploadSpeed > 0 ? formatSpeed(uploadSpeed) : '0 MB/s'}
              </p>
            </div>
            <div className="bg-white rounded p-2">
              <p className="text-gray-500">ETA</p>
              <p className="font-medium text-gray-900">
                {progress.estimatedTimeRemaining
                  ? formatTime(progress.estimatedTimeRemaining)
                  : '--'}
              </p>
            </div>
          </div>

          {/* Cancel Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            className="w-full"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel Upload
          </Button>
        </div>
      )}

      {/* Error Alert */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {progress.error || 'An error occurred during upload'}
          </AlertDescription>
        </Alert>
      )}

      {/* File Info */}
      {selectedFile && !isUploading && !isError && !isSuccess && (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-8 w-8 rounded bg-purple-100">
                <span className="text-sm font-medium text-purple-600">🖼️</span>
              </div>
            </div>
            <div className="text-sm">
              <p className="font-medium text-gray-900">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedFile(null)}
            disabled={isUploading}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Supported Formats Info */}
      {!selectedFile && !isUploading && (
        <div className="text-xs text-gray-500 space-y-1">
          <p className="font-medium">Supported formats:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>JPEG, PNG, GIF, WebP images</li>
            <li>Maximum file size: 10MB</li>
          </ul>
        </div>
      )}
    </div>
  )
}
