'use client'

import { Message } from '@/types/api'
import { cn } from '@/lib/utils'
import { FileIcon, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface ChatMessageProps {
  message: Message
  isLoading?: boolean
}

export function ChatMessage({ message, isLoading }: ChatMessageProps) {
  const isUser = message.role === 'USER'
  const isSystem = message.role === 'SYSTEM'

  return (
    <div
      className={cn(
        'flex w-full mb-4',
        isUser ? 'justify-end' : 'justify-start',
        isSystem && 'justify-center'
      )}
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
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Typing...</span>
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{message.content}</p>
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
      </div>
    </div>
  )
}
