'use client'

import { Message } from '@/types/api'
import { cn } from '@/lib/utils'
import { FileIcon, Loader2, AlertCircle, Square } from 'lucide-react'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import { MarkdownRenderer } from './MarkdownRenderer'

interface StreamingChatMessageProps {
  message: Message
  isStreaming?: boolean
  streamingContent?: string
  onStop?: () => void
}

/**
 * Enhanced chat message component that supports:
 * - Real-time streaming content display
 * - Progressive chunk rendering
 * - Animated typing indicator
 * - Stop button for ongoing streams
 * - Error state display
 */
export function StreamingChatMessage({
  message,
  isStreaming = false,
  streamingContent = '',
  onStop,
}: StreamingChatMessageProps) {
  const isUser = message.role === 'USER'
  const isSystem = message.role === 'SYSTEM'
  const isError = message.role === 'ERROR'
  const isAI = message.role === 'ASSISTANT'

  // Display streaming content or static content
  const displayContent = isStreaming && streamingContent ? streamingContent : message.content
  const hasError = isError || (message.content && message.content.includes('Error'))

  return (
    <div
      className={cn(
        'flex w-full mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300',
        isUser ? 'justify-end' : 'justify-start',
        isSystem && 'justify-center'
      )}
    >
      <div
        className={cn(
          'flex flex-col max-w-2xl gap-2',
          isUser && 'items-end',
          !isUser && !isSystem && 'items-start',
          isSystem && 'items-center w-full px-4'
        )}
      >
        {/* Message bubble with streaming support */}
        <div
          className={cn(
            'rounded-lg px-4 py-3 break-words transition-colors',
            isUser
              ? 'bg-blue-600 text-white rounded-br-none'
              : isSystem
                ? 'bg-gray-100 text-gray-600 italic text-sm w-full text-center'
                : isError
                  ? 'bg-red-50 text-red-900 border border-red-200 rounded-bl-none'
                  : 'bg-gray-100 text-gray-900 rounded-bl-none'
          )}
        >
          {isStreaming ? (
            <div className="space-y-2">
              {/* Streaming content with progressive markdown rendering */}
              <div className="relative">
                <MarkdownRenderer content={displayContent} className="prose-sm" />
                <span className="animate-pulse ml-1 inline-block">▌</span>
              </div>
            </div>
          ) : isUser ? (
            <p className="whitespace-pre-wrap">{displayContent}</p>
          ) : (
            <MarkdownRenderer content={displayContent} />
          )}
        </div>

        {/* Streaming indicator and stop button */}
        {isStreaming && (
          <div className="flex items-center gap-3 px-2">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
              <span>Generating response...</span>
            </div>
            {onStop && (
              <Button
                size="sm"
                variant="outline"
                onClick={onStop}
                className="h-6 gap-1 text-xs"
              >
                <Square className="w-3 h-3" />
                Stop
              </Button>
            )}
          </div>
        )}

        {/* Error indicator */}
        {hasError && !isStreaming && (
          <div className="flex items-center gap-2 px-2 text-xs text-red-600">
            <AlertCircle className="w-3 h-3" />
            <span>Error generating response</span>
          </div>
        )}

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
        <div className="flex items-center gap-2 text-xs text-gray-500 flex-wrap">
          {!isStreaming && message.model_used && (
            <span className="font-mono bg-gray-200 px-2 py-0.5 rounded">
              {message.model_used}
            </span>
          )}
          {!isStreaming && message.prompt_tokens && message.completion_tokens && (
            <span className="text-gray-600">
              {message.prompt_tokens + message.completion_tokens} tokens
            </span>
          )}
          {!isStreaming && message.processing_time_ms && (
            <span className="text-gray-600">{(message.processing_time_ms / 1000).toFixed(2)}s</span>
          )}
          {!isStreaming && (
            <span className="text-gray-600">{format(new Date(message.created_at), 'HH:mm')}</span>
          )}
        </div>
      </div>
    </div>
  )
}
