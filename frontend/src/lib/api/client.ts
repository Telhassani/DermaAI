/**
 * API Client configuration with Axios
 * Handles authentication, interceptors, and error handling
 */

import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { toast } from 'sonner'
import type {
  LoginRequest,
  PatientListParams,
  PatientCreateData,
  PatientUpdateData,
  AppointmentListParams,
  AppointmentCreateData,
  AppointmentUpdateData,
  AppointmentStatusUpdateData,
  ConflictCheckData,
  AppointmentStatsParams,
  ConsultationListParams,
  ConsultationCreateData,
  ConsultationUpdateData,
  PrescriptionListParams,
  PrescriptionCreateData,
  PrescriptionUpdateData,
  ImageListParams,
  ErrorResponse,
} from '@/types/api'

// API base URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Create axios instance
export const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable sending httpOnly cookies with cross-origin requests
  maxBodyLength: Infinity, // Allow large file uploads
  maxContentLength: Infinity, // Allow large responses
})

// Type for failed request queue
interface FailedQueueItem {
  resolve: (token: string) => void
  reject: (error: unknown) => void
}

// Track if we're already attempting to refresh token to avoid infinite loops
let isRefreshing = false
let failedQueue: FailedQueueItem[] = []

const processQueue = (error: unknown | null, token: string | null = null): void => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else if (token) {
      prom.resolve(token)
    }
  })

  isRefreshing = false
  failedQueue = []
}

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage
    const token = localStorage.getItem('access_token')

    // Add token to headers if it exists
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
      // Only log in development mode to avoid security issues in production
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[API] Request to ${config.url}`)
      }
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[API] No token found for request to ${config.url}`)
      }
    }

    // For FormData, don't set Content-Type header - let axios/browser handle it
    // This ensures the multipart boundary is properly set
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  (error: AxiosError) => {
    const originalRequest: any = error.config

    // Handle different error status codes
    if (error.response) {
      const status = error.response.status
      const data: any = error.response.data

      switch (status) {
        case 401:
          // Unauthorized - Try to refresh token first
          if (!isRefreshing) {
            isRefreshing = true
            const refresh_token = localStorage.getItem('refresh_token')

            if (refresh_token && originalRequest.url !== '/auth/refresh') {
              // Try to refresh token
              apiClient
                .post('/auth/refresh', { refresh_token })
                .then((res) => {
                  const { access_token } = res.data
                  localStorage.setItem('access_token', access_token)
                  apiClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
                  originalRequest.headers['Authorization'] = `Bearer ${access_token}`

                  // Retry original request
                  processQueue(null, access_token)
                  return apiClient(originalRequest)
                })
                .catch((err) => {
                  // Refresh failed - logout
                  localStorage.removeItem('access_token')
                  localStorage.removeItem('refresh_token')
                  localStorage.removeItem('user')
                  processQueue(err, null)
                  if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth')) {
                    window.location.href = '/login'
                  }
                  toast.error('Session expirée. Veuillez vous reconnecter.')
                })
            } else {
              // No refresh token or already refreshing - logout
              localStorage.removeItem('access_token')
              localStorage.removeItem('refresh_token')
              localStorage.removeItem('user')
              processQueue(error, null)
              if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth')) {
                window.location.href = '/login'
              }
              toast.error('Session expirée. Veuillez vous reconnecter.')
            }
          }

          // Queue the request for retry
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          })
            .then((token) => {
              originalRequest.headers['Authorization'] = `Bearer ${token}`
              return apiClient(originalRequest)
            })
            .catch((err) => {
              return Promise.reject(err)
            })

        case 403:
          // Forbidden - insufficient permissions
          toast.error('Accès refusé. Permissions insuffisantes.')
          break

        case 404:
          // Not found
          toast.error(data?.detail || 'Ressource non trouvée')
          break

        case 409:
          // Conflict
          toast.error(data?.detail || 'Conflit détecté')
          break

        case 422:
          // Validation error
          const validationErrors = data?.detail
          if (Array.isArray(validationErrors)) {
            validationErrors.forEach((err: any) => {
              toast.error(`${err.loc?.join(' > ')}: ${err.msg}`)
            })
          } else {
            toast.error(data?.detail || 'Erreur de validation')
          }
          break

        case 500:
          // Internal server error
          toast.error('Erreur serveur. Veuillez réessayer plus tard.')
          break

        default:
          toast.error(data?.detail || 'Une erreur est survenue')
      }
    } else if (error.request) {
      // Request was made but no response received
      toast.error('Erreur réseau. Vérifiez votre connexion.')
    } else {
      // Something else happened
      toast.error('Une erreur inattendue est survenue')
    }

    return Promise.reject(error)
  }
)

