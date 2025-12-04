'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Download, FileJson, FileText, Table } from 'lucide-react'
import { Conversation, Message } from '@/types/api'
import { exportConversation, ExportFormat } from '@/lib/utils/export'

interface ExportDialogProps {
  conversation: Conversation | null
  messages: Message[]
  isOpen: boolean
  onClose: () => void
}

/**
 * Dialog for exporting conversation in various formats
 * Supports JSON, CSV, and Markdown exports
 */
export function ExportDialog({
  conversation,
  messages,
  isOpen,
  onClose,
}: ExportDialogProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('json')

  if (!conversation) {
    return null
  }

  const handleExport = async () => {
    try {
      setIsExporting(true)
      await exportConversation(conversation, messages, selectedFormat)
      onClose()
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const exportOptions: Array<{
    format: ExportFormat
    title: string
    description: string
    icon: React.ReactNode
  }> = [
    {
      format: 'json',
      title: 'JSON',
      description: 'Complete conversation data with all metadata',
      icon: <FileJson className="w-5 h-5" />,
    },
    {
      format: 'csv',
      title: 'CSV',
      description: 'Spreadsheet-compatible format for analysis',
      icon: <Table className="w-5 h-5" />,
    },
    {
      format: 'markdown',
      title: 'Markdown',
      description: 'Human-readable formatted text document',
      icon: <FileText className="w-5 h-5" />,
    },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Export Conversation</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info about conversation */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
            Exporting <strong>{conversation.title}</strong> with {messages.length} messages
          </div>

          {/* Export format options */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Select Format</label>

            <div className="grid gap-3">
              {exportOptions.map((option) => (
                <button
                  key={option.format}
                  onClick={() => setSelectedFormat(option.format)}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    selectedFormat === option.format
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                  disabled={isExporting}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded ${
                        selectedFormat === option.format ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {option.icon}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{option.title}</p>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Format details */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-600 space-y-1">
            {selectedFormat === 'json' && (
              <>
                <p>
                  <strong>JSON Format:</strong> Complete conversation data including all metadata
                </p>
                <p>Best for: Archiving, backup, or analysis with scripts</p>
              </>
            )}
            {selectedFormat === 'csv' && (
              <>
                <p>
                  <strong>CSV Format:</strong> Tabular format with one message per row
                </p>
                <p>Best for: Spreadsheet analysis, statistics, or data processing</p>
              </>
            )}
            {selectedFormat === 'markdown' && (
              <>
                <p>
                  <strong>Markdown Format:</strong> Formatted text document with proper styling
                </p>
                <p>Best for: Reading, documentation, or sharing with others</p>
              </>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting} className="gap-2">
            <Download className="w-4 h-4" />
            {isExporting ? 'Exporting...' : 'Export'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
