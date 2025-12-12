'use client'

import { useMemo } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useShallow } from 'zustand/react/shallow'
import type { Conversation, Message, ConversationListParams } from '@/types/api'

// Types for new features
interface MessageVersion {
  id: number
  message_id: number
  version_number: number
  content: string
  model_used?: string
  prompt_tokens?: number
  completion_tokens?: number
  processing_time_ms?: number
  is_current: boolean
  regeneration_reason?: string
  created_at: string
}

interface PromptTemplate {
  id: number
  doctor_id: number
  title: string
  template_text: string
  description?: string
  category?: string
  is_system: boolean
  usage_count: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface ConversationState {
  // Data
  conversations: Conversation[]
  selectedConversationId: number | null
  messages: Message[]

  // Loading states
  isLoadingConversations: boolean
  isLoadingMessages: boolean
  isSendingMessage: boolean

  // Streaming states
  streamingContent: string
  isStreaming: boolean
  streamingMessageId: number | null

  // UI states
  searchQuery: string
  showCreateModal: boolean
  newConversationTitle: string
  newConversationSystemPrompt: string

  // Message versions state
  messageVersions: Record<number, MessageVersion[]>
  loadingVersions: Set<number>

  // Prompt templates state
  promptTemplates: PromptTemplate[]
  loadingTemplates: boolean

  // Actions
  setConversations: (conversations: Conversation[]) => void
  setSelectedConversationId: (id: number | null) => void
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  updateMessage: (messageId: number | string, updates: Partial<Message>) => void
  deleteMessage: (messageId: number | string) => void

  // Loading actions
  setIsLoadingConversations: (loading: boolean) => void
  setIsLoadingMessages: (loading: boolean) => void
  setIsSendingMessage: (sending: boolean) => void

  // Streaming actions
  setStreamingContent: (content: string) => void
  appendStreamingContent: (content: string) => void
  setIsStreaming: (streaming: boolean) => void
  setStreamingMessageId: (id: number | null) => void
  resetStreaming: () => void

  // Conversation actions
  addConversation: (conversation: Conversation) => void
  updateConversation: (id: number, updates: Partial<Conversation>) => void
  deleteConversation: (id: number) => void
  pinConversation: (id: number) => void
  archiveConversation: (id: number) => void

  // UI actions
  setSearchQuery: (query: string) => void
  setShowCreateModal: (show: boolean) => void
  setNewConversationTitle: (title: string) => void
  setNewConversationSystemPrompt: (prompt: string) => void
  resetCreateForm: () => void

  // Message versions actions
  setMessageVersions: (messageId: number, versions: MessageVersion[]) => void
  setLoadingVersions: (messageId: number, loading: boolean) => void
  switchMessageVersion: (messageId: number, versionNumber: number) => void

  // Prompt templates actions
  setPromptTemplates: (templates: PromptTemplate[]) => void
  setLoadingTemplates: (loading: boolean) => void
  addPromptTemplate: (template: PromptTemplate) => void
  updatePromptTemplate: (templateId: number, updates: Partial<PromptTemplate>) => void
  deletePromptTemplate: (templateId: number) => void

  // Reset all
  reset: () => void
}

const initialState = {
  conversations: [],
  selectedConversationId: null,
  messages: [],
  isLoadingConversations: true,
  isLoadingMessages: false,
  isSendingMessage: false,
  streamingContent: '',
  isStreaming: false,
  streamingMessageId: null,
  searchQuery: '',
  showCreateModal: false,
  newConversationTitle: '',
  newConversationSystemPrompt: '',
  messageVersions: {},
  loadingVersions: new Set<number>(),
  promptTemplates: [],
  loadingTemplates: false,
}

export const useConversationStore = create<ConversationState>()(
  persist(
    (set) => ({
      ...initialState,

      // Data setters
      setConversations: (conversations) => set({ conversations }),
      setSelectedConversationId: (selectedConversationId) => set({ selectedConversationId }),
      setMessages: (messages) => set({ messages }),

      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),

      updateMessage: (messageId, updates) =>
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === messageId ? { ...msg, ...updates } : msg
          ),
        })),

      deleteMessage: (messageId) =>
        set((state) => ({
          messages: state.messages.filter((msg) => msg.id !== messageId),
        })),

      // Loading state setters
      setIsLoadingConversations: (isLoadingConversations) =>
        set({ isLoadingConversations }),

      setIsLoadingMessages: (isLoadingMessages) => set({ isLoadingMessages }),

      setIsSendingMessage: (isSendingMessage) => set({ isSendingMessage }),

      // Streaming state setters
      setStreamingContent: (streamingContent) => set({ streamingContent }),

      appendStreamingContent: (content) =>
        set((state) => ({
          streamingContent: state.streamingContent + content,
        })),

      setIsStreaming: (isStreaming) => set({ isStreaming }),

      setStreamingMessageId: (streamingMessageId) => set({ streamingMessageId }),

      resetStreaming: () =>
        set({
          streamingContent: '',
          isStreaming: false,
          streamingMessageId: null,
        }),

      // Conversation actions
      addConversation: (conversation) =>
        set((state) => ({
          conversations: [conversation, ...state.conversations],
        })),

      updateConversation: (id, updates) =>
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === id ? { ...conv, ...updates } : conv
          ),
        })),

      deleteConversation: (id) =>
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          selectedConversationId:
            state.selectedConversationId === id ? null : state.selectedConversationId,
          messages: state.selectedConversationId === id ? [] : state.messages,
        })),

      pinConversation: (id) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, is_pinned: !c.is_pinned } : c
          ),
        })),

      archiveConversation: (id) =>
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, is_archived: !c.is_archived } : c
          ),
        })),

      // UI actions
      setSearchQuery: (searchQuery) => set({ searchQuery }),

      setShowCreateModal: (showCreateModal) => set({ showCreateModal }),

      setNewConversationTitle: (newConversationTitle) =>
        set({ newConversationTitle }),

      setNewConversationSystemPrompt: (newConversationSystemPrompt) =>
        set({ newConversationSystemPrompt }),

      resetCreateForm: () =>
        set({
          newConversationTitle: '',
          newConversationSystemPrompt: '',
          showCreateModal: false,
        }),

      // Message versions actions
      setMessageVersions: (messageId, versions) =>
        set((state) => ({
          messageVersions: {
            ...state.messageVersions,
            [messageId]: versions,
          },
        })),

      setLoadingVersions: (messageId, loading) =>
        set((state) => {
          const newLoadingVersions = new Set(state.loadingVersions)
          if (loading) {
            newLoadingVersions.add(messageId)
          } else {
            newLoadingVersions.delete(messageId)
          }
          return { loadingVersions: newLoadingVersions }
        }),

      switchMessageVersion: (messageId, versionNumber) =>
        set((state) => {
          const versions = state.messageVersions[messageId] || []
          const selectedVersion = versions.find((v) => v.version_number === versionNumber)
          if (selectedVersion) {
            return {
              messages: state.messages.map((msg) =>
                msg.id === messageId
                  ? {
                    ...msg,
                    content: selectedVersion.content,
                    current_version_number: versionNumber,
                    model_used: selectedVersion.model_used,
                  }
                  : msg
              ),
            }
          }
          return state
        }),

      // Prompt templates actions
      setPromptTemplates: (promptTemplates) => set({ promptTemplates }),

      setLoadingTemplates: (loadingTemplates) => set({ loadingTemplates }),

      addPromptTemplate: (template) =>
        set((state) => ({
          promptTemplates: [...state.promptTemplates, template],
        })),

      updatePromptTemplate: (templateId, updates) =>
        set((state) => ({
          promptTemplates: state.promptTemplates.map((t) =>
            t.id === templateId ? { ...t, ...updates } : t
          ),
        })),

      deletePromptTemplate: (templateId) =>
        set((state) => ({
          promptTemplates: state.promptTemplates.filter((t) => t.id !== templateId),
        })),

      // Reset all state
      reset: () => set(initialState),
    }),
    {
      name: 'conversation-store',
      partialize: (state) => ({
        // Only persist these fields to localStorage
        conversations: state.conversations,
        selectedConversationId: state.selectedConversationId,
        messages: state.messages,
      }),
    }
  )
)

