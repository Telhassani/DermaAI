'use client'

import { LabChatPage } from '@/components/lab-conversations/LabChatPage'

const availableModels = [
  'claude-3.5-sonnet',
  'gpt-4o',
  'gpt-4-turbo',
]

export default function LabAnalysisPage() {
  return (
    <div className="h-screen flex flex-col">
      <LabChatPage availableModels={availableModels} />
    </div>
  )
}
