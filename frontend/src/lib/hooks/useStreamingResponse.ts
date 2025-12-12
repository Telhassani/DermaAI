'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

export interface StreamingEvent {
  type: 'start' | 'chunk' | 'heartbeat' | 'complete' | 'error'
  content?: string
  chunks?: number
  elapsed_seconds?: number
  error?: string
  message?: string
  chunks_received?: number
  message_id?: number
}

interface UseStreamingResponseOptions {
  onChunk?: (content: string) => void
  onStart?: () => void
  onComplete?: (chunks: number, elapsed: number, messageId?: number) => void
  onError?: (error: string) => void
  onHeartbeat?: (chunksReceived: number) => void
}

/**
 * Hook for consuming Server-Sent Events (SSE) streaming responses
 * Handles EventSource management, error handling, and event parsing
 *
 * Usage:
 * ```tsx
 * const { stream, isStreaming, error, stop } = useStreamingResponse({
 *   onChunk: (content) => setStreamingContent(prev => prev + content),
 *   onComplete: (chunks, elapsed) => console.log(`Done: ${chunks} chunks in ${elapsed}s`)
 * })
 *
 * // Start streaming
 * await stream('/api/v1/lab-conversations/1/messages/2/stream', {
 *   method: 'POST',
 *   headers: { 'Authorization': `Bearer ${token}` }
 * })
 * ```
 */
export function useStreamingResponse(options: UseStreamingResponseOptions = {}) {
  const { onChunk, onStart, onComplete, onError, onHeartbeat } = options

  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chunkCount, setChunkCount] = useState(0)
  const eventSourceRef = useRef<EventSource | null>(null)
  const startTimeRef = useRef<number>(0)

  // Stop the stream
  const stop = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
      setIsStreaming(false)
    }
  }, [])

  // Parse SSE data (format: "data: {JSON}")
  const parseSSEEvent = (data: string): StreamingEvent | null => {
    try {
      const trimmed = data.trim()
      if (!trimmed) return null
      return JSON.parse(trimmed) as StreamingEvent
    } catch (e) {
      console.error('Failed to parse SSE event:', e, data)
      return null
    }
  }

  // Stream from endpoint using fetch + ReadableStream
  const stream = useCallback(
    async (
      url: string,
      options?: RequestInit
    ): Promise<{ chunks: number; elapsed: number }> => {
      return new Promise((resolve, reject) => {
        (async () => {
          try {
            setError(null)
            setChunkCount(0)
            setIsStreaming(true)
            startTimeRef.current = Date.now()
            onStart?.()

            // Get auth token from Supabase client or localStorage fallback
            let token: string | null = null
            try {
              const { createClient } = await import('@/lib/supabase/client')
              const supabase = createClient()
              const { data: { session } } = await supabase.auth.getSession()
              token = session?.access_token ?? null
            } catch (error) {
              // Fallback to localStorage for backwards compatibility
              token = localStorage.getItem('access_token')
            }

            const headers = new Headers(options?.headers || {})
            if (token) {
              headers.set('Authorization', `Bearer ${token}`)
            }

            // Construct full URL
            // Construct full URL
            let baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'
            // Remove trailing slash
            baseUrl = baseUrl.replace(/\/$/, '')
            // Remove /api/v1 suffix if present to avoid duplication
            baseUrl = baseUrl.replace(/\/api\/v1$/, '')

            const endpoint = url.startsWith('/') ? url : `/${url}`
            const fullUrl = url.startsWith('http')
              ? url
              : `${baseUrl}/api/v1${endpoint}`

            console.log('[Streaming] Requesting URL:', fullUrl)

            // Fetch with streaming response
            const response = await fetch(fullUrl, {
              ...options,
              headers,
              method: options?.method || 'GET',
            })

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`)
            }

            if (!response.body) {
              throw new Error('Response body is null')
            }

            // Read the stream
            const reader = response.body.getReader()
            const decoder = new TextDecoder()
            let buffer = ''
            let chunkCounter = 0

            while (true) {
              const { done, value } = await reader.read()

              if (done) break

              // Decode chunk and add to buffer
              buffer += decoder.decode(value, { stream: true })

              // Process complete lines (SSE format: "data: {JSON}\n\n")
              const lines = buffer.split('\n')

              // Keep the last incomplete line in the buffer
              buffer = lines[lines.length - 1]

              for (let i = 0; i < lines.length - 1; i++) {
                const line = lines[i].trim()

                if (line.startsWith('data: ')) {
                  const dataStr = line.substring(6)
                  const parsedEvent = parseSSEEvent(dataStr)
                  if (!parsedEvent) continue

                  switch (parsedEvent.type) {
                    case 'start':
                      // Stream started
                      onStart?.()
                      break

                    case 'chunk':
                      // New content chunk received
                      if (parsedEvent.content) {
                        onChunk?.(parsedEvent.content)
                        chunkCounter += 1
                        setChunkCount(chunkCounter)
                      }
                      break

                    case 'heartbeat':
                      // Heartbeat to keep connection alive
                      onHeartbeat?.(parsedEvent.chunks_received || 0)
                      break

                    case 'complete':
                      // Stream completed successfully
                      setIsStreaming(false)
                      const elapsed =
                        parsedEvent.elapsed_seconds ||
                        (Date.now() - startTimeRef.current) / 1000
                      const chunks = parsedEvent.chunks || chunkCounter
                      onComplete?.(chunks, elapsed, parsedEvent.message_id)
                      resolve({ chunks, elapsed })
                      return

                    case 'error':
                      // Error occurred during streaming
                      const errorMsg =
                        parsedEvent.message || parsedEvent.error || 'Unknown error'
                      setError(errorMsg)
                      onError?.(errorMsg)
                      setIsStreaming(false)
                      reject(new Error(errorMsg))
                      return

                    default:
                      console.warn('Unknown event type:', parsedEvent.type)
                  }
                }
              }
            }

            // If we exit the loop without a complete event, it's an error
            if (!response.ok) {
              throw new Error('Stream ended unexpectedly')
            }
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error'
            setError(errorMsg)
            onError?.(errorMsg)
            setIsStreaming(false)
            reject(err)
          }
        })()
      })
    },
    [onChunk, onStart, onComplete, onError, onHeartbeat]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  return {
    stream,
    stop,
    isStreaming,
    error,
    chunkCount,
  }
}