// Selector hooks for optimized re-renders
export const useConversations = () =>
  useConversationStore((state) => state.conversations)

export const useSelectedConversationId = () =>
  useConversationStore((state) => state.selectedConversationId)

export const useMessages = () => useConversationStore((state) => state.messages)

export const useIsLoadingConversations = () =>
  useConversationStore((state) => state.isLoadingConversations)

export const useIsLoadingMessages = () =>
  useConversationStore((state) => state.isLoadingMessages)

export const useIsSendingMessage = () =>
  useConversationStore((state) => state.isSendingMessage)

export const useStreamingState = (): {
  streamingContent: string
  isStreaming: boolean
  streamingMessageId: number | null
} =>
  useConversationStore(
    useShallow((state) => ({
      streamingContent: state.streamingContent,
      isStreaming: state.isStreaming,
      streamingMessageId: state.streamingMessageId,
    }))
  )

export const useSearchQuery = () =>
  useConversationStore((state) => state.searchQuery)

export const useCreateModalState = (): {
  showCreateModal: boolean
  newConversationTitle: string
  newConversationSystemPrompt: string
} =>
  useConversationStore(
    useShallow((state) => ({
      showCreateModal: state.showCreateModal,
      newConversationTitle: state.newConversationTitle,
      newConversationSystemPrompt: state.newConversationSystemPrompt,
    }))
  )

