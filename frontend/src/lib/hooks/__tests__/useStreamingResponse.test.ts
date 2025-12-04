/**
 * Tests for useStreamingResponse hook
 * Tests SSE parsing, error handling, and stream lifecycle
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useStreamingResponse } from '../useStreamingResponse'

// Mock fetch
global.fetch = vi.fn()

describe('useStreamingResponse', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('Stream Initialization', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useStreamingResponse())

      expect(result.current.isStreaming).toBe(false)
      expect(result.current.error).toBe(null)
      expect(result.current.chunkCount).toBe(0)
    })

    it('should set streaming state on start', async () => {
      const mockStream = async function* () {
        yield 'Hello'
        yield ' '
        yield 'World'
      }

      // Mock fetch to return a readable stream
      const mockReadableStream = new ReadableStream({
        async start(controller) {
          controller.enqueue(
            new TextEncoder().encode('data: {"type":"start"}\n\n')
          )
          controller.enqueue(
            new TextEncoder().encode('data: {"type":"chunk","content":"Hello"}\n\n')
          )
          controller.enqueue(
            new TextEncoder().encode('data: {"type":"complete","chunks":1,"elapsed_seconds":0.1}\n\n')
          )
          controller.close()
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
        status: 200,
      })

      const { result } = renderHook(() =>
        useStreamingResponse({
          onStart: () => {},
          onChunk: () => {},
        })
      )

      localStorage.setItem('access_token', 'test_token')

      const streamPromise = result.current.stream('/api/test', {
        method: 'POST',
      })

      await waitFor(() => {
        expect(result.current.isStreaming).toBe(true)
      })
    })
  })

  describe('SSE Event Parsing', () => {
    it('should parse chunk events correctly', async () => {
      let receivedChunks: string[] = []
      const onChunk = vi.fn((chunk: string) => {
        receivedChunks.push(chunk)
      })

      const mockReadableStream = new ReadableStream({
        async start(controller) {
          controller.enqueue(
            new TextEncoder().encode('data: {"type":"start"}\n\n')
          )
          controller.enqueue(
            new TextEncoder().encode('data: {"type":"chunk","content":"Hello"}\n\n')
          )
          controller.enqueue(
            new TextEncoder().encode('data: {"type":"chunk","content":" World"}\n\n')
          )
          controller.enqueue(
            new TextEncoder().encode('data: {"type":"complete","chunks":2,"elapsed_seconds":0.1}\n\n')
          )
          controller.close()
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
        status: 200,
      })

      const { result } = renderHook(() =>
        useStreamingResponse({ onChunk })
      )

      localStorage.setItem('access_token', 'test_token')

      await result.current.stream('/api/test', { method: 'POST' })

      await waitFor(() => {
        expect(receivedChunks.length).toBeGreaterThan(0)
      })
    })

    it('should handle heartbeat events', async () => {
      const onHeartbeat = vi.fn()

      const mockReadableStream = new ReadableStream({
        async start(controller) {
          controller.enqueue(
            new TextEncoder().encode('data: {"type":"start"}\n\n')
          )
          controller.enqueue(
            new TextEncoder().encode('data: {"type":"heartbeat","chunks_received":5}\n\n')
          )
          controller.enqueue(
            new TextEncoder().encode('data: {"type":"complete","chunks":5,"elapsed_seconds":0.5}\n\n')
          )
          controller.close()
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
        status: 200,
      })

      const { result } = renderHook(() =>
        useStreamingResponse({ onHeartbeat })
      )

      localStorage.setItem('access_token', 'test_token')

      await result.current.stream('/api/test', { method: 'POST' })

      await waitFor(() => {
        expect(onHeartbeat).toHaveBeenCalled()
      })
    })

    it('should parse complete event with stats', async () => {
      const onComplete = vi.fn()

      const mockReadableStream = new ReadableStream({
        async start(controller) {
          controller.enqueue(
            new TextEncoder().encode('data: {"type":"start"}\n\n')
          )
          controller.enqueue(
            new TextEncoder().encode('data: {"type":"chunk","content":"Response"}\n\n')
          )
          controller.enqueue(
            new TextEncoder().encode('data: {"type":"complete","chunks":1,"elapsed_seconds":1.5}\n\n')
          )
          controller.close()
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
        status: 200,
      })

      const { result } = renderHook(() =>
        useStreamingResponse({ onComplete })
      )

      localStorage.setItem('access_token', 'test_token')

      await result.current.stream('/api/test', { method: 'POST' })

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith(1, expect.closeTo(1.5, 0.1))
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle stream errors', async () => {
      const onError = vi.fn()

      const mockReadableStream = new ReadableStream({
        async start(controller) {
          controller.enqueue(
            new TextEncoder().encode('data: {"type":"start"}\n\n')
          )
          controller.enqueue(
            new TextEncoder().encode('data: {"type":"error","error":"timeout","message":"Request timed out"}\n\n')
          )
          controller.close()
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
        status: 200,
      })

      const { result } = renderHook(() =>
        useStreamingResponse({ onError })
      )

      localStorage.setItem('access_token', 'test_token')

      try {
        await result.current.stream('/api/test', { method: 'POST' })
      } catch (e) {
        // Expected to throw
      }

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.stringContaining('timeout'))
      })
    })

    it('should handle HTTP errors', async () => {
      const onError = vi.fn()

      ;(global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        body: null,
      })

      const { result } = renderHook(() =>
        useStreamingResponse({ onError })
      )

      localStorage.setItem('access_token', 'test_token')

      try {
        await result.current.stream('/api/test', { method: 'POST' })
      } catch (e) {
        // Expected to throw
      }

      await waitFor(() => {
        expect(onError).toHaveBeenCalled()
      })
    })

    it('should handle null response body', async () => {
      const onError = vi.fn()

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        body: null,
      })

      const { result } = renderHook(() =>
        useStreamingResponse({ onError })
      )

      localStorage.setItem('access_token', 'test_token')

      try {
        await result.current.stream('/api/test', { method: 'POST' })
      } catch (e) {
        // Expected to throw
      }

      await waitFor(() => {
        expect(onError).toHaveBeenCalled()
      })
    })
  })

  describe('Stream Control', () => {
    it('should stop stream when stop() is called', async () => {
      const { result } = renderHook(() => useStreamingResponse())

      localStorage.setItem('access_token', 'test_token')

      // Simulate active stream
      result.current.stop()

      expect(result.current.isStreaming).toBe(false)
    })

    it('should add auth token from localStorage', async () => {
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode('data: {"type":"start"}\n\n')
          )
          controller.enqueue(
            new TextEncoder().encode('data: {"type":"complete","chunks":0,"elapsed_seconds":0}\n\n')
          )
          controller.close()
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
        status: 200,
      })

      const { result } = renderHook(() => useStreamingResponse())

      localStorage.setItem('access_token', 'test_token_123')

      await result.current.stream('/api/test', { method: 'POST' })

      await waitFor(() => {
        const callArgs = (global.fetch as any).mock.calls[0]
        expect(callArgs[1].headers.Authorization).toBe('Bearer test_token_123')
      })
    })

    it('should construct full URL correctly', async () => {
      const mockReadableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode('data: {"type":"complete","chunks":0,"elapsed_seconds":0}\n\n')
          )
          controller.close()
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
        status: 200,
      })

      const { result } = renderHook(() => useStreamingResponse())

      localStorage.setItem('access_token', 'test_token')

      await result.current.stream('/test-endpoint', { method: 'POST' })

      const callUrl = (global.fetch as any).mock.calls[0][0]
      expect(callUrl).toContain('/api/v1/test-endpoint')
    })
  })

  describe('Chunk Counting', () => {
    it('should count chunks correctly', async () => {
      let chunkCount = 0
      const onChunk = vi.fn(() => {
        chunkCount++
      })

      const mockReadableStream = new ReadableStream({
        async start(controller) {
          controller.enqueue(
            new TextEncoder().encode('data: {"type":"start"}\n\n')
          )
          for (let i = 0; i < 5; i++) {
            controller.enqueue(
              new TextEncoder().encode(
                `data: {"type":"chunk","content":"chunk${i}"}\n\n`
              )
            )
          }
          controller.enqueue(
            new TextEncoder().encode('data: {"type":"complete","chunks":5,"elapsed_seconds":0.5}\n\n')
          )
          controller.close()
        },
      })

      ;(global.fetch as any).mockResolvedValue({
        ok: true,
        body: mockReadableStream,
        status: 200,
      })

      const { result } = renderHook(() =>
        useStreamingResponse({ onChunk })
      )

      localStorage.setItem('access_token', 'test_token')

      const { chunks } = await result.current.stream('/api/test', {
        method: 'POST',
      })

      expect(chunks).toBe(5)
      expect(chunkCount).toBe(5)
    })
  })
})
