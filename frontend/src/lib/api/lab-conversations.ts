/**
 * Lab Conversations API endpoints wrapper
 * Handles multi-turn AI chat conversations independent of patient context
 */

import { api } from './client'
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
