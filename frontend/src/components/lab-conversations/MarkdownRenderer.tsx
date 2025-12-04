'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
}

/**
 * Markdown renderer component for AI responses
 * Supports: bold, italic, code, lists, tables, links, etc.
 * Does NOT render raw HTML for security (XSS prevention)
 */
export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const elements = parseMarkdown(content)

  return (
    <div className={cn('prose prose-sm max-w-none break-words', className)}>
      {elements.map((element, index) => (
        <MarkdownElement key={index} element={element} />
      ))}
    </div>
  )
}

// ============================================================================
// Markdown Parsing
// ============================================================================

interface MarkdownElement {
  type:
    | 'paragraph'
    | 'heading'
    | 'bold'
    | 'italic'
    | 'code'
    | 'codeblock'
    | 'list'
    | 'listitem'
    | 'blockquote'
    | 'link'
    | 'table'
    | 'text'
  content?: string
  level?: number // for headings
  language?: string // for code blocks
  items?: MarkdownElement[] // for lists
  rows?: Array<string[]> // for tables
  url?: string // for links
}

/**
 * Parse markdown-like content into elements
 * Simple parser that handles common markdown syntax
 */
function parseMarkdown(content: string): MarkdownElement[] {
  const lines = content.split('\n')
  const elements: MarkdownElement[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]
    const trimmed = line.trim()

    // Skip empty lines
    if (!trimmed) {
      i++
      continue
    }

    // Headings (# Heading, ## Heading, etc.)
    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      elements.push({
        type: 'heading',
        level: headingMatch[1].length,
        content: headingMatch[2],
      })
      i++
      continue
    }

    // Code blocks (```language ... ```)
    if (trimmed.startsWith('```')) {
      const language = trimmed.slice(3).trim() || 'plaintext'
      const codeLines: string[] = []
      i++

      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }

      if (i < lines.length) {
        i++ // skip closing ```
      }

      elements.push({
        type: 'codeblock',
        language,
        content: codeLines.join('\n'),
      })
      continue
    }

    // Blockquotes (> Quote)
    if (trimmed.startsWith('>')) {
      elements.push({
        type: 'blockquote',
        content: trimmed.slice(1).trim(),
      })
      i++
      continue
    }

    // Unordered lists (- Item or * Item)
    if (trimmed.match(/^[-*]\s+/)) {
      const listItems: MarkdownElement[] = []

      while (i < lines.length && lines[i].trim().match(/^[-*]\s+/)) {
        const itemText = lines[i].trim().slice(2).trim()
        listItems.push({
          type: 'listitem',
          content: itemText,
        })
        i++
      }

      elements.push({
        type: 'list',
        items: listItems,
      })
      continue
    }

    // Ordered lists (1. Item, 2. Item, etc.)
    if (trimmed.match(/^\d+\.\s+/)) {
      const listItems: MarkdownElement[] = []

      while (i < lines.length && lines[i].trim().match(/^\d+\.\s+/)) {
        const itemText = lines[i].trim().replace(/^\d+\.\s+/, '')
        listItems.push({
          type: 'listitem',
          content: itemText,
        })
        i++
      }

      elements.push({
        type: 'list',
        items: listItems,
      })
      continue
    }

    // Regular paragraph
    const paragraphLines: string[] = [line]
    i++

    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().match(/^(#{1,6}\s|```|>|-|\*|\d+\.)/)
    ) {
      paragraphLines.push(lines[i])
      i++
    }

    elements.push({
      type: 'paragraph',
      content: paragraphLines.join('\n'),
    })
  }

  return elements
}

/**
 * Parse inline markdown (bold, italic, code, links)
 */
