/**
 * Hook for Server-Sent Events (SSE) streaming from lab conversations
 * Handles real-time streaming of AI responses
 */

import { useCallback, useRef, useState } from 'react'
import { apiClient } from '@/lib/api/client'

interface StreamingState {
  isStreaming: boolean
  content: string
  error: string | null
}

/**
 * Hook to stream messages from the backend using Server-Sent Events
 * @param conversationId - The conversation ID to stream from
 * @returns { isStreaming, content, error, startStream, cancel }
 */
export function useStreamingMessage(conversationId?: number) {
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    content: '',
    error: null,
  })

  const eventSourceRef = useRef<EventSource | null>(null)

  /**
   * Start streaming a message from the server
   * @param messageId - The message ID to stream
   */
  const startStream = useCallback(
    (messageId: number) => {
      if (!conversationId) {
        setState((prev) => ({ ...prev, error: 'No conversation selected' }))
        return
      }

      try {
        setState({ isStreaming: true, content: '', error: null })

        // Create EventSource for SSE
        const token = localStorage.getItem('access_token')
        const eventSource = new EventSource(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/lab-conversations/conversations/${conversationId}/messages/${messageId}/stream`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          } as any
        )

        eventSourceRef.current = eventSource

        // Handle incoming messages
        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data)

          if (data.type === 'content') {
            // Append to existing content
            setState((prev) => ({
              ...prev,
              content: prev.content + data.content,
            }))
          } else if (data.type === 'done') {
            // Stream finished
            setState((prev) => ({ ...prev, isStreaming: false }))
            eventSource.close()
            eventSourceRef.current = null
          } else if (data.type === 'error') {
            // Error occurred
            setState((prev) => ({
              ...prev,
              isStreaming: false,
              error: data.error || 'Unknown streaming error',
            }))
            eventSource.close()
            eventSourceRef.current = null
          }
        }

        eventSource.onerror = () => {
          setState((prev) => ({
            ...prev,
            isStreaming: false,
            error: 'Connection error while streaming',
          }))
          eventSource.close()
          eventSourceRef.current = null
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }))
      }
    },
    [conversationId]
  )

  /**
   * Cancel the current stream
   */
  const cancel = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setState((prev) => ({ ...prev, isStreaming: false }))
  }, [])

  return {
    ...state,
    startStream,
    cancel,
  }
}

/**
 * Hook to generate and stream an AI response
 * Note: Requires backend to implement streaming endpoint
 * @param conversationId - The conversation ID
 * @returns { isGenerating, content, error, generateResponse }
 */
export function useAIResponseStream(conversationId?: number) {
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    content: '',
    error: null,
  })

  const eventSourceRef = useRef<EventSource | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  /**
   * Generate and stream an AI response
   * @param messageId - The user message ID to respond to
   * @param selectedModel - The AI model to use
   */
  const generateResponse = useCallback(
    async (messageId: number, selectedModel?: string) => {
      if (!conversationId) {
        setState((prev) => ({ ...prev, error: 'No conversation selected' }))
        return
      }

      try {
        setState({ isStreaming: true, content: '', error: null })

        const token = localStorage.getItem('access_token')
        const url = new URL(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/lab-conversations/conversations/${conversationId}/messages/${messageId}/generate-stream`
        )

        if (selectedModel) {
          url.searchParams.append('model', selectedModel)
        }

        const eventSource = new EventSource(url.toString(), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        } as any)

        eventSourceRef.current = eventSource

        // Handle incoming stream chunks
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)

            if (data.type === 'content') {
              // Append to existing content (streaming chunk)
              setState((prev) => ({
                ...prev,
                content: prev.content + (data.content || ''),
              }))
            } else if (data.type === 'metadata') {
              // Metadata about the response (tokens, model, etc.)
              // Can be handled separately if needed
            } else if (data.type === 'done') {
              // Stream complete
              setState((prev) => ({
                ...prev,
                isStreaming: false,
              }))
              eventSource.close()
              eventSourceRef.current = null
            } else if (data.type === 'error') {
              // Error during generation
              setState((prev) => ({
                ...prev,
                isStreaming: false,
                error: data.message || 'Error generating response',
              }))
              eventSource.close()
              eventSourceRef.current = null
            }
          } catch (parseError) {
            console.error('Error parsing stream data:', parseError)
          }
        }

        eventSource.onerror = () => {
          setState((prev) => ({
            ...prev,
            isStreaming: false,
            error: 'Connection lost during streaming',
          }))
          eventSource.close()
          eventSourceRef.current = null
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        }))
      }
    },
    [conversationId]
  )

  /**
   * Cancel the current generation
   */
  const cancel = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    setState((prev) => ({ ...prev, isStreaming: false }))
  }, [])

  return {
    ...state,
    generateResponse,
    cancel,
  }
}
