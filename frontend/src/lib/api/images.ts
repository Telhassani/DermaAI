/**
 * Images API endpoints wrapper
 * Handles image upload and analysis
 */

import { api } from './client'

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
