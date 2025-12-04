'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { toast } from 'sonner'

export interface FileUploadProgress {
  loaded: number
  total: number
  percentage: number
  status: 'idle' | 'uploading' | 'success' | 'error'
  error?: string
  estimatedTimeRemaining?: number
}

interface UseFileUploadOptions {
  maxFileSize?: number // in bytes, default 10MB
  allowedMimeTypes?: string[]
  onProgress?: (progress: FileUploadProgress) => void
  onSuccess?: (data: any) => void
  onError?: (error: string) => void
}

/**
 * Hook for handling file uploads with progress tracking
 * Uses XMLHttpRequest for fine-grained progress updates
 *
 * Example:
 * ```tsx
 * const { upload, progress, isUploading } = useFileUpload({
 *   maxFileSize: 10 * 1024 * 1024,
 *   onProgress: (p) => setProgress(p.percentage),
 *   onSuccess: () => toast.success('Upload complete!')
 * })
 *
 * await upload(file, formDataObject, '/api/v1/upload')
 * ```
 */
export function useFileUpload(options: UseFileUploadOptions = {}) {
  const {
    maxFileSize = 10 * 1024 * 1024,
    allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
    onProgress,
    onSuccess,
    onError,
  } = options

  const [progress, setProgress] = useState<FileUploadProgress>({
    loaded: 0,
    total: 0,
    percentage: 0,
    status: 'idle',
  })

  const [isUploading, setIsUploading] = useState(false)
  const xhrRef = useRef<XMLHttpRequest | null>(null)
  const startTimeRef = useRef<number>(0)

  // Validate file before upload
  const validateFile = useCallback(
    (file: File): { valid: boolean; error?: string } => {
      if (!allowedMimeTypes.includes(file.type)) {
        return {
          valid: false,
          error: `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`,
        }
      }

      if (file.size === 0) {
        return { valid: false, error: 'File is empty' }
      }

      if (file.size > maxFileSize) {
        const maxSizeMB = (maxFileSize / (1024 * 1024)).toFixed(1)
        return { valid: false, error: `File too large. Maximum size: ${maxSizeMB}MB` }
      }

      return { valid: true }
    },
    [allowedMimeTypes, maxFileSize]
  )

  // Cancel ongoing upload
  const cancel = useCallback(() => {
    if (xhrRef.current) {
      xhrRef.current.abort()
      xhrRef.current = null
      setProgress((prev) => ({ ...prev, status: 'idle' }))
      setIsUploading(false)
    }
  }, [])

  // Upload file with progress tracking
  const upload = useCallback(
    async (
      file: File,
      formData: FormData,
      endpoint: string,
      headers: Record<string, string> = {}
    ): Promise<any> => {
      // Validate file
      const validation = validateFile(file)
      if (!validation.valid) {
        const errorMsg = validation.error || 'File validation failed'
        setProgress((prev) => ({ ...prev, status: 'error', error: errorMsg }))
        onError?.(errorMsg)
        throw new Error(errorMsg)
      }

      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhrRef.current = xhr
        startTimeRef.current = Date.now()

        // Handle upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const loaded = event.loaded
            const total = event.total
            const percentage = Math.round((loaded / total) * 100)

            // Calculate estimated time remaining
            const elapsed = Date.now() - startTimeRef.current
            const speed = loaded / (elapsed / 1000) // bytes per second
            const remaining = total - loaded
            const estimatedTimeRemaining = speed > 0 ? remaining / speed : 0

            const progressData: FileUploadProgress = {
              loaded,
              total,
              percentage,
              status: 'uploading',
              estimatedTimeRemaining,
            }

            setProgress(progressData)
            onProgress?.(progressData)
          }
        })

        // Handle upload completion
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            let responseData: any = null
            try {
              responseData = JSON.parse(xhr.responseText)
            } catch {
              responseData = xhr.responseText
            }

            const successData: FileUploadProgress = {
              loaded: formData.get('file') instanceof File ? (formData.get('file') as File).size : 0,
              total: formData.get('file') instanceof File ? (formData.get('file') as File).size : 0,
              percentage: 100,
              status: 'success',
            }

            setProgress(successData)
            setIsUploading(false)
            onProgress?.(successData)
            onSuccess?.(responseData)
            resolve(responseData)
          } else {
            let errorMessage = 'Upload failed'
            try {
              const errorData = JSON.parse(xhr.responseText)
              errorMessage = errorData.detail || errorData.message || errorMessage
            } catch {
              errorMessage = xhr.statusText || errorMessage
            }

            const errorData: FileUploadProgress = {
              loaded: 0,
              total: 0,
              percentage: 0,
              status: 'error',
              error: errorMessage,
            }

            setProgress(errorData)
            setIsUploading(false)
            onProgress?.(errorData)
            onError?.(errorMessage)
            reject(new Error(errorMessage))
          }
        })

        // Handle upload error
        xhr.addEventListener('error', () => {
          const errorMessage = 'Network error during upload'
          const errorData: FileUploadProgress = {
            loaded: 0,
            total: 0,
            percentage: 0,
            status: 'error',
            error: errorMessage,
          }

          setProgress(errorData)
          setIsUploading(false)
          onProgress?.(errorData)
          onError?.(errorMessage)
          reject(new Error(errorMessage))
        })

        // Handle upload abort
        xhr.addEventListener('abort', () => {
          const errorMessage = 'Upload cancelled'
          const errorData: FileUploadProgress = {
            loaded: 0,
            total: 0,
            percentage: 0,
            status: 'error',
            error: errorMessage,
          }

          setProgress(errorData)
          setIsUploading(false)
          onProgress?.(errorData)
          reject(new Error(errorMessage))
        })

        // Set up request
        setIsUploading(true)
        setProgress({ loaded: 0, total: 0, percentage: 0, status: 'uploading' })

        xhr.open('POST', endpoint)

        // Get auth token from localStorage (same as API client)
        const token = localStorage.getItem('access_token')
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        }

        // Set custom headers
        Object.entries(headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value)
        })

        // Send request
        xhr.send(formData)
      })
    },
    [validateFile, onProgress, onSuccess, onError]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancel()
    }
  }, [cancel])

  return {
    upload,
    progress,
    isUploading,
    cancel,
    validateFile,
  }
}
