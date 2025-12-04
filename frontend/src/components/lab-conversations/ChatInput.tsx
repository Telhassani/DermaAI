'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SendIcon, Paperclip, X, AlertCircle, ChevronDown, BookOpen } from 'lucide-react'
import { cn } from '@/lib/utils'
import { sanitizeInput, validateFileUploadSafety, ClientRateLimiter } from '@/lib/utils/security'
import { usePromptTemplates } from '@/lib/stores/useConversationStore'
import { PromptTemplates } from './PromptTemplates'

interface ChatInputProps {
  onSendMessage: (content: string, file?: File, model?: string) => Promise<void>
  isLoading?: boolean
  availableModels?: string[]
  disabled?: boolean
  conversationId?: number
}

export function ChatInput({
  onSendMessage,
  isLoading,
  availableModels = [],
  disabled,
}: ChatInputProps) {
  const [content, setContent] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [selectedModel, setSelectedModel] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const contentInputRef = useRef<HTMLInputElement>(null)
  const templatesState = usePromptTemplates()
  const promptTemplates = templatesState.promptTemplates

  // Rate limiter: 5 messages per minute per user
  const messageLimiter = useRef(new ClientRateLimiter(5, 60000))

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validate file using security utilities
    const validation = validateFileUploadSafety(selectedFile)
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file')
      return
    }

    setFile(selectedFile)
    setError('')
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length === 0) return

    const selectedFile = droppedFiles[0]
    const validation = validateFileUploadSafety(selectedFile)
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file')
      return
    }

    setFile(selectedFile)
    setError('')
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        const file = items[i].getAsFile()
        if (file) {
          const validation = validateFileUploadSafety(file)
          if (!validation.isValid) {
            setError(validation.error || 'Invalid file')
            return
          }

          setFile(file)
          setError('')
          return
        }
      }
    }
  }

  const handleSelectTemplate = (templateText: string) => {
    setContent(templateText)
    setShowTemplates(false)
    contentInputRef.current?.focus()
  }

  const handleRemoveFile = () => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSend = async () => {
    if (!content.trim() && !file) {
      setError('Please enter a message or select a file')
      return
    }

    // Check rate limiting
    if (messageLimiter.current.isRateLimited('message')) {
      setError('Too many messages. Please wait before sending again.')
      return
    }

    try {
      // Sanitize message content to prevent XSS
      const sanitizedContent = sanitizeInput(content.trim()) || 'Please analyze this file'

      await onSendMessage(sanitizedContent, file || undefined, selectedModel || undefined)
      setContent('')
      setFile(null)
      setError('')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className={cn(
        'w-full flex flex-col gap-3 p-4 border-t transition-colors',
        isDragging && 'bg-blue-50 border-blue-200'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Templates panel */}
      {showTemplates && promptTemplates.length > 0 && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-sm text-gray-900">Prompt Templates</h3>
            <button
              onClick={() => setShowTemplates(false)}
              className="text-gray-400 hover:text-gray-600"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <PromptTemplates onSelectTemplate={handleSelectTemplate} />
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* File attachment preview */}
      {file && (
        <div className="flex items-center justify-between px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center gap-2">
            <Paperclip className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">{file.name}</span>
            <span className="text-xs text-blue-600">
              ({(file.size / 1024 / 1024).toFixed(2)}MB)
            </span>
          </div>
          <button
            onClick={handleRemoveFile}
            className="p-1 hover:bg-blue-100 rounded-md transition-colors"
            type="button"
          >
            <X className="w-4 h-4 text-blue-600" />
          </button>
        </div>
      )}

      {/* Input area */}
      <div className="flex gap-2 items-end">
        {/* Message input */}
        <div className="flex-1 flex flex-col gap-2">
          <Input
            ref={contentInputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Enter your message or ask about the file... (or paste an image)"
            disabled={isLoading || disabled}
            className="flex-1"
          />

          {/* Model and file selection */}
          <div className="flex gap-2 items-center">
            {/* Template button */}
            {promptTemplates.length > 0 && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowTemplates(!showTemplates)}
                disabled={isLoading || disabled}
                title="Insert prompt template"
              >
                <BookOpen className="w-4 h-4" />
              </Button>
            )}

            {availableModels.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-48 justify-between"
                    disabled={isLoading || disabled}
                  >
                    <span className="text-sm">
                      {selectedModel || 'Select model...'}
                    </span>
                    <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem
                    onClick={() => setSelectedModel('')}
                    className={selectedModel === '' ? 'bg-accent' : ''}
                  >
                    Use default model
                  </DropdownMenuItem>
                  {availableModels.map((model) => (
                    <DropdownMenuItem
                      key={model}
                      onClick={() => setSelectedModel(model)}
                      className={selectedModel === model ? 'bg-accent' : ''}
                    >
                      {model}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* File upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || disabled}
              className={cn(
                'p-2 rounded-md border transition-colors',
                'hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              type="button"
              title="Attach file"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
            />
          </div>
        </div>

        {/* Send button */}
        <Button
          onClick={handleSend}
          disabled={isLoading || disabled || (!content.trim() && !file)}
          size="icon"
          className="flex-shrink-0"
        >
          {isLoading ? (
            <span className="animate-spin">↻</span>
          ) : (
            <SendIcon className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
