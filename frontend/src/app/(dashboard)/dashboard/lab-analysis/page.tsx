'use client'

import { LabChatPage } from '@/components/lab-conversations/LabChatPage'

const availableModels = [
  'claude-sonnet-4-5-20250929',
  'claude-haiku-4-5-20251001',
  'claude-opus-4-5-20251101',
  'claude-3-5-haiku-20241022',
  'claude-3-7-sonnet-20250219',
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
