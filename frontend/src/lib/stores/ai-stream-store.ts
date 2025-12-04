'use client'

import { create } from 'zustand'
import { api } from '@/lib/api/client'

export interface AIStreamModel {
  id: string
  name: string
  provider: 'anthropic' | 'openai'
  description: string
  capabilities: string[]
}

interface AIStreamStoreState {
  // State
  selectedModel: string | null
  availableModels: AIStreamModel[]
  isLoadingModels: boolean
  error: string | null

  // Actions
  fetchAvailableModels: () => Promise<void>
  selectModel: (modelId: string) => void
  setError: (error: string | null) => void
  clearError: () => void
}

// Model metadata for frontend display
const MODEL_METADATA: Record<string, Omit<AIStreamModel, 'id'>> = {
  'claude-3-opus-20250219': {
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    description: 'Most capable Claude model - best for complex analysis',
    capabilities: ['Vision', 'Code', 'Analysis', 'Medical'],
  },
  'claude-3-5-sonnet-20241022': {
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    description: 'Balanced speed and capability - recommended for most tasks',
    capabilities: ['Vision', 'Code', 'Analysis', 'Medical'],
  },
  'gpt-4-turbo': {
    name: 'GPT-4 Turbo',
    provider: 'openai',
    description: 'Advanced model with extended context window',
    capabilities: ['Vision', 'Code', 'Analysis'],
  },
  'gpt-4o': {
    name: 'GPT-4o',
    provider: 'openai',
    description: 'Latest OpenAI model with optimized performance',
    capabilities: ['Vision', 'Code', 'Analysis'],
  },
}

export const useAIStreamStore = create<AIStreamStoreState>((set, get) => ({
  // Initial state
  selectedModel: null,
  availableModels: [],
  isLoadingModels: false,
  error: null,

  // Fetch available models from backend
  fetchAvailableModels: async () => {
    try {
      set({ isLoadingModels: true, error: null })
      const response = await api.get('/ai-stream/models')
      const data = response.data

      // Map backend models to frontend models with metadata
      const models: AIStreamModel[] = (data.available_models || []).map(
        (modelId: string) => ({
          id: modelId,
          ...MODEL_METADATA[modelId],
        })
      )

      // Set default model if not already selected
      const defaultModel = data.default_model || (models.length > 0 ? models[0].id : null)

      set({
        availableModels: models,
        selectedModel: defaultModel,
        isLoadingModels: false,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load available models'
      set({
        error: errorMessage,
        isLoadingModels: false,
        availableModels: [],
      })
    }
  },

  // Select a model
  selectModel: (modelId: string) => {
    const models = get().availableModels
    if (models.some((m) => m.id === modelId)) {
      set({ selectedModel: modelId, error: null })
    } else {
      set({ error: `Model ${modelId} is not available` })
    }
  },

  // Set error
  setError: (error: string | null) => {
    set({ error })
  },

  // Clear error
  clearError: () => {
    set({ error: null })
  },
}))
