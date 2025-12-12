/**
 * Users API Client
 * Handles all user management operations (admin only)
 */

import { apiClient } from './client'

export interface CreateUserRequest {
  email: string
  password: string
  full_name: string
  role: 'DOCTOR' | 'ASSISTANT' | 'SECRETARY' | 'ADMIN'
  phone?: string
}

export interface UpdateUserRequest {
  full_name?: string
  role?: 'DOCTOR' | 'ASSISTANT' | 'SECRETARY' | 'ADMIN'
  phone?: string
  is_active?: boolean
}

export interface User {
  id: string  // UUID
  email: string
  full_name: string
  role: string
  phone?: string
  is_active: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
}

/**
 * Create a new user (admin only)
 * Calls Supabase Admin API to create user in auth.users + profiles table
 */
export async function createUser(data: CreateUserRequest): Promise<User> {
  const response = await apiClient.post('/users', data)
  return response.data
}

/**
 * List all users (admin only)
 */
export async function listUsers(): Promise<User[]> {
  const response = await apiClient.get('/users')
  // Backend returns paginated response: {users: [], total, page, page_size}
  return response.data.users || []
}

/**
 * Get a single user by ID (admin only)
 */
export async function getUser(id: string): Promise<User> {
  const response = await apiClient.get(`/users/${id}`)
  return response.data
}

/**
 * Update user information (admin only)
 */
export async function updateUser(id: string, updates: UpdateUserRequest): Promise<User> {
  const response = await apiClient.put(`/users/${id}`, updates)
  return response.data
}

/**
 * Deactivate user (soft delete) (admin only)
 */
export async function deactivateUser(id: string): Promise<void> {
  await apiClient.delete(`/users/${id}`)
}
