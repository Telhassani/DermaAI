'use client';

import { AIModel } from '@/types/ai-models';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModelCardProps {
  model: AIModel;
  selected: boolean;
  onClick: () => void;
}

export function ModelCard({ model, selected, onClick }: ModelCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative p-4 rounded-lg border-2 text-left transition-all w-full',
        'hover:border-violet-400 hover:shadow-md',
        selected
          ? 'border-violet-600 bg-violet-50 shadow-lg'
          : 'border-gray-200 bg-white'
      )}
    >
      {/* Status Badge */}
      <div className="absolute top-2 right-2">
        {model.status === 'available' ? (
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        ) : (
          <AlertCircle className="h-5 w-5 text-amber-500" />
        )}
      </div>

      {/* Model Info */}
      <div className="space-y-2 pr-8">
        <h3 className="font-semibold text-gray-900">{model.name}</h3>
        <p className="text-xs text-gray-600">{model.provider}</p>

        {/* Capability Badges */}
        <div className="flex gap-2 flex-wrap">
          {model.has_vision && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              <Eye className="h-3 w-3 mr-1" />
              Vision
            </Badge>
          )}
          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
            Medical AI
          </Badge>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-700 mt-2">{model.description}</p>

        {/* Recommended For */}
        {model.recommended_for && model.recommended_for.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-600 mb-1">Best for:</p>
            <div className="flex flex-wrap gap-1">
              {model.recommended_for.map((use) => (
                <span
                  key={use}
                  className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-700"
                >
                  {use}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Status Text */}
        {model.status === 'requires_api_key' && (
          <div className="mt-2 text-xs text-amber-700 bg-amber-50 px-2 py-1 rounded">
            Requires API key configuration
          </div>
        )}
      </div>
    </button>
  );
}
