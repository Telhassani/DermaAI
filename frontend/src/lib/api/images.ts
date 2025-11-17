/**
 * Images API endpoints wrapper
 * Handles image upload and analysis
 */

import { api } from './client'
import type { Image, ImageListParams } from '@/types/api'

export interface ImageResponse {
  id: number
  patient_id: number
  file_path: string
  analysis_result?: any
  created_at: string
  updated_at: string
}

export async function uploadImage(patientId: number, file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await api.images.create(formData)
  return response.data
}

export async function analyzeImage(imageId: number) {
  const response = await api.images.analyze(imageId)
  return response.data
}

/**
 * Get images for a specific consultation
 */
export async function getConsultationImages(consultationId: number, params?: ImageListParams) {
  const response = await api.images.list({ ...params })
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
