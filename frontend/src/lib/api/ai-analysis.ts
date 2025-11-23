import apiClient from './client'

export enum AnalysisType {
  IMAGE = 'IMAGE',
  LAB_RESULT = 'LAB_RESULT',
  COMBINED = 'COMBINED',
}

export enum AIProvider {
  CLAUDE = 'CLAUDE',
  OPENAI = 'OPENAI',
  CUSTOM = 'CUSTOM',
}

export enum Severity {
  BENIGN = 'BENIGN',
  MILD = 'MILD',
  MODERATE = 'MODERATE',
  SEVERE = 'SEVERE',
  CRITICAL = 'CRITICAL',
  UNKNOWN = 'UNKNOWN',
}

export enum AnalysisStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  MODIFIED = 'MODIFIED',
}

export interface AIAnalysisCreate {
  analysis_type: AnalysisType
  patient_id: number
  consultation_id?: number
  ai_provider?: AIProvider
  ai_model?: string
  image_data?: string // Base64
  previous_analysis_id?: number
  additional_notes?: string
}

export interface AIAnalysisUpdate {
  status?: AnalysisStatus
  doctor_feedback?: string
  doctor_modified_diagnosis?: string
  feedback_rating?: number
  is_flagged_for_review?: boolean
  flagged_reason?: string
}

export interface AIAnalysisResponse {
  id: number
  analysis_type: AnalysisType
  patient_id: number
  doctor_id: number
  consultation_id?: number
  ai_provider: AIProvider
  ai_model: string
  created_at: string
  updated_at: string
  
  // Results
  primary_diagnosis?: string
  differential_diagnoses?: Array<{ condition: string; probability: string }>
  confidence_score?: number
  severity?: Severity
  clinical_findings?: string[]
  recommendations?: string[]
  reasoning?: string
  key_features_identified?: string[]
  risk_factors?: string[]
  
  status: AnalysisStatus
  doctor_feedback?: string
  doctor_modified_diagnosis?: string
}

export const aiAnalysisApi = {
  analyze: (data: AIAnalysisCreate) => apiClient.post<AIAnalysisResponse>('/ai-analysis/analyze', data),
  get: (id: number) => apiClient.get<AIAnalysisResponse>(`/ai-analysis/${id}`),
  update: (id: number, data: AIAnalysisUpdate) => apiClient.put<AIAnalysisResponse>(`/ai-analysis/${id}`, data),
}
