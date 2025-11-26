'use client'

import { LabChatPage } from '@/components/lab-conversations/LabChatPage'

const availableModels = [
  'claude-3.5-sonnet',
  'gpt-4o',
  'gpt-4-turbo',
]

export default function LabConversationsPage() {
  return (
    <div className="h-screen">
      <LabChatPage availableModels={availableModels} />
    </div>
  )
}
