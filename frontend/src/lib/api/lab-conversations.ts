/**
 * Lab Conversations API endpoints wrapper
 * Handles multi-turn AI chat conversations independent of patient context
 */

import apiClient, { api } from './client'
import type {
  Conversation,
  ConversationDetail,
  ConversationCreateData,
  ConversationUpdateData,
  Message,
  MessageCreateData,
  ConversationListResponse,
  MessageListResponse,
  ConversationAnalytics,
  ConversationListParams,
  MessageListParams,
} from '@/types/api'

/**
 * Response type for available models endpoint
 */
export interface AvailableModelsResponse {
  claude_models: string[]
  ollama_models: string[]
  all_models: string[]
  ollama_available: boolean
}

/**
 * Get list of available AI models (Claude and Ollama)
 * No authentication required
 * @returns Available models and Ollama availability status
 */
export async function getAvailableModels(): Promise<AvailableModelsResponse> {
  const response = await apiClient.get('/lab-conversations/available-models')
  return response.data as AvailableModelsResponse
}

/**
 * Create a new lab analysis conversation
 * @param data Conversation creation data
 * @returns Created conversation
 */
export async function createConversation(data: ConversationCreateData) {
  const response = await api.labConversations.create(data)
  return response.data
}

/**
 * List all conversations for the current doctor
 * @param params Pagination and filtering parameters
 * @returns List of conversations with metadata
 */
export async function listConversations(params?: ConversationListParams) {
  const response = await api.labConversations.list(params)
  return response.data as ConversationListResponse
}

/**
 * Get a specific conversation with its message history
 * @param conversationId ID of the conversation
 * @param messageLimit Maximum number of messages to retrieve (default: 50)
 * @returns Conversation with embedded messages
 */
export async function getConversation(conversationId: number, messageLimit?: number) {
  const response = await api.labConversations.get(conversationId, { message_limit: messageLimit || 50 })
  return response.data as ConversationDetail
}

/**
 * Update conversation metadata and settings
 * @param conversationId ID of the conversation
 * @param data Fields to update
 * @returns Updated conversation
 */
export async function updateConversation(
  conversationId: number,
  data: ConversationUpdateData,
) {
  const response = await api.labConversations.update(conversationId, data)
  return response.data as Conversation
}

/**
 * Delete a conversation and all its messages
 * @param conversationId ID of the conversation
 */
export async function deleteConversation(conversationId: number) {
  await api.labConversations.delete(conversationId)
}

/**
 * Pin or unpin a conversation (shows at top of list)
 * @param conversationId ID of the conversation
 * @param isPinned Whether to pin or unpin
 * @returns Updated conversation
 */
export async function pinConversation(conversationId: number, isPinned: boolean) {
  const response = await api.labConversations.pin(conversationId, { is_pinned: isPinned })
  return response.data as Conversation
}

/**
 * Archive or unarchive a conversation
 * @param conversationId ID of the conversation
 * @param isArchived Whether to archive or unarchive
 * @returns Updated conversation
 */
export async function archiveConversation(conversationId: number, isArchived: boolean) {
  const response = await api.labConversations.archive(conversationId, { is_archived: isArchived })
  return response.data as Conversation
}

/**
 * Send a message to the AI in a conversation
 * Supports file attachments (lab results, images, PDFs)
 * @param conversationId ID of the conversation
 * @param content Message text content
 * @param file Optional file attachment
 * @param messageType Type of message (default: TEXT)
 * @param selectedModel Optional AI model override (defaults to conversation setting)
 * @returns Created message
 */
export async function sendMessage(
  conversationId: number,
  content: string,
  file?: File,
  messageType: 'TEXT' | 'FILE' | 'ANALYSIS' | 'ERROR' = 'TEXT',
  selectedModel?: string,
) {
  const formData = new FormData()
  formData.append('content', content)
  formData.append('message_type', messageType)

  if (selectedModel) {
    formData.append('selected_model', selectedModel)
  }

  if (file) {
    formData.append('file', file)
  }

  const response = await api.labConversations.sendMessage(conversationId, formData)
  return response.data as Message
}

