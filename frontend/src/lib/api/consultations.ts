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
  consultation_date: string
  consultation_time: string
  notes?: string
  diagnosis?: string
  prescription_ids?: number[]
  created_at: string
  updated_at: string
}

export async function listConsultations(params?: any) {
  const response = await api.consultations.list(params)
  return response.data
}

export async function getConsultation(id: number) {
  const response = await api.consultations.get(id)
  return response.data
}

export async function createConsultation(data: Partial<ConsultationResponse>) {
  const response = await api.consultations.create(data)
  return response.data
}

export async function updateConsultation(
  id: number,
  data: Partial<ConsultationResponse>
) {
  const response = await api.consultations.update(id, data)
  return response.data
}

export async function deleteConsultation(id: number) {
  await api.consultations.delete(id)
}