function parseInlineMarkdown(text: string): (string | MarkdownElement)[] {
  const parts: (string | MarkdownElement)[] = []
  let remaining = text
  let lastIndex = 0

  // Regular expressions for inline elements
  const patterns = [
    { pattern: /\*\*(.+?)\*\*/g, type: 'bold' },
    { pattern: /__(.+?)__/g, type: 'bold' },
    { pattern: /\*(.+?)\*/g, type: 'italic' },
    { pattern: /_(.+?)_/g, type: 'italic' },
    { pattern: /`(.+?)`/g, type: 'code' },
    { pattern: /\[(.+?)\]\((.+?)\)/g, type: 'link' },
  ]

  // Simple inline parsing - handle one pattern at a time
  let match
  let foundMatch = false

  for (const { pattern, type } of patterns) {
    // Create a new pattern each time to reset lastIndex
    const regex = new RegExp(pattern.source, 'g')

    while ((match = regex.exec(text))) {
      foundMatch = true
      const before = text.substring(lastIndex, match.index)

      if (before) {
        parts.push(before)
      }

      if (type === 'bold') {
        parts.push({
          type: 'bold',
          content: match[1],
        })
      } else if (type === 'italic') {
        parts.push({
          type: 'italic',
          content: match[1],
        })
      } else if (type === 'code') {
        parts.push({
          type: 'code',
          content: match[1],
        })
      } else if (type === 'link') {
        parts.push({
          type: 'link',
          content: match[1],
          url: match[2],
        })
      }

      lastIndex = regex.lastIndex
    }

    if (foundMatch) {
      break // Process one pattern and recurse
    }
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex))
  }

  // If no matches found, return original text
  if (parts.length === 0) {
    return [text]
  }

  return parts
}

// ============================================================================
// Markdown Element Renderer
// ============================================================================

interface MarkdownElementProps {
  element: MarkdownElement
}

function MarkdownElement({ element }: MarkdownElementProps) {
  switch (element.type) {
    case 'heading':
      const headingClass = {
        1: 'text-2xl font-bold mt-4 mb-2',
        2: 'text-xl font-bold mt-3 mb-2',
        3: 'text-lg font-bold mt-2 mb-1',
        4: 'text-base font-bold mt-2 mb-1',
        5: 'text-sm font-bold mt-1 mb-1',
        6: 'text-xs font-bold mt-1 mb-1',
      }[element.level || 1]

      return <div className={headingClass}>{element.content}</div>

    case 'paragraph':
      return (
        <p className="my-2 leading-relaxed whitespace-pre-wrap">
          {parseInlineMarkdown(element.content || '').map((part, idx) =>
            typeof part === 'string' ? (
              <span key={idx}>{part}</span>
            ) : (
              <MarkdownElement key={idx} element={part} />
            )
          )}
        </p>
      )

    case 'bold':
      return <strong className="font-semibold text-gray-900">{element.content}</strong>

    case 'italic':
      return <em className="italic text-gray-700">{element.content}</em>

    case 'code':
      return (
        <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono text-red-600 break-all">
          {element.content}
        </code>
      )

    case 'codeblock':
      return (
        <div className="my-3 rounded-lg overflow-hidden bg-gray-900">
          {element.language && (
            <div className="bg-gray-800 px-4 py-1 text-xs font-mono text-gray-400 border-b border-gray-700">
              {element.language}
            </div>
          )}
          <pre className="p-4 overflow-x-auto">
            <code className="text-sm font-mono text-gray-100">
              {element.content}
            </code>
          </pre>
        </div>
      )

    case 'blockquote':
      return (
        <blockquote className="my-3 pl-4 border-l-4 border-gray-300 text-gray-600 italic">
          {element.content}
        </blockquote>
      )

    case 'list':
      return (
        <ul className="my-2 ml-6 space-y-1">
          {element.items?.map((item, idx) => (
            <li key={idx} className="list-disc text-gray-700">
              {item.content}
            </li>
          ))}
        </ul>
      )

    case 'link':
      return (
        <a
          href={element.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          {element.content}
        </a>
      )

    default:
      return <span>{element.content}</span>
  }
}