export const useCurrentConversation = () => {
  const selectedConversationId = useConversationStore((state) => state.selectedConversationId)
  const conversations = useConversationStore((state) => state.conversations)

  return useMemo(
    () => conversations.find((c) => c.id === selectedConversationId) || null,
    [selectedConversationId, conversations]
  )
}

// Individual action selectors to avoid large object comparisons
export const useSetConversations = () =>
  useConversationStore((state) => state.setConversations)

export const useSetSelectedConversationId = () =>
  useConversationStore((state) => state.setSelectedConversationId)

export const useSetMessages = () =>
  useConversationStore((state) => state.setMessages)

export const useAddMessage = () =>
  useConversationStore((state) => state.addMessage)

export const useUpdateMessage = () =>
  useConversationStore((state) => state.updateMessage)

export const useDeleteMessage = () =>
  useConversationStore((state) => state.deleteMessage)

export const useSetIsLoadingConversations = () =>
  useConversationStore((state) => state.setIsLoadingConversations)

export const useSetIsLoadingMessages = () =>
  useConversationStore((state) => state.setIsLoadingMessages)

export const useSetIsSendingMessage = () =>
  useConversationStore((state) => state.setIsSendingMessage)

export const useAppendStreamingContent = () =>
  useConversationStore((state) => state.appendStreamingContent)

export const useSetIsStreaming = () =>
  useConversationStore((state) => state.setIsStreaming)

export const useSetStreamingMessageId = () =>
  useConversationStore((state) => state.setStreamingMessageId)

export const useResetStreaming = () =>
  useConversationStore((state) => state.resetStreaming)

export const useAddConversation = () =>
  useConversationStore((state) => state.addConversation)

export const useUpdateConversation = () =>
  useConversationStore((state) => state.updateConversation)

export const useDeleteConversation = () =>
  useConversationStore((state) => state.deleteConversation)

export const usePinConversation = () =>
  useConversationStore((state) => state.pinConversation)

export const useArchiveConversation = () =>
  useConversationStore((state) => state.archiveConversation)

export const useSetSearchQuery = () =>
  useConversationStore((state) => state.setSearchQuery)

export const useSetShowCreateModal = () =>
  useConversationStore((state) => state.setShowCreateModal)

export const useSetNewConversationTitle = () =>
  useConversationStore((state) => state.setNewConversationTitle)

export const useSetNewConversationSystemPrompt = () =>
  useConversationStore((state) => state.setNewConversationSystemPrompt)

export const useResetCreateForm = () =>
  useConversationStore((state) => state.resetCreateForm)