/**
 * List message history for a conversation
 * @param conversationId ID of the conversation
 * @param params Pagination parameters (skip, limit)
 * @returns List of messages in chronological order
 */
export async function listMessages(conversationId: number, params?: MessageListParams) {
  const response = await api.labConversations.listMessages(conversationId, params)
  return response.data as MessageListResponse
}

/**
 * Edit a message in a conversation
 * @param conversationId ID of the conversation
 * @param messageId ID of the message to edit
 * @param content New message content
 * @returns Updated message
 */
export async function editMessage(
  conversationId: number,
  messageId: number,
  content: string,
) {
  const formData = new FormData()
  formData.append('content', content)

  const response = await apiClient.put(
    `/lab-conversations/conversations/${conversationId}/messages/${messageId}`,
    formData
  )
  return response.data as Message
}

/**
 * Delete a message from a conversation
 * @param conversationId ID of the conversation
 * @param messageId ID of the message to delete
 */
export async function deleteMessage(conversationId: number, messageId: number) {
  await api.labConversations.deleteMessage(conversationId, messageId)
}

/**
 * Get analytics/statistics for a conversation
 * Includes token usage, models used, files uploaded, processing time
 * @param conversationId ID of the conversation
 * @returns Conversation analytics
 */
export async function getAnalytics(conversationId: number) {
  const response = await api.labConversations.getAnalytics(conversationId)
  return response.data as ConversationAnalytics
}

/**
 * Validate file before upload
 * @param file File to validate
 * @returns Validation result with error message if invalid
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ]
  const maxSize = 25 * 1024 * 1024 // 25MB

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Allowed: PDF, JPEG, PNG, GIF, WebP',
    }
  }

  if (file.size === 0) {
    return { valid: false, error: 'File is empty' }
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File too large. Maximum size: 25MB' }
  }

  return { valid: true }
}

/**
 * Get all versions of a regenerated message
 * @param conversationId ID of the conversation
 * @param messageId ID of the message
 * @returns List of message versions
 */
export async function getMessageVersions(conversationId: number, messageId: number) {
  const response = await apiClient.get(
    `/lab-conversations/conversations/${conversationId}/messages/${messageId}/versions`
  )
  return response.data
}

/**
 * Switch to a different version of a message
 * @param conversationId ID of the conversation
 * @param messageId ID of the message
 * @param versionNumber Version number to switch to
 * @returns Updated message
 */
export async function switchMessageVersion(
  conversationId: number,
  messageId: number,
  versionNumber: number,
) {
  const response = await apiClient.patch(
    `/lab-conversations/conversations/${conversationId}/messages/${messageId}/switch-version`,
    null,
    { params: { version_number: versionNumber } }
  )
  return response.data as Message
}

/**
 * List all prompt templates for the current doctor
 * @param params Pagination and filtering parameters
 * @returns List of prompt templates
 */
export async function listPromptTemplates(params?: {
  category?: string
  skip?: number
  limit?: number
}) {
  const response = await apiClient.get('/lab-conversations/prompt-templates', {
    params: params || {},
  })
  return response.data
}

/**
 * Create a new prompt template
 * @param data Template data
 * @returns Created template
 */
export async function createPromptTemplate(data: {
  title: string
  template_text: string
  description?: string
  category?: string
}) {
  const response = await apiClient.post('/lab-conversations/prompt-templates', data)
  return response.data
}

/**
 * Update an existing prompt template
 * @param templateId ID of the template
 * @param data Partial template data to update
 * @returns Updated template
 */
export async function updatePromptTemplate(
  templateId: number,
  data: {
    title?: string
    template_text?: string
    description?: string
    category?: string
    is_active?: boolean
  },
) {
  const response = await apiClient.patch(
    `/lab-conversations/prompt-templates/${templateId}`,
    data
  )
  return response.data
}

/**
 * Delete a prompt template
 * @param templateId ID of the template
 */
export async function deletePromptTemplate(templateId: number) {
  await apiClient.delete(`/lab-conversations/prompt-templates/${templateId}`)
}
