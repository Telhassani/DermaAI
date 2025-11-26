'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import { SendIcon, Paperclip, X, AlertCircle, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSendMessage: (content: string, file?: File, model?: string) => Promise<void>
  isLoading?: boolean
  availableModels?: string[]
  disabled?: boolean
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validate file size (25MB)
    if (selectedFile.size > 25 * 1024 * 1024) {
      setError('File size exceeds 25MB limit')
      return
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ]
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Invalid file type. Allowed: PDF, JPEG, PNG, GIF, WebP')
      return
    }

    setFile(selectedFile)
    setError('')
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

    try {
      await onSendMessage(content.trim() || 'Please analyze this file', file || undefined, selectedModel || undefined)
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
    <div className="w-full flex flex-col gap-3 p-4 border-t">
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
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your message or ask about the file..."
            disabled={isLoading || disabled}
            className="flex-1"
          />

          {/* Model and file selection */}
          <div className="flex gap-2 items-center">
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
