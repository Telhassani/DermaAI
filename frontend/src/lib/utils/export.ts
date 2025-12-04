/**
 * Conversation export utilities
 * Support for exporting chat history in multiple formats (PDF, JSON, CSV)
 */

import { Conversation, Message } from '@/types/api'

export type ExportFormat = 'json' | 'csv' | 'markdown' | 'pdf'

/**
 * Export conversation as JSON
 * Includes all messages and metadata
 */
export function exportAsJSON(conversation: Conversation, messages: Message[]): string {
  const data = {
    conversation: {
      id: conversation.id,
      title: conversation.title,
      description: conversation.description,
      created_at: conversation.created_at,
      updated_at: conversation.updated_at,
      message_count: conversation.message_count,
    },
    messages: messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      model_used: msg.model_used,
      prompt_tokens: msg.prompt_tokens,
      completion_tokens: msg.completion_tokens,
      processing_time_ms: msg.processing_time_ms,
      created_at: msg.created_at,
      updated_at: msg.updated_at,
      is_edited: msg.is_edited,
    })),
    exported_at: new Date().toISOString(),
  }

  return JSON.stringify(data, null, 2)
}

/**
 * Export conversation as CSV
 * One row per message with key information
 */
export function exportAsCSV(conversation: Conversation, messages: Message[]): string {
  const headers = ['Timestamp', 'Author', 'Role', 'Content', 'Model', 'Tokens', 'Processing Time']
  const rows: string[][] = []

  messages.forEach((msg) => {
    rows.push([
      new Date(msg.created_at).toLocaleString(),
      msg.role === 'USER' ? 'You' : msg.role === 'ASSISTANT' ? 'AI' : 'System',
      msg.role,
      `"${msg.content.replace(/"/g, '""')}"`, // Escape quotes in CSV
      msg.model_used || '',
      msg.prompt_tokens && msg.completion_tokens
        ? String(msg.prompt_tokens + msg.completion_tokens)
        : '',
      msg.processing_time_ms ? `${(msg.processing_time_ms / 1000).toFixed(2)}s` : '',
    ])
  })

  // Combine headers and rows
  const csv = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n')

  return csv
}

/**
 * Export conversation as Markdown
 * Human-readable format with proper formatting
 */
export function exportAsMarkdown(conversation: Conversation, messages: Message[]): string {
  const lines: string[] = []

  // Header
  lines.push(`# ${conversation.title}`)
  lines.push('')

  if (conversation.description) {
    lines.push(conversation.description)
    lines.push('')
  }

  // Metadata
  lines.push('## Metadata')
  lines.push(`- **Conversation ID:** ${conversation.id}`)
  lines.push(`- **Created:** ${new Date(conversation.created_at).toLocaleString()}`)
  lines.push(`- **Updated:** ${new Date(conversation.updated_at).toLocaleString()}`)
  lines.push(`- **Total Messages:** ${messages.length}`)
  lines.push('')

  // Messages
  lines.push('## Conversation')
  lines.push('')

  messages.forEach((msg) => {
    const timestamp = new Date(msg.created_at).toLocaleString()
    const author = msg.role === 'USER' ? '👤 You' : msg.role === 'ASSISTANT' ? '🤖 AI' : '⚙️ System'

    lines.push(`### ${author}`)
    lines.push(`_${timestamp}_`)

    if (msg.model_used) {
      lines.push(`\`\`\`\nModel: ${msg.model_used}\n\`\`\``)
    }

    lines.push('')
    lines.push(msg.content)
    lines.push('')

    if (msg.prompt_tokens && msg.completion_tokens) {
      const totalTokens = msg.prompt_tokens + msg.completion_tokens
      lines.push(
        `> **Tokens:** ${msg.prompt_tokens} prompt + ${msg.completion_tokens} completion = ${totalTokens} total`
      )
    }

    if (msg.processing_time_ms) {
      lines.push(`> **Processing Time:** ${(msg.processing_time_ms / 1000).toFixed(2)}s`)
    }

    if (msg.is_edited) {
      lines.push(`> **Note:** This message was edited`)
    }

    lines.push('')
  })

  return lines.join('\n')
}

/**
 * Download data as file
 * Helper function to trigger browser download
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = 'text/plain'
) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, 100)
}

/**
 * Export conversation in specified format and download
 */
export async function exportConversation(
  conversation: Conversation,
  messages: Message[],
  format: ExportFormat
) {
  let content: string
  let filename: string
  let mimeType: string

  const dateStr = new Date().toISOString().split('T')[0]
  const safeTitle = conversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()

  switch (format) {
    case 'json':
      content = exportAsJSON(conversation, messages)
      filename = `conversation_${safeTitle}_${dateStr}.json`
      mimeType = 'application/json'
      break

    case 'csv':
      content = exportAsCSV(conversation, messages)
      filename = `conversation_${safeTitle}_${dateStr}.csv`
      mimeType = 'text/csv;charset=utf-8;'
      break

    case 'markdown':
      content = exportAsMarkdown(conversation, messages)
      filename = `conversation_${safeTitle}_${dateStr}.md`
      mimeType = 'text/markdown'
      break

    case 'pdf':
      // PDF export requires additional library (jspdf/pdfkit)
      // For now, we'll export as markdown and note PDF support
      content = exportAsMarkdown(conversation, messages)
      filename = `conversation_${safeTitle}_${dateStr}.md`
      mimeType = 'text/markdown'
      console.warn('PDF export requires jspdf library. Exporting as Markdown instead.')
      break

    default:
      throw new Error(`Unsupported export format: ${format}`)
  }

  downloadFile(content, filename, mimeType)
}

/**
 * Get MIME type for export format
 */
export function getMimeType(format: ExportFormat): string {
  switch (format) {
    case 'json':
      return 'application/json'
    case 'csv':
      return 'text/csv;charset=utf-8;'
    case 'markdown':
      return 'text/markdown'
    case 'pdf':
      return 'application/pdf'
    default:
      return 'text/plain'
  }
}

/**
 * Get file extension for export format
 */
export function getFileExtension(format: ExportFormat): string {
  switch (format) {
    case 'json':
      return '.json'
    case 'csv':
      return '.csv'
    case 'markdown':
      return '.md'
    case 'pdf':
      return '.pdf'
    default:
      return '.txt'
  }
}
