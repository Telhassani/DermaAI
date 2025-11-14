/**
 * Consultation Image Types
 * Types for medical image management in consultations
 */

export interface ConsultationImage {
  id: number
  consultation_id: number
  image_url: string
  thumbnail_url: string | null
  original_filename: string
  file_size: number
  mime_type: string
  width: number | null
  height: number | null

  // Medical metadata
  image_type: string | null
  body_location: string | null
  description: string | null
  is_primary: boolean

  // EXIF data
  captured_at: string | null
  camera_model: string | null

  // Timestamps
  created_at: string
  updated_at: string
}

export interface ConsultationImageListResponse {
  images: ConsultationImage[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface ImageUploadResponse {
  id: number
  consultation_id: number
  image_url: string
  thumbnail_url: string | null
  original_filename: string
  file_size: number
  mime_type: string
  message: string
}

export interface ConsultationImageUpdate {
  image_type?: string
  body_location?: string
  description?: string
  is_primary?: boolean
}

export interface ImageUploadFormData {
  file: File
  image_type?: string
  body_location?: string
  description?: string
  is_primary?: boolean
}

// Helper types for UI
export interface ImagePreview {
  file: File
  preview: string
  metadata: {
    size: number
    type: string
    name: string
  }
}