// API endpoints with proper TypeScript types
export const api = {
  // Authentication
  auth: {
    login: (data: LoginRequest) => {
      // Convert to FormData for OAuth2PasswordRequestForm
      const formData = new URLSearchParams()
      formData.append('username', data.username)
      formData.append('password', data.password)

      return apiClient.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
    },
    register: (data: PatientCreateData) => apiClient.post('/auth/register', data),
    me: () => apiClient.get('/auth/me'),
    refreshToken: (refresh_token: string) =>
      apiClient.post('/auth/refresh', { refresh_token }),
  },

  // Patients
  patients: {
    list: (params?: PatientListParams) => apiClient.get('/patients', { params }),
    get: (id: number) => apiClient.get(`/patients/${id}`),
    create: (data: PatientCreateData) => apiClient.post('/patients', data),
    update: (id: number, data: PatientUpdateData) =>
      apiClient.put(`/patients/${id}`, data),
    delete: (id: number) => apiClient.delete(`/patients/${id}`),
    stats: (id: number) => apiClient.get(`/patients/${id}/stats`),
  },

  // Appointments
  appointments: {
    list: (params?: AppointmentListParams) =>
      apiClient.get('/appointments', { params }),
    get: (id: number) => apiClient.get(`/appointments/${id}`),
    create: (data: AppointmentCreateData) =>
      apiClient.post('/appointments', data),
    update: (id: number, data: AppointmentUpdateData) =>
      apiClient.put(`/appointments/${id}`, data),
    updateStatus: (id: number, data: AppointmentStatusUpdateData) =>
      apiClient.patch(`/appointments/${id}/status`, data),
    delete: (id: number) => apiClient.delete(`/appointments/${id}`),
    checkConflicts: (data: ConflictCheckData) =>
      apiClient.post('/appointments/check-conflicts', data),
    stats: (params?: AppointmentStatsParams) =>
      apiClient.get('/appointments/stats/overview', { params }),
  },

  // Consultations
  consultations: {
    list: (params?: ConsultationListParams) =>
      apiClient.get('/consultations', { params }),
    get: (id: number) => apiClient.get(`/consultations/${id}`),
    create: (data: ConsultationCreateData) =>
      apiClient.post('/consultations', data),
    update: (id: number, data: ConsultationUpdateData) =>
      apiClient.put(`/consultations/${id}`, data),
    delete: (id: number) => apiClient.delete(`/consultations/${id}`),
  },

  // Prescriptions
  prescriptions: {
    list: (params?: PrescriptionListParams) =>
      apiClient.get('/prescriptions', { params }),
    get: (id: number) => apiClient.get(`/prescriptions/${id}`),
    create: (data: PrescriptionCreateData) =>
      apiClient.post('/prescriptions', data),
    update: (id: number, data: PrescriptionUpdateData) =>
      apiClient.put(`/prescriptions/${id}`, data),
    delete: (id: number) => apiClient.delete(`/prescriptions/${id}`),
    downloadPdf: (id: number) =>
      apiClient.get(`/prescriptions/${id}/pdf`, { responseType: 'blob' }),
  },

  // Images
  images: {
    list: (patientId: number, params?: ImageListParams) =>
      apiClient.get(`/images/patient/${patientId}`, { params }),
    listByConsultation: (consultationId: number, params?: ImageListParams) =>
      apiClient.get(`/images/consultation/${consultationId}`, { params }),
    get: (id: number) => apiClient.get(`/images/${id}`),
    create: (data: FormData | any) => apiClient.post('/images/', data),
    update: (id: number, data: any) => apiClient.put(`/images/${id}`, data),
    delete: (id: number) => apiClient.delete(`/images/${id}`),
    analyze: (id: number) => apiClient.post(`/images/${id}/analyze`, {}),
  },
}

export default apiClient
