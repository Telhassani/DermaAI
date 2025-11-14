/**
 * Consultation types for TypeScript
 */

export interface Consultation {
  id: number
  patient_id: number
  doctor_id: number
  appointment_id: number | null
  consultation_date: string
  consultation_time: string
  chief_complaint: string
  symptoms: string | null
  duration_symptoms: string | null
  medical_history_notes: string | null
  clinical_examination: string | null
  dermatological_examination: string | null
  lesion_type: string | null
  lesion_location: string | null
  lesion_size: string | null
  lesion_color: string | null
  lesion_texture: string | null
  diagnosis: string | null
  differential_diagnosis: string | null
  treatment_plan: string | null
  follow_up_required: boolean
  follow_up_date: string | null
  notes: string | null
  private_notes: string | null
  images_taken: boolean
  biopsy_performed: boolean
  biopsy_results: string | null
  created_at: string
  updated_at: string

  // Optional expanded fields (if backend includes them)
  patient_name?: string
  doctor_name?: string
}

export interface ConsultationListResponse {
  consultations: Consultation[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface ConsultationCreateRequest {
  patient_id: number
  doctor_id: number
  appointment_id?: number | null
  consultation_date: string
  consultation_time?: string
  chief_complaint: string
  symptoms?: string
  duration_symptoms?: string
  medical_history_notes?: string
  clinical_examination?: string
  dermatological_examination?: string
  lesion_type?: string
  lesion_location?: string
  lesion_size?: string
  lesion_color?: string
  lesion_texture?: string
  diagnosis?: string
  differential_diagnosis?: string
  treatment_plan?: string
  follow_up_required?: boolean
  follow_up_date?: string
  notes?: string
  private_notes?: string
  images_taken?: boolean
  biopsy_performed?: boolean
  biopsy_results?: string
}

export interface ConsultationUpdateRequest extends Partial<ConsultationCreateRequest> {}
