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
} from '@/lib/api/lab-conversations'
import type { Conversation, Message, ConversationListParams } from '@/types/api'
import { ConversationSidebar } from './ConversationSidebar'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'

interface LabChatPageProps {
  availableModels?: string[]
}

export function LabChatPage({ availableModels = ['claude-3.5-sonnet'] }: LabChatPageProps) {
  // State management
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingConversations, setIsLoadingConversations] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newConversationTitle, setNewConversationTitle] = useState('')
  const [newConversationSystemPrompt, setNewConversationSystemPrompt] = useState('')
  const [sendingMessageId, setSendingMessageId] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

  const loadConversations = async (params?: ConversationListParams) => {
    try {
      setIsLoadingConversations(true)
      const response = await listConversations(params)
      setConversations(response.items || [])
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setIsLoadingConversations(false)
    }
  }

  const loadMessages = async (conversationId: number) => {
    try {
      setIsLoading(true)
      const response = await getConversation(conversationId)
      setMessages(response.messages || [])
    } catch (error) {
      console.error('Failed to load messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectConversation = (id: number) => {
    setSelectedConversationId(id)
  }

  const handleCreateConversation = async () => {
    if (!newConversationTitle.trim()) return

    try {
      const newConv = await createConversation({
        title: newConversationTitle,
        system_prompt: newConversationSystemPrompt || undefined,
        description: undefined,
        default_model: undefined,
      })

      setConversations((prev) => [newConv, ...prev])
      setSelectedConversationId(newConv.id)
      setNewConversationTitle('')
      setNewConversationSystemPrompt('')
      setShowCreateModal(false)
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }

  const handleDeleteConversation = async (id: number) => {
    try {
      // TODO: Implement delete endpoint call
      setConversations((prev) => prev.filter((c) => c.id !== id))
      if (selectedConversationId === id) {
        setSelectedConversationId(null)
        setMessages([])
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    }
  }

  const handlePinConversation = async (id: number, isPinned: boolean) => {
    try {
      // TODO: Implement pin endpoint call
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_pinned: !c.is_pinned } : c))
      )
    } catch (error) {
      console.error('Failed to pin conversation:', error)
    }
  }

  const handleArchiveConversation = async (id: number, isArchived: boolean) => {
    try {
      // TODO: Implement archive endpoint call
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, is_archived: !c.is_archived } : c))
      )
    } catch (error) {
      console.error('Failed to archive conversation:', error)
    }
  }

  const handleSendMessage = useCallback(
    async (content: string, file?: File, selectedModel?: string) => {
      if (!selectedConversationId) return

      try {
        setSendingMessageId(selectedConversationId)
        const newMessage = await sendMessage(
          selectedConversationId,
          content,
          file,
          'TEXT',
          selectedModel
        )

        // Add message to the list
        setMessages((prev) => [...prev, newMessage])

        // Update conversation last_message_at
        setConversations((prev) =>
          prev.map((c) =>
            c.id === selectedConversationId
              ? {
                  ...c,
                  last_message_at: new Date().toISOString(),
                  message_count: c.message_count + 1,
                }
              : c
          )
        )
      } catch (error) {
        console.error('Failed to send message:', error)
      } finally {
        setSendingMessageId(null)
      }
    },
    [selectedConversationId]
  )

  const currentConversation = conversations.find((c) => c.id === selectedConversationId)

  return (
    <div className="flex h-screen bg-white">
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
          <div className="border-b px-6 py-4">
            <h1 className="text-xl font-semibold text-gray-900">{currentConversation.title}</h1>
            {currentConversation.description && (
              <p className="text-sm text-gray-500 mt-1">{currentConversation.description}</p>
            )}
          </div>
        ) : (
          <div className="border-b px-6 py-4 text-center">
            <p className="text-gray-500">Select a conversation to start chatting</p>
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  isLoading={sendingMessageId === selectedConversationId && message.id === messages[messages.length - 1].id}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input area */}
        {currentConversation ? (
          <div className="border-t p-6">
            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={sendingMessageId === selectedConversationId}
              availableModels={availableModels}
              disabled={isLoading}
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
                onClick={() => {
                  setShowCreateModal(false)
                  setNewConversationTitle('')
                  setNewConversationSystemPrompt('')
                }}
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
    </div>
  )
}
