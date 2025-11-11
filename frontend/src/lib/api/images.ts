import { uploadClient, apiClient } from './client'

export interface ImageMetadata {
  id: number
  patient_id: number
  filename: string
  file_size: number
  file_type: string
  url: string
  thumbnail_url?: string
  width?: number
  height?: number
  tags?: string[]
  description?: string
  body_part?: string
  consultation_id?: number
  created_at: string
  updated_at: string
  annotations?: ImageAnnotation[]
}

export interface ImageAnnotation {
  id: number
  image_id: number
  x: number
  y: number
  width: number
  height: number
  label: string
  color?: string
  notes?: string
  created_at: string
  created_by: number
}

export interface ImageUploadRequest {
  patient_id: number
  consultation_id?: number
  body_part?: string
  description?: string
  tags?: string[]
}

export interface ImageUploadResponse {
  images: ImageMetadata[]
  success_count: number
  error_count: number
  errors?: string[]
}

// Upload single or multiple images
export async function uploadImages(
  files: File[],
  metadata: ImageUploadRequest,
  onProgress?: (progress: number) => void
): Promise<ImageUploadResponse> {
  const formData = new FormData()

  // Add files
  files.forEach((file) => {
    formData.append('files', file)
  })

  // Add metadata
  formData.append('patient_id', metadata.patient_id.toString())
  if (metadata.consultation_id) {
    formData.append('consultation_id', metadata.consultation_id.toString())
  }
  if (metadata.body_part) {
    formData.append('body_part', metadata.body_part)
  }
  if (metadata.description) {
    formData.append('description', metadata.description)
  }
  if (metadata.tags && metadata.tags.length > 0) {
    formData.append('tags', JSON.stringify(metadata.tags))
  }

  const response = await uploadClient.post('/images/upload', formData, {
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress(percentCompleted)
      }
    },
  })

  return response.data
}

// Get images for a patient
export async function getPatientImages(
  patientId: number,
  params?: {
    consultation_id?: number
    body_part?: string
    tags?: string[]
    limit?: number
    offset?: number
  }
): Promise<ImageMetadata[]> {
  const response = await apiClient.get(`/patients/${patientId}/images`, { params })
  return response.data
}

// Get single image
export async function getImage(imageId: number): Promise<ImageMetadata> {
  const response = await apiClient.get(`/images/${imageId}`)
  return response.data
}

// Update image metadata
export async function updateImageMetadata(
  imageId: number,
  data: {
    description?: string
    tags?: string[]
    body_part?: string
  }
): Promise<ImageMetadata> {
  const response = await apiClient.patch(`/images/${imageId}`, data)
  return response.data
}

// Delete image
export async function deleteImage(imageId: number): Promise<void> {
  await apiClient.delete(`/images/${imageId}`)
}

// Add annotation to image
export async function addAnnotation(
  imageId: number,
  annotation: Omit<ImageAnnotation, 'id' | 'image_id' | 'created_at' | 'created_by'>
): Promise<ImageAnnotation> {
  const response = await apiClient.post(`/images/${imageId}/annotations`, annotation)
  return response.data
}

// Update annotation
export async function updateAnnotation(
  annotationId: number,
  data: Partial<Omit<ImageAnnotation, 'id' | 'image_id' | 'created_at' | 'created_by'>>
): Promise<ImageAnnotation> {
  const response = await apiClient.patch(`/annotations/${annotationId}`, data)
  return response.data
}

// Delete annotation
export async function deleteAnnotation(annotationId: number): Promise<void> {
  await apiClient.delete(`/annotations/${annotationId}`)
}

// Helper to validate image file
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic']

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Type de fichier non supporté. Utilisez JPG, PNG, WEBP ou HEIC.',
    }
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'Le fichier est trop volumineux. Taille maximale: 10MB.',
    }
  }

  return { valid: true }
}

// Helper to compress image before upload (optional)
export async function compressImage(file: File, maxWidth = 1920, quality = 0.9): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              })
              resolve(compressedFile)
            } else {
              reject(new Error('Compression failed'))
            }
          },
          file.type,
          quality
        )
      }
      img.onerror = reject
    }
    reader.onerror = reject
  })
}
