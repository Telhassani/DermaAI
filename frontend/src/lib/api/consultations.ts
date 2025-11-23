/**
 * Consultations API endpoints wrapper
 */

import { api } from './client'

export interface ConsultationResponse {
  id: number
  patient_id: number
  doctor_id: number
  patient_name?: string
  chief_complaint?: string
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
  follow_up_required: boolean
  follow_up_date?: string
  notes?: string
  private_notes?: string
  images_taken: boolean
  biopsy_performed: boolean
  biopsy_results?: string
  consultation_date: string
  consultation_time: string
  prescription_ids?: number[]
  created_at: string
  updated_at: string
}

export interface ConsultationData {
  patient_id: number
  consultation_date: string
  chief_complaint: string
  symptoms: string
  duration_symptoms: string
  medical_history_notes: string
  clinical_examination: string
  dermatological_examination: string
  lesion_type: string
  lesion_location: string
  lesion_size: string
  lesion_color: string
  lesion_texture: string
  diagnosis: string
  differential_diagnosis: string
  treatment_plan: string
  follow_up_required: boolean
  follow_up_date: string
  notes: string
  private_notes: string
  images_taken: boolean
  biopsy_performed: boolean
  biopsy_results: string
}

export async function listConsultations(params?: any) {
  const response = await api.consultations.list(params)
  return response.data
}

export async function getConsultation(id: number) {
  const response = await api.consultations.get(id)
  return response.data
}

export async function createConsultation(data: Partial<ConsultationData>) {
  const response = await api.consultations.create(data as any)
  return response.data
}

export async function updateConsultation(
  id: number,
  data: Partial<ConsultationData>
) {
  const response = await api.consultations.update(id, data)
  return response.data
}

export async function deleteConsultation(id: number) {
  await api.consultations.delete(id)
}

/**
 * Get consultation history for a specific patient
 */
export async function getPatientConsultationHistory(patientId: number, params?: any) {
  const response = await api.consultations.list({ patient_id: patientId, ...params })
  return response.data
}
