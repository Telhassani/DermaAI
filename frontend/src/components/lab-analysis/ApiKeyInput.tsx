'use client';

import { useState } from 'react';
import { AIModel } from '@/types/ai-models';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, CheckCircle2, Info, Loader2, ExternalLink } from 'lucide-react';

interface ApiKeyInputProps {
  model: AIModel;
  onSubmit: () => void;
  onCancel: () => void;
}

const PROVIDER_URLS: Record<string, string> = {
  'Anthropic': 'https://console.anthropic.com/account/keys',
  'OpenAI': 'https://platform.openai.com/api-keys',
  'Google': 'https://console.cloud.google.com/apis/credentials',
  'Microsoft': 'https://huggingface.co/settings/tokens',
  'MIT-IBM': 'https://huggingface.co/settings/tokens',
  'DeepSeek': 'https://platform.deepseek.com/api',
};

const MODEL_KEY_NAMES: Record<string, string> = {
  'claude-3-5-sonnet': 'anthropic',
  'gpt-4-vision': 'openai',
  'gpt-5': 'openai',
  'medgemma': 'medgemma',
  'palm2': 'palm2',
  'biogpt': 'biogpt',
  'clinical-bert': 'clinical_bert',
  'deepseek-r1': 'deepseek',
};

export function ApiKeyInput({ model, onSubmit, onCancel }: ApiKeyInputProps) {
  const [apiKey, setApiKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const keyName = MODEL_KEY_NAMES[model.id] || model.provider.toLowerCase();
  const providerUrl = PROVIDER_URLS[model.provider] || '';

  const handleSubmit = async () => {
    if (!apiKey.trim()) {
      setError('Please enter an API key');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/lab-results/api-keys`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            [keyName]: apiKey,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to store API key');
      }

      // Clear sensitive data from memory immediately
      setApiKey('');
      setShowSuccess(true);

      // Wait for success message, then close
      setTimeout(() => {
        setShowSuccess(false);
        onSubmit();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to store API key');
      setApiKey('');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showSuccess) {
    return (
      <Card className="border-green-200 bg-green-50 mt-4">
        <CardContent className="pt-6 text-center py-8">
          <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-green-700">API Key Secured Successfully</p>
          <p className="text-xs text-gray-600 mt-1">
            {model.name} is now ready to use for analysis
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 bg-amber-50 mt-4">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Lock className="h-4 w-4 text-amber-600" />
          {model.name} API Key
        </CardTitle>
        <CardDescription>
          Securely provide your API key - encrypted and stored for this session only
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Security Info */}
        <Alert className="border-amber-200 bg-white">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-sm text-gray-700">
            <strong>Security:</strong> Your API key will be encrypted, stored securely for 1 hour,
            and never logged or permanently saved.
          </AlertDescription>
        </Alert>

        {/* API Key Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            {model.provider} API Key
          </label>
          <Input
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={isSubmitting}
            className="font-mono text-sm"
          />
          <p className="text-xs text-gray-600">
            Get your API key from{' '}
            <a
              href={providerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-700 hover:text-amber-900 font-medium underline inline-flex items-center gap-1"
            >
              {model.provider} Console
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            onClick={handleSubmit}
            disabled={!apiKey.trim() || isSubmitting}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Securing...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Submit Securely
              </>
            )}
          </Button>
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>

        {/* Info */}
        <p className="text-xs text-gray-600 bg-white px-3 py-2 rounded border border-gray-200">
          💡 <strong>Tip:</strong> You can obtain your {model.provider} API key from their
          console. It typically starts with "sk-" or similar.
        </p>
      </CardContent>
    </Card>
  );
}
