/**
 * Lab Analysis Types
 * Defines TypeScript types for lab result uploads and analysis
 */

export interface LabValue {
  test_name: string;
  value: number;
  unit: string;
  reference_min?: number | null;
  reference_max?: number | null;
  is_abnormal: boolean;
}

export interface LabResultUploadResponse {
  id: number;
  analysis_type: string;
  patient_id: number;
  doctor_id: number;
  consultation_id?: number | null;
  status: "PENDING" | "REVIEWED" | "ACCEPTED" | "REJECTED" | "MODIFIED";
  created_at: string;
  updated_at: string;
  lab_values_extracted: LabValue[];
  abnormal_values: Record<string, unknown>[];
  reference_ranges: Record<string, unknown>[];
  clinical_findings: string[];
  recommendations: string[];
  reasoning?: string;
  confidence_score?: number;
  error_message?: string;
}

export interface LabAnalysisState {
  isUploading: boolean;
  isAnalyzing: boolean;
  error: string | null;
  extractedValues: LabValue[];
  analysisResult: LabResultUploadResponse | null;
}
