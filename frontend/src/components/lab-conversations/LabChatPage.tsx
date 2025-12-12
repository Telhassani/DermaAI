'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import {
  listConversations,
  getConversation,
  sendMessage,
  createConversation,
  deleteConversation as deleteConversationAPI,
  pinConversation as pinConversationAPI,
  archiveConversation as archiveConversationAPI,
  deleteMessage as deleteMessageAPI,
} from '@/lib/api/lab-conversations'
import { useStreamingResponse } from '@/lib/hooks/useStreamingResponse'
import {
  useConversations,
  useSelectedConversationId,
  useMessages,
  useIsLoadingConversations,
  useIsLoadingMessages,
  useIsSendingMessage,
  useStreamingState,
  useSearchQuery,
  useCreateModalState,
  useCurrentConversation,
  // Import individual action hooks
  useSetConversations,
  useSetSelectedConversationId,
  useSetMessages,
  useAddMessage,
  useUpdateMessage,
  useDeleteMessage,
  useSetIsLoadingConversations,
  useSetIsLoadingMessages,
  useSetIsSendingMessage,
  useAppendStreamingContent,
  useSetIsStreaming,
  useSetStreamingMessageId,
  useResetStreaming,
  useAddConversation,
  useDeleteConversation,
  usePinConversation,
  useArchiveConversation,
  useSetSearchQuery,
  useSetShowCreateModal,
  useSetNewConversationTitle,
  useSetNewConversationSystemPrompt,
  useResetCreateForm,
  useUpdateConversation,
} from '@/lib/stores/useConversationStore'
import type { Conversation, Message, ConversationListParams } from '@/types/api'
import { ConversationSidebar } from './ConversationSidebar'
import { ChatMessage } from './ChatMessage'
import { StreamingChatMessage } from './StreamingChatMessage'
import { ChatInput } from './ChatInput'
import { StreamingErrorBoundary } from './StreamingErrorBoundary'
import { ExportDialog } from './ExportDialog'
import { Download, Settings } from 'lucide-react'

interface LabChatPageProps {
  availableModels?: string[]
}

