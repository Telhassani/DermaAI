'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles, Loader2, Copy, FileText, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { api } from '@/lib/api/client'
import { cn } from '@/lib/utils/cn'

interface AIAnalysisModalProps {
  imageId: number
  imageUrl: string
  patientId: number
  patientName: string
  isOpen: boolean
  onClose: () => void
}

export function AIAnalysisModal({
  imageId,
  imageUrl,
  patientName,
  isOpen,
  onClose,
}: AIAnalysisModalProps) {
  const [selectedModel, setSelectedModel] = useState('claude-sonnet-4-5-20250929')  // Claude Sonnet 4.5
  const [userPrompt, setUserPrompt] = useState('')
  const [analysisResult, setAnalysisResult] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setUserPrompt('')
      setAnalysisResult(null)
      setError(null)
      setSelectedModel('claude-3-5-sonnet-20241022')
    }
  }, [isOpen])

  const handleAnalyze = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await api.images.aiAnalyze(
        imageId,
        selectedModel,
        userPrompt || undefined
      )

      setAnalysisResult(response.data.analysis_text)
    } catch (err) {
      console.error('Error analyzing image:', err)
      const error = err as { response?: { data?: { detail?: string } } }
      setError(error.response?.data?.detail || 'Failed to analyze image')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyText = () => {
    if (analysisResult) {
      navigator.clipboard.writeText(analysisResult)
      // You could add a toast notification here
    }
  }

  const handleAddToNotes = () => {
    // This would integrate with the consultation notes system
    // For now, just copy to clipboard
    handleCopyText()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-xl bg-white shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">AI Image Analysis</h2>
              <p className="mt-1 text-sm text-gray-600">{patientName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Image Preview */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <img
              src={imageUrl}
              alt="Preview"
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1">
              <p className="text-xs text-gray-500">Image to analyze</p>
              <p className="text-sm font-medium text-gray-900">Patient: {patientName}</p>
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              AI Model Selection
            </label>
            <div className="space-y-2">
              <label className={cn(
                "flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                selectedModel === 'claude-3-5-sonnet-20241022'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              )}>
                <input
                  type="radio"
                  name="model"
                  value="claude-3-5-sonnet-20241022"
                  checked={selectedModel === 'claude-3-5-sonnet-20241022'}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={loading}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Claude 3.5 Sonnet</p>
                  <p className="text-xs text-gray-500">Fast and accurate analysis</p>
                </div>
              </label>

              <label className={cn(
                "flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all",
                selectedModel === 'claude-opus-4-5-20251101'
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              )}>
                <input
                  type="radio"
                  name="model"
                  value="claude-opus-4-5-20251101"
                  checked={selectedModel === 'claude-opus-4-5-20251101'}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  disabled={loading}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Claude Opus 4.5</p>
                  <p className="text-xs text-gray-500">Most accurate and detailed analysis</p>
                </div>
              </label>
            </div>
          </div>

          {/* Custom Prompt */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Additional Instructions (Optional)
            </label>
            <Textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              disabled={loading}
              placeholder="Add specific questions or areas of focus for the AI analysis..."
              className="min-h-[100px]"
            />
            <p className="mt-2 text-xs text-gray-500">
              Example: &quot;Focus on pigmentation patterns&quot; or &quot;Check for signs of melanoma&quot;
            </p>
          </div>

          {/* Analyze Button */}
          {!analysisResult && (
            <Button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Analyze with AI
                </>
              )}
            </Button>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Analysis Result */}
          {analysisResult && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Analysis Result</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyText}
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddToNotes}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Add to Notes
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="prose prose-sm max-w-none">
                  <div className="text-sm text-gray-900 whitespace-pre-wrap">
                    {analysisResult}
                  </div>
                </div>
              </div>

              <Button
                onClick={() => {
                  setAnalysisResult(null)
                  setUserPrompt('')
                  setError(null)
                }}
                variant="outline"
                className="w-full"
              >
                Analyze Again
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 p-6">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={loading}
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
