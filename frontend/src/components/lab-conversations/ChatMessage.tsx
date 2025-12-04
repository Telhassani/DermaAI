'use client'

import { useState, useCallback } from 'react'
import { Message } from '@/types/api'
import { cn } from '@/lib/utils'
import { FileIcon, Loader2, Edit2, Trash2, Copy, Zap } from 'lucide-react'
import { format } from 'date-fns'
import { MarkdownRenderer } from './MarkdownRenderer'
import { MessageEditDialog } from './MessageEditDialog'
import { Button } from '@/components/ui/button'
import { editMessage as editMessageAPI } from '@/lib/api/lab-conversations'
import { useUpdateMessage, useDeleteMessage, useMessageVersions } from '@/lib/stores/useConversationStore'
import { toast } from 'sonner'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ChatMessageProps {
  message: Message
  isLoading?: boolean
  conversationId?: number
  onRegenerate?: () => void
}

export function ChatMessage({ message, isLoading, conversationId, onRegenerate }: ChatMessageProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isEditingMessage, setIsEditingMessage] = useState(false)
  const updateMessage = useUpdateMessage()
  const deleteMessage = useDeleteMessage()
  const { versions } = useMessageVersions(message.id)
  const isUser = message.role === 'USER'
  const isSystem = message.role === 'SYSTEM'
  const isAssistant = message.role === 'ASSISTANT'
  const canEdit = isUser && !isLoading && conversationId
  const canCopy = !isSystem && !isLoading
  const canRegenerate = isAssistant && !isLoading && onRegenerate

  const handleEditMessage = useCallback(
    async (content: string) => {
      if (!conversationId) return
      try {
        setIsEditingMessage(true)
        const updatedMessage = await editMessageAPI(conversationId, message.id, content)
        updateMessage(message.id, { content: updatedMessage.content })
        setIsEditDialogOpen(false)
      } catch (error) {
        console.error('Failed to edit message:', error)
      } finally {
        setIsEditingMessage(false)
      }
    },
    [conversationId, message.id, updateMessage]
  )

  const handleDeleteMessage = useCallback(() => {
    if (!conversationId) return
    deleteMessage(message.id)
  }, [conversationId, message.id, deleteMessage])

  const handleCopyMessage = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      toast.success('Copied to clipboard')
    } catch (error) {
      console.error('Failed to copy:', error)
      toast.error('Failed to copy message')
    }
  }, [message.content])

  return (
    <div
      className={cn(
        'flex w-full mb-4',
        isUser ? 'justify-end' : 'justify-start',
        isSystem && 'justify-center'
      )}
      role="article"
      aria-label={`${isUser ? 'Your message' : 'Assistant message'} sent at ${format(new Date(message.created_at), 'HH:mm:ss')}`}
    >
      <div
        className={cn(
          'flex flex-col max-w-xl gap-2',
          isUser && 'items-end',
          !isUser && !isSystem && 'items-start',
          isSystem && 'items-center w-full px-4'
        )}
      >
        {/* Message bubble */}
        <div
          className={cn(
            'rounded-lg px-4 py-3 break-words',
            isUser
              ? 'bg-blue-600 text-white rounded-br-none'
              : isSystem
                ? 'bg-gray-100 text-gray-600 italic text-sm w-full text-center'
                : 'bg-gray-100 text-gray-900 rounded-bl-none'
          )}
          role="region"
          aria-live="polite"
          aria-label={`${isUser ? 'Your' : 'AI'} message content`}
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Typing...</span>
            </div>
          ) : isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
        </div>

        {/* Attachments */}
        {message.has_attachments && message.attachments && message.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {message.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className={cn(
                  'flex items-center gap-2 px-3 py-1 rounded-md text-sm',
                  isUser ? 'bg-blue-500' : 'bg-gray-200'
                )}
              >
                <FileIcon className="w-4 h-4" />
                <span className={isUser ? 'text-white' : 'text-gray-700'}>
                  {attachment.file_name}
                </span>
                {attachment.is_processed && (
                  <span className={cn('text-xs', isUser ? 'text-blue-200' : 'text-gray-500')}>
                    ✓ Processed
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {message.model_used && (
            <span className="font-mono bg-gray-200 px-2 py-0.5 rounded">
              {message.model_used}
            </span>
          )}
          {message.prompt_tokens && message.completion_tokens && (
            <span>
              {message.prompt_tokens + message.completion_tokens} tokens
            </span>
          )}
          {message.processing_time_ms && (
            <span>{(message.processing_time_ms / 1000).toFixed(2)}s</span>
          )}
          <span>{format(new Date(message.created_at), 'HH:mm')}</span>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-1 flex-wrap">
          {/* Copy button */}
          {canCopy && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCopyMessage}
              title="Copy message to clipboard"
            >
              <Copy className="w-4 h-4" />
            </Button>
          )}

          {/* Version selector dropdown */}
          {isAssistant && versions.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="ghost" title="View other versions">
                  <span className="text-xs">v{message.current_version_number}/{versions.length}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {versions.map((version) => (
                  <DropdownMenuItem
                    key={version.id}
                    disabled={version.version_number === message.current_version_number}
                  >
                    Version {version.version_number}
                    {version.version_number === message.current_version_number && ' ✓'}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Regenerate button */}
          {canRegenerate && (
            <Button size="sm" variant="ghost" onClick={onRegenerate} title="Regenerate response">
              <Zap className="w-4 h-4" />
            </Button>
          )}

          {/* Edit and delete buttons (user messages only) */}
          {canEdit && (
            <>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsEditDialogOpen(true)}
                disabled={isEditingMessage}
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDeleteMessage}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Edit dialog */}
      <MessageEditDialog
        message={isEditDialogOpen ? message : null}
        isOpen={isEditDialogOpen}
        isLoading={isEditingMessage}
        onClose={() => setIsEditDialogOpen(false)}
        onSave={handleEditMessage}
      />
    </div>
  )
}
