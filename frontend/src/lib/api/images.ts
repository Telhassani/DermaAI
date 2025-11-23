/**
 * Images API endpoints wrapper
 * Handles image upload and analysis
 */

import { api } from './client'
import type { Image, ImageListParams } from '@/types/api'

/**
 * @deprecated Use Image from @/types/api instead
 * This interface matches the backend ConsultationImageResponse
 */
export interface ImageResponse {
  id: number
  consultation_id: number
  patient_id: number
  filename: string
  file_size: number
  mime_type: string
  image_data: string  // Base64 encoded
  notes?: string
  uploaded_at: string
  created_at?: string
  updated_at?: string
}

export async function uploadImage(patientId: number, file: File, consultationId?: number) {
  // Use FormData for multipart file upload (no Base64 conversion)
  const formData = new FormData()

  // Add file directly
  formData.append('file', file)

  // Add metadata fields
  formData.append('patient_id', patientId.toString())
  // Only add consultation_id if provided (otherwise send as empty/null)
  if (consultationId !== undefined) {
    formData.append('consultation_id', consultationId.toString())
  }
  formData.append('filename', file.name)
  formData.append('file_size', file.size.toString())
  formData.append('mime_type', file.type)

  const response = await api.images.create(formData)
  return response.data
}

export async function analyzeImage(imageId: number) {
  const response = await api.images.analyze(imageId)
  return response.data
}

/**
 * Get images for a specific consultation
 * Returns only images linked to this consultation
 */
export async function getConsultationImages(consultationId: number, params?: ImageListParams) {
  const response = await api.images.listByConsultation(consultationId, params)
  return response.data
}

/**
 * Get images for a specific patient
 */
export async function getPatientImages(patientId: number, params?: ImageListParams) {
  const response = await api.images.list(patientId, params)
  return response.data
}

/**
 * Validate image file before upload
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  const maxSize = 10 * 1024 * 1024 // 10MB

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Allowed: JPEG, PNG, GIF, WebP' }
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty' }
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File too large. Maximum size: 10MB' }
  }

  return { valid: true }
}

/**
 * Delete an image
 */
export async function deleteImage(imageId: number) {
  await api.images.delete(imageId)
}

/**
 * Update image metadata (notes)
 */
export async function updateImage(imageId: number, data: Partial<Image>) {
  const response = await api.images.update(imageId, data)
  return response.data
}
