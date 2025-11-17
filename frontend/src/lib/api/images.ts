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
  // Convert file to Base64
  const fileData = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      // Remove the data:image/...;base64, prefix
      const base64Data = base64.split(',')[1]
      resolve(base64Data)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  // If no consultation provided, use patientId as consultation ID
  // Backend will validate that this consultation belongs to the patient
  const consultation_id = consultationId || patientId

  const payload = {
    patient_id: patientId,
    consultation_id: consultation_id,
    image_data: fileData,
    filename: file.name,
    file_size: file.size,
    mime_type: file.type,
  }

  const response = await api.images.create(payload)
  return response.data
}

export async function analyzeImage(imageId: number) {
  const response = await api.images.analyze(imageId)
  return response.data
}

/**
 * Get images for a specific consultation
 * Note: Images are retrieved by patient, not consultation directly
 */
export async function getConsultationImages(consultationId: number, params?: ImageListParams) {
  // This endpoint doesn't exist yet - use patient images instead
  // TODO: Implement consultation-specific image retrieval if needed
  throw new Error('Use getPatientImages() instead - images are stored per patient')
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
