'use client'

import { useEffect } from 'react'
import { useAIStreamStore, type AIStreamModel } from '@/lib/stores/ai-stream-store'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Zap, Brain } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'

interface ModelSelectorProps {
  label?: string
  description?: string
  disabled?: boolean
  onModelChange?: (modelId: string) => void
  showMetadata?: boolean
}

export function ModelSelector({
  label = 'AI Model',
  description = 'Select which AI model to use for analysis',
  disabled = false,
  onModelChange,
  showMetadata = true,
}: ModelSelectorProps) {
  const {
    selectedModel,
    availableModels,
    isLoadingModels,
    error,
    fetchAvailableModels,
    selectModel,
    clearError,
  } = useAIStreamStore()

  // Fetch available models on mount
  useEffect(() => {
    if (availableModels.length === 0) {
      fetchAvailableModels()
    }
  }, [])

  // Handle model selection
  const handleModelChange = (modelId: string) => {
    selectModel(modelId)
    onModelChange?.(modelId)
  }

  // Get metadata for selected model
  const selectedModelData = availableModels.find((m) => m.id === selectedModel)

  // Get provider badge color
  const getProviderColor = (provider: 'anthropic' | 'openai') => {
    return provider === 'anthropic'
      ? 'bg-purple-100 text-purple-800'
      : 'bg-blue-100 text-blue-800'
  }

  return (
    <div className="space-y-4">
      {/* Label and description */}
      <div className="space-y-2">
        <Label htmlFor="model-select" className="text-base font-semibold">
          {label}
        </Label>
        {description && (
          <p className="text-sm text-gray-600">
            {description}
          </p>
        )}
      </div>

      {/* Error alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            {error}
            <button
              onClick={clearError}
              className="ml-2 underline text-sm hover:no-underline"
            >
              Dismiss
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* Loading state */}
      {isLoadingModels && (
        <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-full border-2 border-gray-300 border-t-gray-900 animate-spin" />
            <span className="text-sm text-gray-600">Chargement des modèles disponibles...</span>
          </div>
        </div>
      )}

      {/* Model selector */}
      {!isLoadingModels && availableModels.length > 0 && (
        <>
          <Select value={selectedModel || ''} onValueChange={handleModelChange} disabled={disabled}>
            <SelectTrigger
              id="model-select"
              className={cn(
                'h-auto py-3',
                selectedModelData && 'border-purple-200 bg-purple-50'
              )}
            >
              <SelectValue placeholder="Select a model..." />
            </SelectTrigger>
            <SelectContent>
              {availableModels.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex items-center gap-2">
                    {model.provider === 'anthropic' ? (
                      <Brain className="h-4 w-4 text-purple-600" />
                    ) : (
                      <Zap className="h-4 w-4 text-blue-600" />
                    )}
                    <span className="font-medium">{model.name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Selected model metadata */}
          {showMetadata && selectedModelData && (
            <div className="rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-transparent p-4 space-y-3">
              {/* Model info */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{selectedModelData.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedModelData.description}
                  </p>
                </div>
                <Badge className={getProviderColor(selectedModelData.provider)}>
                  {selectedModelData.provider === 'anthropic' ? 'Anthropic' : 'OpenAI'}
                </Badge>
              </div>

              {/* Capabilities */}
              {selectedModelData.capabilities && selectedModelData.capabilities.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Capabilities
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedModelData.capabilities.map((capability) => (
                      <Badge key={capability} variant="outline" className="bg-white">
                        {capability}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* No models available */}
      {!isLoadingModels && availableModels.length === 0 && !error && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="ml-2">
            Aucun modèle IA disponible. Veuillez vérifier la configuration des clés API.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
