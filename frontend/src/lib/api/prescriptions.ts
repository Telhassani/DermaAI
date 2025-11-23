/**
 * Prescriptions API endpoints wrapper
 */

import { api } from './client'

export interface MedicationItem {
  id?: number
  name: string
  dosage: string
  frequency: string
  duration: string
}

export interface PrescriptionResponse {
  id: number
  patient_id: number
  doctor_id: number
  patient_name?: string
  prescription_date: string
  valid_until?: string
  control_date?: string
  medications?: MedicationItem[] | string[]
  instructions?: string
  dosage?: string
  duration?: string
  notes?: string
  is_printed?: boolean
  is_delivered?: boolean
  consultation_id?: number
  created_at: string
  updated_at: string
}

export async function listPrescriptions(params?: any) {
  const response = await api.prescriptions.list(params)
  return response.data
}

export async function getPrescription(id: number) {
  const response = await api.prescriptions.get(id)
  return response.data
}

export async function createPrescription(data: Partial<PrescriptionResponse>) {
  const response = await api.prescriptions.create(data)
  return response.data
}

export async function updatePrescription(
  id: number,
  data: Partial<PrescriptionResponse>
) {
  const response = await api.prescriptions.update(id, data)
  return response.data
}

export async function deletePrescription(id: number) {
  await api.prescriptions.delete(id)
}

export async function downloadPrescriptionPdf(id: number) {
  const response = await api.prescriptions.downloadPdf(id)
  return response.data
}

/**
 * Mark a prescription as printed
 */
export async function markPrescriptionPrinted(id: number) {
  const response = await api.prescriptions.update(id, { is_printed: true })
  return response.data
}
