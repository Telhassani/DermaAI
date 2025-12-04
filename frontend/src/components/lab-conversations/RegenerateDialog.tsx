'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Zap } from 'lucide-react'

interface RegenerateDialogProps {
  /**
   * Whether dialog is open
   */
  isOpen: boolean
  /**
   * Called when dialog state changes
   */
  onOpenChange: (open: boolean) => void
  /**
   * Available AI models to choose from
   */
  availableModels?: string[]
  /**
   * Default model name
   */
  defaultModel?: string
  /**
   * Called when user submits regeneration request
   */
  onRegenerate: (options: {
    temperature?: number
    model?: string
    maxTokens?: number
    reason?: string
  }) => Promise<void>
}

export function RegenerateDialog({
  isOpen,
  onOpenChange,
  availableModels = [],
  defaultModel,
  onRegenerate,
}: RegenerateDialogProps) {
  const [temperature, setTemperature] = useState(0.7)
  const [selectedModel, setSelectedModel] = useState(defaultModel || '')
  const [maxTokens, setMaxTokens] = useState('2000')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const handleRegenerate = async () => {
    setLoading(true)
    try {
      await onRegenerate({
        temperature: temperature !== 0.7 ? temperature : undefined,
        model: selectedModel || undefined,
        maxTokens: maxTokens ? parseInt(maxTokens) : undefined,
        reason: reason || undefined,
      })
      // Reset form on success
      setTemperature(0.7)
      setSelectedModel(defaultModel || '')
      setMaxTokens('2000')
      setReason('')
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            Regenerate Response
          </DialogTitle>
          <DialogDescription>
            Generate a new version of this AI response with different settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Temperature slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature">Temperature (Creativity)</Label>
              <span className="text-sm text-gray-500">{temperature.toFixed(2)}</span>
            </div>
            <Slider
              id="temperature"
              min={0}
              max={2}
              step={0.1}
              value={[temperature]}
              onValueChange={(value) => setTemperature(value[0])}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Lower = more focused, Higher = more creative
            </p>
          </div>

          {/* Model selector */}
          {availableModels.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="model">AI Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger id="model">
                  <SelectValue placeholder="Use conversation default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Use conversation default</SelectItem>
                  {availableModels.map((model) => (
                    <SelectItem key={model} value={model}>
                      {model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Max tokens input */}
          <div className="space-y-2">
            <Label htmlFor="max-tokens">Maximum Tokens (Response Length)</Label>
            <Input
              id="max-tokens"
              type="number"
              min="100"
              max="4000"
              value={maxTokens}
              onChange={(e) => setMaxTokens(e.target.value)}
              placeholder="2000"
            />
            <p className="text-xs text-gray-500">Higher = longer responses</p>
          </div>

          {/* Reason textarea */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Regeneration (optional)</Label>
            <Input
              id="reason"
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., 'Too verbose', 'Different perspective'"
              className="h-20 resize-none"
            />
            <p className="text-xs text-gray-500">This helps track why you regenerated</p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleRegenerate} disabled={loading}>
            {loading ? 'Regenerating...' : 'Regenerate'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
