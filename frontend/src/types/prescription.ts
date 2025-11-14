/**
 * Prescription types for DermaAI frontend
 */

export interface Medication {
  name: string
  dosage: string
  duration: string
  quantity: string
  instructions: string
  frequency?: string
  route?: string
}

export interface Prescription {
  id: number
  consultation_id: number
  patient_id: number
  doctor_id: number
  prescription_date: string
  valid_until: string | null
  medications: Medication[]
  instructions: string | null
  notes: string | null
  is_printed: boolean
  is_delivered: boolean
  created_at: string
  updated_at: string
}

export interface PrescriptionListResponse {
  prescriptions: Prescription[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface PrescriptionCreateRequest {
  consultation_id: number
  patient_id: number
  prescription_date?: string
  valid_until?: string
  medications: Medication[]
  instructions?: string
  notes?: string
}

export interface PrescriptionUpdateRequest {
  valid_until?: string
  medications?: Medication[]
  instructions?: string
  notes?: string
  is_printed?: boolean
  is_delivered?: boolean
}
