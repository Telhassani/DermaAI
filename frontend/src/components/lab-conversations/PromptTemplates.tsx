'use client'

import { useMemo } from 'react'
import { usePromptTemplates } from '@/lib/stores/useConversationStore'
import { Button } from '@/components/ui/button'
import { Copy, Plus } from 'lucide-react'

interface PromptTemplatesProps {
  /**
   * Called when user selects a template
   * @param templateText The template text to insert
   */
  onSelectTemplate: (templateText: string) => void
  /**
   * Called when user clicks create new template button
   */
  onCreateNew?: () => void
  /**
   * Filter templates by category
   */
  category?: string
}

export function PromptTemplates({
  onSelectTemplate,
  onCreateNew,
  category,
}: PromptTemplatesProps) {
  const { promptTemplates, loadingTemplates } = usePromptTemplates()

  // Filter templates by category
  const filteredTemplates = useMemo(() => {
    return category
      ? promptTemplates.filter((t) => t.category === category && t.is_active)
      : promptTemplates.filter((t) => t.is_active)
  }, [promptTemplates, category])

  if (loadingTemplates) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-sm text-gray-500">Loading templates...</p>
      </div>
    )
  }

  if (filteredTemplates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-4">
        <p className="text-sm text-gray-500">No templates available</p>
        {onCreateNew && (
          <Button onClick={onCreateNew} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" /> Create First Template
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {filteredTemplates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelectTemplate(template.template_text)}
            className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors group"
            title={template.description || template.template_text}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">
                  {template.title}
                </p>
                {template.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                    {template.description}
                  </p>
                )}
                {template.category && (
                  <p className="text-xs text-gray-400 mt-2">
                    {template.category}
                  </p>
                )}
              </div>
              <Copy className="w-4 h-4 text-gray-400 group-hover:text-gray-600 flex-shrink-0 mt-0.5" />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
