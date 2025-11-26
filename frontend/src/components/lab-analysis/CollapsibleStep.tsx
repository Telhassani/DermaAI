'use client';

import { ReactNode } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleStepProps {
  step: number;
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  summary?: string;
  onEdit?: () => void;
  children: ReactNode;
}

export function CollapsibleStep({
  step,
  title,
  isExpanded,
  onToggle,
  summary,
  onEdit,
  children,
}: CollapsibleStepProps) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Header - Always visible */}
      <div
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3 flex-1 text-left">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold',
            isExpanded ? 'bg-blue-600' : 'bg-green-600'
          )}>
            {isExpanded ? step : <Check className="w-4 h-4" />}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            {!isExpanded && summary && (
              <p className="text-sm text-gray-600 mt-1">{summary}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isExpanded && onEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
            >
              Edit
            </button>
          )}
          <ChevronDown
            className={cn(
              'w-5 h-5 text-gray-400 transition-transform',
              isExpanded ? 'rotate-0' : '-rotate-90'
            )}
          />
        </div>
      </div>

      {/* Content - Only visible when expanded */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}
