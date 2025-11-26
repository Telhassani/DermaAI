'use client';

import { useState, useEffect } from 'react';
import { AIModel } from '@/types/ai-models';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Info } from 'lucide-react';
import { ModelCard } from './ModelCard';
import { ApiKeyInput } from './ApiKeyInput';
import { Brain } from 'lucide-react';
import { api } from '@/lib/api/client';

interface ModelConfigurationProps {
  onModelChange: (model: AIModel) => void;
  onApiKeysSubmit?: () => void;
}

export function ModelConfiguration({ onModelChange, onApiKeysSubmit }: ModelConfigurationProps) {
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        const response = await api.labResults.getAvailableModels();
        const data = response.data;
        setModels(data.models);

        // Default to first available model
        if (data.models.length > 0) {
          const defaultModel = data.models[0];
          setSelectedModel(defaultModel);
          onModelChange(defaultModel);
        }
      } catch (err: any) {
        const errorMessage = err.response?.data?.detail ||
          (err instanceof Error ? err.message : 'Failed to load models');
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  const handleModelSelect = (model: AIModel) => {
    setSelectedModel(model);
    onModelChange(model);
  };

  const selectedModelNeedsKey = selectedModel?.status === 'requires_api_key';

  if (loading) {
    return (
      <Card className="border-violet-200 bg-gradient-to-r from-violet-50 to-blue-50">
        <CardContent className="pt-6 flex items-center justify-center h-32">
          <Loader2 className="h-6 w-6 animate-spin text-violet-600" />
          <span className="ml-2 text-gray-600">Loading available models...</span>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <Card className="border-violet-200 bg-gradient-to-r from-violet-50 to-blue-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="h-5 w-5 text-violet-600" />
                AI Model Selection
              </CardTitle>
              <CardDescription className="mt-1">
                Choose the AI model for analyzing lab results
              </CardDescription>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              Step 1
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Model Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {models.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                selected={selectedModel?.id === model.id}
                onClick={() => handleModelSelect(model)}
              />
            ))}
          </div>

          {/* Selected Model Details */}
          {selectedModel && (
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm">
                <strong>Selected:</strong> {selectedModel.name} ({selectedModel.provider})
                {selectedModel.has_vision && ' • Supports image analysis'}
                {selectedModel.status === 'requires_api_key' && ' • Requires API key'}
              </AlertDescription>
            </Alert>
          )}

          {/* API Key Input Section */}
          {selectedModelNeedsKey && !showApiKeyInput && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700">
              <p className="font-medium mb-2">API Key Required</p>
              <p className="text-xs mb-3">
                This model requires an API key. Click below to configure it securely.
              </p>
              <button
                onClick={() => setShowApiKeyInput(true)}
                className="text-amber-700 hover:text-amber-900 font-medium underline"
              >
                Configure API Key →
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* API Key Input Modal */}
      {showApiKeyInput && selectedModel && (
        <ApiKeyInput
          model={selectedModel}
          onSubmit={() => {
            setShowApiKeyInput(false);
            onApiKeysSubmit?.();
          }}
          onCancel={() => setShowApiKeyInput(false)}
        />
      )}
    </>
  );
}
