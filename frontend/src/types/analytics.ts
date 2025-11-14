/**
 * Analytics Types
 * Types for dashboard analytics and statistics
 */

// ======================
// Global Statistics
// ======================

export interface PeriodInfo {
  start_date: string
  end_date: string
  days: number
}

export interface GlobalStats {
  active_patients: number
  total_consultations: number
  consultations_this_month: number
  total_appointments: number
  upcoming_appointments: number
  total_prescriptions: number
  period: PeriodInfo
}

// ======================
// Timeline Data
// ======================

export interface TimelineDataPoint {
  date: string
  count: number
}

export interface ConsultationTimeline {
  data: TimelineDataPoint[]
  granularity: 'day' | 'week' | 'month'
}

export interface AppointmentTimelineDataPoint {
  date: string
  scheduled: number
  completed: number
  cancelled: number
  total: number
}

export interface AppointmentTimeline {
  data: AppointmentTimelineDataPoint[]
}

// ======================
// Distribution Data
// ======================

export interface CategoryCount {
  type: string
  count: number
}

export interface ConsultationByType {
  data: CategoryCount[]
}

export interface DiagnosisCount {
  diagnosis: string
  count: number
  percentage: number
}

export interface TopDiagnoses {
  data: DiagnosisCount[]
}

// ======================
// Appointment Statistics
// ======================

export interface AppointmentStats {
  by_status: Record<string, number>
  total: number
  completion_rate: number
  cancellation_rate: number
  no_show_rate: number
}

// ======================
// Patient Analytics
// ======================

export interface PatientGrowthDataPoint {
  date: string
  count: number
  cumulative: number
}

export interface PatientGrowth {
  data: PatientGrowthDataPoint[]
}

export interface AgeDistributionDataPoint {
  age_group: string
  count: number
}

export interface AgeDistribution {
  data: AgeDistributionDataPoint[]
}

// ======================
// Prescription Statistics
// ======================

export interface PrescriptionStats {
  total: number
  by_status: Record<string, number>
  average_medications: number
}

// ======================
// Recent Activity
// ======================

export interface ActivityItem {
  type: 'consultation' | 'appointment' | 'prescription'
  id: number
  patient_id: number
  patient_name: string
  date: string
  description: string
}

export interface RecentActivity {
  activities: ActivityItem[]
}

// ======================
// Dashboard Response
// ======================

export interface DashboardData {
  global_stats: GlobalStats
  consultation_timeline: TimelineDataPoint[]
  top_diagnoses: DiagnosisCount[]
  appointment_stats: AppointmentStats
  recent_activity: ActivityItem[]
}

// ======================
// Query Parameters
// ======================

export interface AnalyticsQueryParams {
  start_date?: string
  end_date?: string
  granularity?: 'day' | 'week' | 'month'
  limit?: number
}
