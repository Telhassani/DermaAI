/**
 * API Client configuration with Axios
 * Handles authentication, interceptors, and error handling
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { toast } from 'sonner'

// API base URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Create axios instance
export const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage
    const token = localStorage.getItem('access_token')

    // Add token to headers if it exists
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
      console.log(`[API] Sending request to ${config.url} with token:`, token.substring(0, 20) + '...')
    } else {
      console.log(`[API] No token found in localStorage for request to ${config.url}`)
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
    // Handle different error status codes
    if (error.response) {
      const status = error.response.status
      const data: any = error.response.data

      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('access_token')
          localStorage.removeItem('user')
          if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth')) {
            window.location.href = '/login'
          }
          toast.error('Session expirée. Veuillez vous reconnecter.')
          break

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

// API endpoints
export const api = {
  // Authentication
  auth: {
    login: (data: { username: string; password: string }) => {
      // Convert to FormData for OAuth2PasswordRequestForm
      const formData = new URLSearchParams()
      formData.append('username', data.username)
      formData.append('password', data.password)

      return apiClient.post('/auth/login', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
    },
    register: (data: any) => apiClient.post('/auth/register', data),
    me: () => apiClient.get('/auth/me'),
    refreshToken: (refresh_token: string) =>
      apiClient.post('/auth/refresh', { refresh_token }),
  },

  // Patients
  patients: {
    list: (params?: any) => apiClient.get('/patients', { params }),
    get: (id: number) => apiClient.get(`/patients/${id}`),
    create: (data: any) => apiClient.post('/patients', data),
    update: (id: number, data: any) => apiClient.put(`/patients/${id}`, data),
    delete: (id: number) => apiClient.delete(`/patients/${id}`),
    stats: (id: number) => apiClient.get(`/patients/${id}/stats`),
  },

  // Appointments
  appointments: {
    list: (params?: any) => apiClient.get('/appointments', { params }),
    get: (id: number) => apiClient.get(`/appointments/${id}`),
    create: (data: any) => apiClient.post('/appointments', data),
    update: (id: number, data: any) => apiClient.put(`/appointments/${id}`, data),
    updateStatus: (id: number, data: any) =>
      apiClient.patch(`/appointments/${id}/status`, data),
    delete: (id: number) => apiClient.delete(`/appointments/${id}`),
    checkConflicts: (data: any) => apiClient.post('/appointments/check-conflicts', data),
    stats: (params?: any) => apiClient.get('/appointments/stats/overview', { params }),
  },

  // Consultations
  consultations: {
    list: (params?: any) => apiClient.get('/consultations', { params }),
    get: (id: number) => apiClient.get(`/consultations/${id}`),
    create: (data: any) => apiClient.post('/consultations', data),
    update: (id: number, data: any) => apiClient.put(`/consultations/${id}`, data),
    delete: (id: number) => apiClient.delete(`/consultations/${id}`),
  },

  // Prescriptions
  prescriptions: {
    list: (params?: any) => apiClient.get('/prescriptions', { params }),
    get: (id: number) => apiClient.get(`/prescriptions/${id}`),
    create: (data: any) => apiClient.post('/prescriptions', data),
    update: (id: number, data: any) => apiClient.put(`/prescriptions/${id}`, data),
    delete: (id: number) => apiClient.delete(`/prescriptions/${id}`),
    downloadPdf: (id: number) =>
      apiClient.get(`/prescriptions/${id}/pdf`, { responseType: 'blob' }),
  },

  // Images
  images: {
    list: (params?: any) => apiClient.get('/images', { params }),
    get: (id: number) => apiClient.get(`/images/${id}`),
    create: (data: any) => apiClient.post('/images', data),
    delete: (id: number) => apiClient.delete(`/images/${id}`),
    analyze: (id: number) => apiClient.post(`/images/${id}/analyze`, {}),
  },
}

export default apiClient