export const useReset = () =>
  useConversationStore((state) => state.reset)

// Combined actions hook for convenience (still using shallow comparison)
export const useConversationActions = (): Pick<ConversationState,
  'setConversations' | 'setSelectedConversationId' | 'setMessages' | 'addMessage' |
  'updateMessage' | 'deleteMessage' | 'setIsLoadingConversations' | 'setIsLoadingMessages' |
  'setIsSendingMessage' | 'appendStreamingContent' | 'setIsStreaming' | 'setStreamingMessageId' |
  'resetStreaming' | 'addConversation' | 'updateConversation' | 'deleteConversation' |
  'pinConversation' | 'archiveConversation' | 'setSearchQuery' | 'setShowCreateModal' |
  'setNewConversationTitle' | 'setNewConversationSystemPrompt' | 'resetCreateForm' | 'reset'
> =>
  useConversationStore(
    useShallow((state) => ({
      setConversations: state.setConversations,
      setSelectedConversationId: state.setSelectedConversationId,
      setMessages: state.setMessages,
      addMessage: state.addMessage,
      updateMessage: state.updateMessage,
      deleteMessage: state.deleteMessage,
      setIsLoadingConversations: state.setIsLoadingConversations,
      setIsLoadingMessages: state.setIsLoadingMessages,
      setIsSendingMessage: state.setIsSendingMessage,
      appendStreamingContent: state.appendStreamingContent,
      setIsStreaming: state.setIsStreaming,
      setStreamingMessageId: state.setStreamingMessageId,
      resetStreaming: state.resetStreaming,
      addConversation: state.addConversation,
      updateConversation: state.updateConversation,
      deleteConversation: state.deleteConversation,
      pinConversation: state.pinConversation,
      archiveConversation: state.archiveConversation,
      setSearchQuery: state.setSearchQuery,
      setShowCreateModal: state.setShowCreateModal,
      setNewConversationTitle: state.setNewConversationTitle,
      setNewConversationSystemPrompt: state.setNewConversationSystemPrompt,
      resetCreateForm: state.resetCreateForm,
      reset: state.reset,
    }))
  )

// Message versions hook
export const useMessageVersions = (messageId: number) => {
  const versions = useConversationStore(
    useShallow((state) => state.messageVersions[messageId] || [])
  )
  const isLoading = useConversationStore((state) => state.loadingVersions.has(messageId))

  return useMemo(() => ({ versions, isLoading }), [versions, isLoading])
}

// Prompt templates hook
export const usePromptTemplates = () => {
  const promptTemplates = useConversationStore((state) => state.promptTemplates)
  const loadingTemplates = useConversationStore((state) => state.loadingTemplates)

  return useMemo(
    () => ({ promptTemplates, loadingTemplates }),
    [promptTemplates, loadingTemplates]
  )
}

// Version and template actions hook
export const useVersionAndTemplateActions = () => {
  const setMessageVersions = useConversationStore((state) => state.setMessageVersions)
  const setLoadingVersions = useConversationStore((state) => state.setLoadingVersions)
  const switchMessageVersion = useConversationStore((state) => state.switchMessageVersion)
  const setPromptTemplates = useConversationStore((state) => state.setPromptTemplates)
  const setLoadingTemplates = useConversationStore((state) => state.setLoadingTemplates)
  const addPromptTemplate = useConversationStore((state) => state.addPromptTemplate)
  const updatePromptTemplate = useConversationStore((state) => state.updatePromptTemplate)
  const deletePromptTemplate = useConversationStore((state) => state.deletePromptTemplate)

  return useMemo(
    () => ({
      setMessageVersions,
      setLoadingVersions,
      switchMessageVersion,
      setPromptTemplates,
      setLoadingTemplates,
      addPromptTemplate,
      updatePromptTemplate,
      deletePromptTemplate,
    }),
    [
      setMessageVersions,
      setLoadingVersions,
      switchMessageVersion,
      setPromptTemplates,
      setLoadingTemplates,
      addPromptTemplate,
      updatePromptTemplate,
      deletePromptTemplate,
    ]
  )
}
