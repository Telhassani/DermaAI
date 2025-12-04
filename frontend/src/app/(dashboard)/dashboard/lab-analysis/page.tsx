'use client'

import { LabChatPage } from '@/components/lab-conversations/LabChatPage'

const availableModels = [
  'claude-3.5-sonnet',
  'gpt-4o',
  'gpt-4-turbo',
]

export default function LabAnalysisPage() {
  return (
    <div className="flex flex-col gap-4">
      <LabChatPage availableModels={availableModels} />
    </div>
  )
}
