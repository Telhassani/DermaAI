'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle } from 'lucide-react'
import { Message } from '@/types/api'

interface MessageEditDialogProps {
  message: Message | null
  isOpen: boolean
  isLoading?: boolean
  onClose: () => void
  onSave: (content: string) => Promise<void>
}

/**
 * Dialog component for editing message content
 * Allows users to modify sent messages
 */
export function MessageEditDialog({
  message,
  isOpen,
  isLoading = false,
  onClose,
  onSave,
}: MessageEditDialogProps) {
  const [content, setContent] = useState('')
  const [error, setError] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)

  // Initialize content when dialog opens
  useEffect(() => {
    if (isOpen && message) {
      setContent(message.content)
      setError('')
    }
  }, [isOpen, message])

  const handleSave = async () => {
    if (!content.trim()) {
      setError('Message cannot be empty')
      return
    }

    if (content === message?.content) {
      setError('No changes made')
      return
    }

    try {
      setIsSaving(true)
      setError('')
      await onSave(content.trim())
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save message')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setContent(message?.content || '')
    setError('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Message</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="w-4 h-4 mt-0.5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Info for user messages */}
          {message?.role === 'USER' && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <AlertCircle className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
              <p className="text-sm text-blue-700">
                Editing this message will delete all subsequent messages and regenerate the AI response.
              </p>
            </div>
          )}

          {/* Warning for AI messages */}
          {message?.role === 'ASSISTANT' && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <AlertCircle className="w-4 h-4 mt-0.5 text-yellow-600 flex-shrink-0" />
              <p className="text-sm text-yellow-700">
                Editing AI responses will not regenerate the message. Edit only to fix formatting or minor issues.
              </p>
            </div>
          )}

          {/* Message content editor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message Content
            </label>
            <Textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value)
                setError('')
              }}
              placeholder="Edit your message..."
              rows={6}
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSaving || isLoading}
            />
            <p className="mt-2 text-xs text-gray-500">
              {content.length} characters
            </p>
          </div>

          {/* Read-only metadata for context */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-md text-sm">
            <div>
              <span className="text-gray-600">Message Type:</span>
              <p className="font-medium text-gray-900">
                {message?.role === 'USER' ? 'Your message' : 'AI response'}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Sent at:</span>
              <p className="font-medium text-gray-900">
                {message?.created_at
                  ? new Date(message.created_at).toLocaleString()
                  : 'Unknown'}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSaving || isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              isSaving ||
              isLoading ||
              !content.trim() ||
              content === message?.content
            }
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
