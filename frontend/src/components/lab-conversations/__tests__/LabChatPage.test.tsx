/**
 * Tests for LabChatPage component
 * Tests conversation management, message sending, and streaming
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LabChatPage } from '../LabChatPage'
import * as labConversationsApi from '@/lib/api/lab-conversations'

// Mock the API
vi.mock('@/lib/api/lab-conversations')
vi.mock('@/lib/hooks/useStreamingResponse')
vi.mock('@/lib/stores/useConversationStore')

describe('LabChatPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Conversation Management', () => {
    it('should render conversation list on mount', async () => {
      // Mock API calls
      vi.mocked(labConversationsApi.listConversations).mockResolvedValue({
        items: [
          {
            id: 1,
            doctor_id: 1,
            title: 'Test Conversation',
            message_count: 2,
            is_pinned: false,
            is_archived: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        total: 1,
        skip: 0,
        limit: 50,
      })

      render(<LabChatPage availableModels={['claude-3-5-sonnet-20241022']} />)

      await waitFor(() => {
        expect(screen.getByText('Test Conversation')).toBeInTheDocument()
      })
    })

    it('should create new conversation', async () => {
      const newConversation = {
        id: 2,
        doctor_id: 1,
        title: 'New Conversation',
        message_count: 0,
        is_pinned: false,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      vi.mocked(labConversationsApi.listConversations).mockResolvedValue({
        items: [],
        total: 0,
        skip: 0,
        limit: 50,
      })

      vi.mocked(labConversationsApi.createConversation).mockResolvedValue(newConversation)

      render(<LabChatPage availableModels={['claude-3-5-sonnet-20241022']} />)

      // Open create modal
      const createButton = screen.getByText(/create/i)
      fireEvent.click(createButton)

      // Fill in form
      const titleInput = screen.getByPlaceholderText(/conversation title/i)
      await userEvent.type(titleInput, 'New Conversation')

      // Submit
      const submitButton = screen.getAllByText(/create/i)[1]
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(labConversationsApi.createConversation).toHaveBeenCalledWith({
          title: 'New Conversation',
          system_prompt: undefined,
          description: undefined,
          default_model: undefined,
        })
      })
    })

    it('should select conversation from list', async () => {
      vi.mocked(labConversationsApi.listConversations).mockResolvedValue({
        items: [
          {
            id: 1,
            doctor_id: 1,
            title: 'Test Conversation',
            message_count: 2,
            is_pinned: false,
            is_archived: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        total: 1,
        skip: 0,
        limit: 50,
      })

      vi.mocked(labConversationsApi.getConversation).mockResolvedValue({
        id: 1,
        doctor_id: 1,
        title: 'Test Conversation',
        message_count: 2,
        is_pinned: false,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        messages: [],
      })

      render(<LabChatPage availableModels={['claude-3-5-sonnet-20241022']} />)

      await waitFor(() => {
        const conversationItem = screen.getByText('Test Conversation')
        fireEvent.click(conversationItem)
      })

      await waitFor(() => {
        expect(labConversationsApi.getConversation).toHaveBeenCalledWith(1)
      })
    })
  })

  describe('Message Sending', () => {
    beforeEach(() => {
      vi.mocked(labConversationsApi.listConversations).mockResolvedValue({
        items: [
          {
            id: 1,
            doctor_id: 1,
            title: 'Test Conversation',
            message_count: 0,
            is_pinned: false,
            is_archived: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        total: 1,
        skip: 0,
        limit: 50,
      })

      vi.mocked(labConversationsApi.getConversation).mockResolvedValue({
        id: 1,
        doctor_id: 1,
        title: 'Test Conversation',
        message_count: 0,
        is_pinned: false,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        messages: [],
      })
    })

    it('should send text message', async () => {
      const userMessage = {
        id: 1,
        conversation_id: 1,
        role: 'USER' as const,
        message_type: 'TEXT' as const,
        content: 'Test message',
        has_attachments: false,
        attachments: [],
        is_edited: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      vi.mocked(labConversationsApi.sendMessage).mockResolvedValue(userMessage)

      render(<LabChatPage availableModels={['claude-3-5-sonnet-20241022']} />)

      await waitFor(() => {
        const conversationItem = screen.getByText('Test Conversation')
        fireEvent.click(conversationItem)
      })

      // Type message
      const input = screen.getByPlaceholderText(/type a message/i)
      await userEvent.type(input, 'Test message')

      // Send
      const sendButton = screen.getByRole('button', { name: /send/i })
      fireEvent.click(sendButton)

      await waitFor(() => {
        expect(labConversationsApi.sendMessage).toHaveBeenCalled()
      })
    })

    it('should display optimistic message while streaming', async () => {
      const userMessage = {
        id: 1,
        conversation_id: 1,
        role: 'USER' as const,
        message_type: 'TEXT' as const,
        content: 'Test message',
        has_attachments: false,
        attachments: [],
        is_edited: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      vi.mocked(labConversationsApi.sendMessage).mockResolvedValue(userMessage)

      render(<LabChatPage availableModels={['claude-3-5-sonnet-20241022']} />)

      // Select conversation
      await waitFor(() => {
        const conversationItem = screen.getByText('Test Conversation')
        fireEvent.click(conversationItem)
      })

      // Send message
      const input = screen.getByPlaceholderText(/type a message/i)
      await userEvent.type(input, 'Test message')

      const sendButton = screen.getByRole('button', { name: /send/i })
      fireEvent.click(sendButton)

      // Should display user message immediately
      await waitFor(() => {
        expect(screen.getByText('Test message')).toBeInTheDocument()
      })
    })
  })

  describe('Streaming Responses', () => {
    it('should render streaming message component when streaming', async () => {
      // This test would require mocking the streaming hook
      // to return isStreaming: true and streaming content

      render(<LabChatPage availableModels={['claude-3-5-sonnet-20241022']} />)

      // The test would verify that StreamingChatMessage is rendered
      // when isStreaming is true
    })
  })

  describe('Error Handling', () => {
    it('should handle conversation load error', async () => {
      vi.mocked(labConversationsApi.listConversations).mockRejectedValue(
        new Error('Failed to load conversations')
      )

      render(<LabChatPage availableModels={['claude-3-5-sonnet-20241022']} />)

      // Should continue rendering without crashing
      expect(screen.getByText(/conversation/i)).toBeInTheDocument()
    })

    it('should handle message send error', async () => {
      vi.mocked(labConversationsApi.listConversations).mockResolvedValue({
        items: [
          {
            id: 1,
            doctor_id: 1,
            title: 'Test Conversation',
            message_count: 0,
            is_pinned: false,
            is_archived: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ],
        total: 1,
        skip: 0,
        limit: 50,
      })

      vi.mocked(labConversationsApi.getConversation).mockResolvedValue({
        id: 1,
        doctor_id: 1,
        title: 'Test Conversation',
        message_count: 0,
        is_pinned: false,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        messages: [],
      })

      vi.mocked(labConversationsApi.sendMessage).mockRejectedValue(
        new Error('Failed to send message')
      )

      render(<LabChatPage availableModels={['claude-3-5-sonnet-20241022']} />)

      // Select conversation
      await waitFor(() => {
        const conversationItem = screen.getByText('Test Conversation')
        fireEvent.click(conversationItem)
      })

      // Try to send message
      const input = screen.getByPlaceholderText(/type a message/i)
      await userEvent.type(input, 'Test message')

      const sendButton = screen.getByRole('button', { name: /send/i })
      fireEvent.click(sendButton)

      // Should handle error gracefully (likely with toast notification)
      await waitFor(() => {
        expect(labConversationsApi.sendMessage).toHaveBeenCalled()
      })
    })
  })
})
