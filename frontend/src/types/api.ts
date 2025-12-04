/**
 * API Type Definitions
 * Defines all request and response types for backend API calls
 * Ensures type safety at the API boundary
 */

import { AppointmentStatus, AppointmentType } from '@/lib/hooks/use-appointments'

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface RegisterRequest {
  email: string
  password: string
  full_name: string
}

export interface User {
  id: number
  email: string
  full_name: string
  role: 'admin' | 'doctor' | 'secretary' | 'assistant'
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface RefreshTokenRequest {
  refresh_token: string
}

// ============================================================================
// PATIENT TYPES
// ============================================================================

export interface Patient {
  id: number
  user_id?: number
  doctor_id?: number
  first_name: string
  last_name: string
  full_name: string
  email?: string
  phone: string
  date_of_birth: string
  gender?: 'male' | 'female' | 'other'
  age?: number
  address?: string
  city?: string
  postal_code?: string
  country?: string
  identification_type?: string
  identification_number?: string
  insurance_number?: string
  medical_history?: string
  allergies?: string
  created_at: string
  updated_at: string
}

export interface PatientCreateData {
  email: string
  full_name: string
  date_of_birth: string
  gender?: 'M' | 'F' | 'Other'
  phone?: string
  address?: string
  medical_history?: string
  allergies?: string
}

export interface PatientUpdateData {
  full_name?: string
  date_of_birth?: string
  gender?: 'M' | 'F' | 'Other'
  phone?: string
  address?: string
  medical_history?: string
  allergies?: string
  is_active?: boolean
}

export interface PatientListParams {
  page?: number
  page_size?: number
  search?: string
  sort_by?: 'full_name' | 'created_at' | 'date_of_birth'
  sort_order?: 'asc' | 'desc'
  is_active?: boolean
}

export interface PatientListResponse {
  patients: Patient[]
  total: number
  page: number
  page_size: number
}

export interface PatientStats {
  total_appointments: number
  completed_appointments: number
  upcoming_appointments: number
  last_appointment: string | null
}

// ============================================================================
// APPOINTMENT TYPES
// ============================================================================

export interface Appointment {
  id: number
  patient_id: number | null
  doctor_id: number
  start_time: string
  end_time: string
  type: AppointmentType
  status: AppointmentStatus
  reason?: string | null
  notes?: string | null
  diagnosis?: string | null
  is_first_visit: boolean
  reminder_sent: boolean
  created_at: string
  updated_at: string
  duration_minutes: number
  is_upcoming: boolean
  is_past: boolean
  recurrence_rule?: Record<string, unknown> | null
  recurring_series_id?: number | null
  is_recurring?: boolean
  guest_name?: string
  guest_phone?: string
  guest_email?: string
}

export interface AppointmentCreateData {
  patient_id: number | null
  doctor_id: number
  start_time: string
  end_time: string
  type?: AppointmentType
  reason?: string
  notes?: string
  is_first_visit?: boolean
  recurrence_rule?: string
  guest_name?: string
  guest_phone?: string
  guest_email?: string
}

export interface AppointmentUpdateData {
  patient_id?: number | null
  doctor_id?: number
  start_time?: string
  end_time?: string
  type?: AppointmentType
  status?: AppointmentStatus
  reason?: string
  notes?: string
  diagnosis?: string
  is_first_visit?: boolean
  reminder_sent?: boolean
  guest_name?: string
  guest_phone?: string
  guest_email?: string
}

export interface AppointmentStatusUpdateData {
  status: AppointmentStatus
  notes?: string
}

export interface AppointmentListParams {
  patient_id?: number
  doctor_id?: number
  type?: AppointmentType
  status?: AppointmentStatus
  start_date?: string
  end_date?: string
  is_first_visit?: boolean
  page?: number
  page_size?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface AppointmentListResponse {
  appointments: Appointment[]
  total: number
  page: number
  page_size: number
}

export interface ConflictCheckData {
  start_time: string
  end_time: string
  doctor_id: number
  exclude_appointment_id?: number
}

export interface ConflictCheckResponse {
  has_conflict: boolean
  conflicts?: Appointment[]
  conflict_details?: string
}

export interface AppointmentStatsParams {
  start_date?: string
  end_date?: string
  doctor_id?: number
  patient_id?: number
}

export interface AppointmentStats {
  total_appointments: number
  scheduled: number
  confirmed: number
  in_progress: number
  completed: number
  cancelled: number
  no_show: number
  average_duration_minutes: number
}

// ============================================================================
// CONSULTATION TYPES
// ============================================================================

export interface Consultation {
  id: number
  patient_id: number
  doctor_id: number
  consultation_date: string
  consultation_time: string
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
  diagnosis?: string | null
  differential_diagnosis?: string
  treatment_plan?: string
  follow_up_required: boolean
  follow_up_date?: string | null
  notes?: string
  private_notes?: string
  images_taken: boolean
  biopsy_performed: boolean
  biopsy_results?: string
  created_at: string
  updated_at: string
}

export interface ConsultationCreateData {
  patient_id: number
  doctor_id: number
  consultation_date: string
  consultation_time: string
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

export interface ConsultationUpdateData {
  chief_complaint?: string
  symptoms?: string
  diagnosis?: string
  differential_diagnosis?: string
  treatment_plan?: string
  follow_up_required?: boolean
  follow_up_date?: string
  notes?: string
  private_notes?: string
  biopsy_performed?: boolean
  biopsy_results?: string
}

export interface ConsultationListParams {
  patient_id?: number
  patient_name?: string
  patient_identifier?: string
  doctor_id?: number
  page?: number
  page_size?: number
  start_date?: string
  end_date?: string
  sort_by?: 'created_at' | 'follow_up_date'
  sort_order?: 'asc' | 'desc'
}

export interface ConsultationListResponse {
  consultations: Consultation[]
  total: number
  page: number
  page_size: number
}

// ============================================================================
// PRESCRIPTION TYPES
// ============================================================================

export interface MedicationItem {
  name: string
  dosage: string
  frequency: string
  duration: string
  quantity: number
  route?: string
  instructions?: string
}

export interface Prescription {
  id: number
  patient_id: number
  doctor_id: number
  consultation_id: number
  medications: MedicationItem[]
  prescription_date: string
  valid_until?: string | null
  control_date?: string | null
  instructions?: string
  notes?: string
  is_printed: boolean
  is_delivered: boolean
  created_at: string
  updated_at: string
}

export interface PrescriptionCreateData {
  patient_id: number
  doctor_id: number
  consultation_id: number
  medications: MedicationItem[]
  prescription_date: string
  valid_until?: string
  control_date?: string
  instructions?: string
  notes?: string
}

export interface PrescriptionUpdateData {
  medications?: MedicationItem[]
  prescription_date?: string
  valid_until?: string | null
  control_date?: string | null
  instructions?: string
  notes?: string
  is_printed?: boolean
  is_delivered?: boolean
}

export interface PrescriptionListParams {
  patient_id?: number
  patient_name?: string
  patient_identifier?: string
  doctor_id?: number
  consultation_id?: number
  start_date?: string
  end_date?: string
  page?: number
  page_size?: number
  sort_by?: 'prescription_date' | 'valid_until' | 'created_at'
  sort_order?: 'asc' | 'desc'
}

export interface PrescriptionListResponse {
  prescriptions: Prescription[]
  total: number
  page: number
  page_size: number
}

// ============================================================================
// IMAGE TYPES
// ============================================================================

export interface Image {
  id: number
  consultation_id: number
  patient_id: number
  filename: string
  file_size: number
  mime_type: string
  image_data: string
  notes?: string
  uploaded_at: string
  created_at?: string
  updated_at?: string
}

export interface ImageAnalysis {
  id: number
  image_id: number
  findings: string
  confidence_score: number
  tags: string[]
  recommendations?: string
  analyzed_at: string
}

export interface ImageUploadData {
  patient_id: number
  doctor_id: number
  description?: string
  file: File
}

export interface ImageListParams {
  patient_id?: number
  doctor_id?: number
  page?: number
  page_size?: number
  sort_by?: 'uploaded_at' | 'created_at'
  sort_order?: 'asc' | 'desc'
}

export interface ImageListResponse {
  images: Image[]
  total: number
  page: number
  page_size: number
}

export interface ImageAnalyzeRequest {
  image_id: number
}

export interface ImageAnalyzeResponse {
  success: boolean
  analysis: ImageAnalysis
  message: string
}

// ============================================================================
// LAB CONVERSATIONS TYPES
// ============================================================================

export type MessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM'
export type MessageType = 'TEXT' | 'FILE' | 'ANALYSIS' | 'ERROR'
export type AttachmentType = 'LAB_RESULT' | 'IMAGE' | 'PDF' | 'OTHER'

export interface Attachment {
  id: number
  file_name: string
  file_path: string
  file_size?: number
  file_type: AttachmentType
  mime_type?: string
  is_processed: boolean
  extracted_data?: Record<string, unknown>
  created_at: string
}

export interface Message {
  id: number
  conversation_id: number
  role: MessageRole
  message_type: MessageType
  content: string
  model_used?: string
  prompt_tokens?: number
  completion_tokens?: number
  processing_time_ms?: number
  has_attachments: boolean
  attachments: Attachment[]
  is_edited: boolean
  created_at: string
  updated_at: string
}

export interface Conversation {
  id: number
  doctor_id: number
  title: string
  description?: string
  default_model?: string
  system_prompt?: string
  message_count: number
  last_message_at?: string
  is_pinned: boolean
  is_archived: boolean
  created_at: string
  updated_at: string
}

export interface ConversationDetail extends Conversation {
  messages: Message[]
}

export interface ConversationCreateData {
  title?: string
  description?: string
  default_model?: string
  system_prompt?: string
}

export interface ConversationUpdateData {
  title?: string
  description?: string
  default_model?: string
  system_prompt?: string
  is_pinned?: boolean
  is_archived?: boolean
}

export interface MessageCreateData {
  content: string
  message_type?: MessageType
  selected_model?: string
  file?: File
}

export interface ConversationListResponse {
  items: Conversation[]
  total: number
  skip: number
  limit: number
}

export interface MessageListResponse {
  items: Message[]
  total: number
  skip: number
  limit: number
}

export interface ConversationAnalytics {
  total_messages: number
  user_messages: number
  assistant_messages: number
  total_tokens_used: number
  total_processing_time_ms: number
  files_uploaded: number
  models_used: string[]
}

export interface ConversationListParams {
  skip?: number
  limit?: number
  is_archived?: boolean
  search?: string
}

export interface MessageListParams {
  skip?: number
  limit?: number
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ValidationError {
  loc: (string | number)[]
  msg: string
  type: string
}

export interface ErrorResponse {
  detail?: string | ValidationError[]
  message?: string
  status?: number
  timestamp?: string
}

export interface ApiError extends Error {
  status?: number
  response?: {
    data?: ErrorResponse
    status?: number
  }
}

// ============================================================================
// PAGINATION TYPES
// ============================================================================

export interface PaginationParams {
  page?: number
  page_size?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  page_size: number
}

// ============================================================================
// COMMON TYPES
// ============================================================================

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface ApiRequest {
  method: ApiMethod
  url: string
  data?: unknown
  params?: unknown
}

export interface ApiResponse<T = unknown> {
  data: T
  status: number
  statusText: string
}