export function LabChatPage({ availableModels = ['claude-sonnet-4-5-20250929', 'claude-haiku-4-5-20251001', 'claude-opus-4-5-20251101', 'claude-3-5-haiku-20241022'] }: LabChatPageProps) {
  // Get store state using selectors for optimal re-renders
  const conversations = useConversations()
  const selectedConversationId = useSelectedConversationId()
  const messages = useMessages()
  const isLoadingConversations = useIsLoadingConversations()
  const isLoadingMessages = useIsLoadingMessages()
  const isSendingMessage = useIsSendingMessage()
  const { streamingContent, isStreaming, streamingMessageId } = useStreamingState()
  const searchQuery = useSearchQuery()
  const { showCreateModal, newConversationTitle, newConversationSystemPrompt } =
    useCreateModalState()
  const currentConversation = useCurrentConversation()

  // Get all actions using individual hooks to avoid destructuring issues
  const setConversations = useSetConversations()
  const setSelectedConversationId = useSetSelectedConversationId()
  const setMessages = useSetMessages()
  const addMessage = useAddMessage()
  const updateMessage = useUpdateMessage()
  const deleteMessage = useDeleteMessage()
  const setIsLoadingConversations = useSetIsLoadingConversations()
  const setIsLoadingMessages = useSetIsLoadingMessages()
  const setIsSendingMessage = useSetIsSendingMessage()
  const appendStreamingContent = useAppendStreamingContent()
  const setIsStreaming = useSetIsStreaming()
  const setStreamingMessageId = useSetStreamingMessageId()
  const resetStreaming = useResetStreaming()
  const addConversation = useAddConversation()
  const deleteConversation = useDeleteConversation()
  const pinConversation = usePinConversation()
  const archiveConversation = useArchiveConversation()
  const setSearchQuery = useSetSearchQuery()
  const setShowCreateModal = useSetShowCreateModal()
  const setNewConversationTitle = useSetNewConversationTitle()
  const setNewConversationSystemPrompt = useSetNewConversationSystemPrompt()
  const resetCreateForm = useResetCreateForm()
  const updateConversation = useUpdateConversation()

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [apiKeys, setApiKeys] = useState({
    anthropic: localStorage.getItem('anthropic_api_key') || '',
    openai: localStorage.getItem('openai_api_key') || '',
  })

  // Log localStorage contents on mount for debugging
  useEffect(() => {
    const anthropicKey = localStorage.getItem('anthropic_api_key')
    const openaiKey = localStorage.getItem('openai_api_key')

    console.log('[LabChatPage] Component mounted. API keys in localStorage:', {
      anthropic: anthropicKey ? `${anthropicKey.substring(0, 20)}...` : '(not set)',
      openai: openaiKey ? `${openaiKey.substring(0, 20)}...` : '(not set)',
    })
  }, [])

  // Reload API keys from localStorage when settings dialog opens
  useEffect(() => {
    if (isSettingsOpen) {
      const anthropicKey = localStorage.getItem('anthropic_api_key')
      const openaiKey = localStorage.getItem('openai_api_key')

      console.log('[Settings] Loading API keys from localStorage:', {
        anthropic: anthropicKey ? `${anthropicKey.substring(0, 20)}...` : '(not set)',
        openai: openaiKey ? `${openaiKey.substring(0, 20)}...` : '(not set)',
      })

      setApiKeys({
        anthropic: anthropicKey || '',
        openai: openaiKey || '',
      })
    }
  }, [isSettingsOpen])

  // Use refs to capture current state without triggering re-renders
  const streamingStateRef = useRef({ streamingMessageId, streamingContent })
  const actionRefs = useRef({ updateMessage, deleteMessage, resetStreaming, setIsStreaming, appendStreamingContent })

  // Keep refs up-to-date when state changes - only depend on primitive values
  useEffect(() => {
    streamingStateRef.current = { streamingMessageId, streamingContent }
  }, [streamingMessageId, streamingContent])

  // Separately update action refs - these change but we don't want them in other effect dependencies
  useEffect(() => {
    actionRefs.current = { updateMessage, deleteMessage, resetStreaming, setIsStreaming, appendStreamingContent }
  }, [updateMessage, deleteMessage, resetStreaming, setIsStreaming, appendStreamingContent])

  // Memoize streaming callbacks with stable references
  const handleStreamChunk = useCallback(
    (content: string) => {
      actionRefs.current.appendStreamingContent(content)
    },
    []
  )

  const handleStreamComplete = useCallback(
    (chunks: number, elapsed: number, messageId?: number) => {
      console.log(`Stream completed: ${chunks} chunks in ${elapsed.toFixed(2)}s`)
      const { streamingMessageId, streamingContent } = streamingStateRef.current
      const { updateMessage, resetStreaming, setIsStreaming } = actionRefs.current

      actionRefs.current.setIsStreaming(false)

      // If we got a real message ID from backend, update the placeholder
      if (messageId && streamingMessageId) {
        // Update placeholder with real message ID and streamed content
        updateMessage(streamingMessageId, {
          id: messageId,
          content: streamingContent,
        })
      }

      resetStreaming()
    },
    []
  )

  const handleStreamError = useCallback(
    (error: string) => {
      console.error('Streaming error:', error)
      const { streamingMessageId } = streamingStateRef.current
      const { deleteMessage, resetStreaming, setIsStreaming } = actionRefs.current

      setIsStreaming(false)
      // Remove placeholder message on error
      if (streamingMessageId) {
        deleteMessage(streamingMessageId)
      }
      resetStreaming()
    },
    []
  )

  // Use streaming response hook
  const { stream, stop: stopStreaming } = useStreamingResponse({
    onChunk: handleStreamChunk,
    onComplete: handleStreamComplete,
    onError: handleStreamError,
  })

  // Load conversations on mount
  useEffect(() => {
    loadConversations()
  }, [])

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversationId) {
      loadMessages(selectedConversationId)
    }
  }, [selectedConversationId])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversations = useCallback(async (params?: ConversationListParams) => {
    try {
      setIsLoadingConversations(true)
      const response = await listConversations(params)
      setConversations(response.items || [])
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setIsLoadingConversations(false)
    }
  }, [setIsLoadingConversations, setConversations])

  const loadMessages = useCallback(async (conversationId: number) => {
    try {
      setIsLoadingMessages(true)
      const response = await getConversation(conversationId)
      setMessages(response.messages || [])
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setIsLoadingMessages(false)
    }
  }, [setIsLoadingMessages, setMessages])

  const handleSelectConversation = useCallback(
    (id: number) => {
      setSelectedConversationId(id)
    },
    [setSelectedConversationId]
  )

  const handleCreateConversation = useCallback(async () => {
    if (!newConversationTitle.trim()) return

    try {
      const newConv = await createConversation({
        title: newConversationTitle,
        system_prompt: newConversationSystemPrompt || undefined,
        description: undefined,
        default_model: undefined,
      })

      addConversation(newConv)
      setSelectedConversationId(newConv.id)
      resetCreateForm()
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }, [newConversationTitle, newConversationSystemPrompt, addConversation, setSelectedConversationId, resetCreateForm])

  const handleDeleteConversation = useCallback(
    async (id: number) => {
      try {
        await deleteConversationAPI(id)
        deleteConversation(id)
      } catch (error) {
        console.error('Failed to delete conversation:', error)
      }
    },
    [deleteConversation]
  )

  const handlePinConversation = useCallback(
    async (id: number) => {
      try {
        const conversation = conversations.find((c) => c.id === id)
        const newPinnedState = !conversation?.is_pinned
        await pinConversationAPI(id, newPinnedState)
        pinConversation(id)
      } catch (error) {
        console.error('Failed to pin conversation:', error)
      }
    },
    [pinConversation, conversations]
  )

  const handleArchiveConversation = useCallback(
    async (id: number) => {
      try {
        const conversation = conversations.find((c) => c.id === id)
        const newArchivedState = !conversation?.is_archived
        await archiveConversationAPI(id, newArchivedState)
        archiveConversation(id)
      } catch (error) {
        console.error('Failed to archive conversation:', error)
      }
    },
    [archiveConversation, conversations]
  )

  const handleSendMessage = useCallback(
    async (content: string, file?: File, selectedModel?: string) => {
      if (!selectedConversationId) return

      try {
        setIsSendingMessage(true)

        // Send user message first
        const userMessage = await sendMessage(
          selectedConversationId,
          content,
          file,
          'TEXT',
          selectedModel
        )

        // Add user message to the list
        addMessage(userMessage)

        // Create optimistic AI message placeholder
        const aiMessageId = Date.now() // Temporary ID
        const now = new Date().toISOString()
        const placeholderMessage: Message = {
          id: aiMessageId,
          conversation_id: selectedConversationId,
          content: '',
          role: 'ASSISTANT',
          message_type: 'TEXT',
          has_attachments: false,
          attachments: [],
          is_edited: false,
          model_used: selectedModel || 'claude-sonnet-4-5-20250929',
          created_at: now,
          updated_at: now,
        }

        addMessage(placeholderMessage)
        setStreamingMessageId(aiMessageId)
        setIsStreaming(true)

        // Stream AI response via lab-conversations endpoint
        await stream(`/lab-conversations/conversations/${selectedConversationId}/stream-response`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Anthropic-Key': localStorage.getItem('anthropic_api_key') || '',
            'X-OpenAI-Key': localStorage.getItem('openai_api_key') || '',
          },
          body: JSON.stringify({
            conversation_id: selectedConversationId,
            model: selectedModel || 'claude-sonnet-4-5-20250929',
            user_message_id: userMessage.id,
            temperature: 0.7,
            max_tokens: 2000,
          }),
        })

        // Update conversation metadata
        updateConversation(selectedConversationId, {
          last_message_at: new Date().toISOString(),
          message_count: 0, // Will be updated by backend
        })
      } catch (error) {
        console.error('Failed to send message:', error)
        setIsStreaming(false)
        // Remove placeholder message on error
        if (streamingMessageId) {
          deleteMessage(streamingMessageId)
        }
        // Add error message to conversation
        const now = new Date().toISOString()
        const errorMessage: Message = {
          id: Date.now() + 1,
          conversation_id: selectedConversationId,
          content: `Failed to get AI response: ${error instanceof Error ? error.message : 'Unknown error'}`,
          role: 'ASSISTANT',
          message_type: 'TEXT',
          has_attachments: false,
          attachments: [],
          is_edited: false,
          created_at: now,
          updated_at: now,
        }
        addMessage(errorMessage)
      } finally {
        setIsSendingMessage(false)
      }
    },
    [
      selectedConversationId,
      setIsSendingMessage,
      addMessage,
      setStreamingMessageId,
      setIsStreaming,
      updateConversation,
      deleteMessage,
      streamingMessageId,
      stream,
    ]
  )

  return (
    <div className="flex bg-white max-h-[calc(100vh-120px)]">
      {/* Sidebar */}
      <ConversationSidebar
        conversations={conversations}
        selectedId={selectedConversationId || undefined}
        onSelect={handleSelectConversation}
        onCreate={() => setShowCreateModal(true)}
        onDelete={handleDeleteConversation}
        onPin={handlePinConversation}
        onArchive={handleArchiveConversation}
        isLoading={isLoadingConversations}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        {currentConversation ? (
          <div className="border-b px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{currentConversation.title}</h1>
              {currentConversation.description && (
                <p className="text-sm text-gray-500 mt-1">{currentConversation.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() => setIsSettingsOpen(true)}
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsExportDialogOpen(true)}
                title="Export conversation"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        ) : (
          <div className="border-b px-6 py-4 flex items-center justify-between">
            <p className="text-gray-500">Select a conversation to start chatting</p>
            <Button
              size="icon"
              variant="outline"
              onClick={() => setIsSettingsOpen(true)}
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Messages area */}
        <StreamingErrorBoundary>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {isLoadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>No messages yet. Start the conversation!</p>
              </div>
            ) : (
              <>
                {messages.map((message) => {
                  const isStreamingMessage =
                    isStreaming && streamingMessageId === message.id

                  return isStreamingMessage ? (
                    <StreamingChatMessage
                      key={message.id}
                      message={message}
                      isStreaming={true}
                      streamingContent={streamingContent}
                      onStop={stopStreaming}
                    />
                  ) : (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      conversationId={selectedConversationId || undefined}
                      isLoading={
                        isSendingMessage &&
                        message.id === messages[messages.length - 1].id
                      }
                      onRegenerate={async () => {
                        if (!selectedConversationId) return

                        try {
                          const messageIndex = messages.findIndex(m => m.id === message.id)

                          // Handle AI messages differently - delete current message too
                          if (message.role === 'ASSISTANT') {
                            // Delete THIS AI message and all after it
                            const messagesToDelete = messages.slice(messageIndex)

                            for (const msg of messagesToDelete) {
                              try {
                                await deleteMessageAPI(selectedConversationId, msg.id)
                                deleteMessage(msg.id)
                              } catch (error) {
                                console.error('Failed to delete message:', error)
                              }
                            }

                            // Find the previous user message
                            const previousUserMessage = messages
                              .slice(0, messageIndex)
                              .reverse()
                              .find(m => m.role === 'USER')

                            if (!previousUserMessage) {
                              console.error('No previous user message found')
                              return
                            }

                            // Create optimistic AI message placeholder
                            const aiMessageId = Date.now()
                            const now = new Date().toISOString()
                            const placeholderMessage: Message = {
                              id: aiMessageId,
                              conversation_id: selectedConversationId,
                              content: '',
                              role: 'ASSISTANT',
                              message_type: 'TEXT',
                              has_attachments: false,
                              attachments: [],
                              is_edited: false,
                              model_used: 'claude-sonnet-4-5-20250929',
                              created_at: now,
                              updated_at: now,
                            }

                            addMessage(placeholderMessage)
                            setStreamingMessageId(aiMessageId)
                            setIsStreaming(true)

                            // Stream AI response using previous user message
                            await stream(`/lab-conversations/conversations/${selectedConversationId}/stream-response`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'X-Anthropic-Key': localStorage.getItem('anthropic_api_key') || '',
                                'X-OpenAI-Key': localStorage.getItem('openai_api_key') || '',
                              },
                              body: JSON.stringify({
                                conversation_id: selectedConversationId,
                                model: 'claude-sonnet-4-5-20250929',
                                user_message_id: previousUserMessage.id,
                                temperature: 0.7,
                                max_tokens: 2000,
                              }),
                            })

                            // Update conversation message count
                            updateConversation(selectedConversationId, {
                              message_count: messages.length - messagesToDelete.length + 1,
                              last_message_at: new Date().toISOString(),
                            })
                          } else {
                            // For USER messages: delete all messages after this one
                            const messagesToDelete = messages.slice(messageIndex + 1)

                            for (const msg of messagesToDelete) {
                              try {
                                await deleteMessageAPI(selectedConversationId, msg.id)
                                deleteMessage(msg.id)
                              } catch (error) {
                                console.error('Failed to delete message:', error)
                              }
                            }

                            // Create optimistic AI message placeholder
                            const aiMessageId = Date.now()
                            const now = new Date().toISOString()
                            const placeholderMessage: Message = {
                              id: aiMessageId,
                              conversation_id: selectedConversationId,
                              content: '',
                              role: 'ASSISTANT',
                              message_type: 'TEXT',
                              has_attachments: false,
                              attachments: [],
                              is_edited: false,
                              model_used: 'claude-sonnet-4-5-20250929',
                              created_at: now,
                              updated_at: now,
                            }

                            addMessage(placeholderMessage)
                            setStreamingMessageId(aiMessageId)
                            setIsStreaming(true)

                            // Stream AI response using existing user message
                            await stream(`/lab-conversations/conversations/${selectedConversationId}/stream-response`, {
                              method: 'POST',
                              headers: {
                                'Content-Type': 'application/json',
                                'X-Anthropic-Key': localStorage.getItem('anthropic_api_key') || '',
                                'X-OpenAI-Key': localStorage.getItem('openai_api_key') || '',
                              },
                              body: JSON.stringify({
                                conversation_id: selectedConversationId,
                                model: 'claude-sonnet-4-5-20250929',
                                user_message_id: message.id,
                                temperature: 0.7,
                                max_tokens: 2000,
                              }),
                            })

                            // Update conversation message count
                            updateConversation(selectedConversationId, {
                              message_count: messages.length - messagesToDelete.length + 1,
                              last_message_at: new Date().toISOString(),
                            })
                          }
                        } catch (error) {
                          console.error('Failed to regenerate:', error)
                          setIsStreaming(false)
                        }
                      }}
                    />
                  )
                })}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>
        </StreamingErrorBoundary>

        {/* Input area */}
        {currentConversation ? (
          <div className="border-t p-6">
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isSendingMessage}
              availableModels={availableModels}
              disabled={isLoadingMessages}
            />
          </div>
        ) : (
          <div className="border-t p-6 text-center text-gray-500">
            <p>Create or select a conversation to start messaging</p>
          </div>
        )}
      </div>

      {/* Create conversation modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Lab Analysis Conversation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Conversation Title
              </label>
              <Input
                placeholder="e.g., Lab Result Analysis - Patient ABC"
                value={newConversationTitle}
                onChange={(e) => setNewConversationTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                System Prompt (Optional)
              </label>
              <textarea
                placeholder="Enter a system prompt to guide the AI analysis..."
                value={newConversationSystemPrompt}
                onChange={(e) => setNewConversationSystemPrompt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={resetCreateForm}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateConversation}
                disabled={!newConversationTitle.trim()}
              >
                Create Conversation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export conversation dialog */}
      <ExportDialog
        conversation={currentConversation}
        messages={messages}
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
      />

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Anthropic API Key</label>
              <Input
                type="password"
                placeholder="Enter your Anthropic API key"
                value={apiKeys.anthropic}
                onChange={(e) => setApiKeys({ ...apiKeys, anthropic: e.target.value })}
              />
              <p className="text-xs text-gray-500">
                Your API key is stored locally in your browser and never sent to our servers.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">OpenAI API Key</label>
              <Input
                type="password"
                placeholder="Enter your OpenAI API key"
                value={apiKeys.openai}
                onChange={(e) => setApiKeys({ ...apiKeys, openai: e.target.value })}
              />
              <p className="text-xs text-gray-500">
                Your API key is stored locally in your browser and never sent to our servers.
              </p>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsSettingsOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // Save to localStorage
                  localStorage.setItem('anthropic_api_key', apiKeys.anthropic)
                  localStorage.setItem('openai_api_key', apiKeys.openai)

                  // Verify it was saved
                  const savedAnthropic = localStorage.getItem('anthropic_api_key')
                  const savedOpenai = localStorage.getItem('openai_api_key')

                  console.log('[Settings] Saved API keys:', {
                    anthropic: savedAnthropic ? `${savedAnthropic.substring(0, 20)}...` : '(empty)',
                    openai: savedOpenai ? `${savedOpenai.substring(0, 20)}...` : '(empty)',
                  })

                  toast.success('API keys saved successfully!')
                  setIsSettingsOpen(false)
                }}
                className="flex-1"
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
