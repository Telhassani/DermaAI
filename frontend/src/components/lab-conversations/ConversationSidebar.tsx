'use client'

import { Conversation } from '@/types/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  PlusIcon,
  Trash2,
  Archive,
  Pin,
  PinOff,
  Search,
  MessageSquare,
} from 'lucide-react'
import { format } from 'date-fns'

interface ConversationSidebarProps {
  conversations: Conversation[]
  selectedId?: number
  onSelect: (id: number) => void
  onCreate: () => void
  onDelete: (id: number) => void
  onPin: (id: number, isPinned: boolean) => void
  onArchive: (id: number, isArchived: boolean) => void
  isLoading?: boolean
  searchQuery?: string
  onSearchChange?: (query: string) => void
}

export function ConversationSidebar({
  conversations,
  selectedId,
  onSelect,
  onCreate,
  onDelete,
  onPin,
  onArchive,
  isLoading,
  searchQuery = '',
  onSearchChange,
}: ConversationSidebarProps) {
  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      c.title.toLowerCase().includes(query) ||
      (c.description?.toLowerCase().includes(query) ?? false)
    )
  })

  const pinnedConversations = filteredConversations.filter((c) => c.is_pinned && !c.is_archived)
  const regularConversations = filteredConversations.filter((c) => !c.is_pinned && !c.is_archived)
  const archivedConversations = filteredConversations.filter((c) => c.is_archived)

  return (
    <div className="w-64 border-r flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Conversations</h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={onCreate}
            disabled={isLoading}
            title="New conversation"
          >
            <PlusIcon className="w-4 h-4" />
          </Button>
        </div>

        {/* Search */}
        {onSearchChange && (
          <div className="relative">
            <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        )}
      </div>

      {/* Conversations list */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* Pinned section */}
          {pinnedConversations.length > 0 && (
            <>
              <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Pinned
              </div>
              <div className="space-y-1">
                {pinnedConversations.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isSelected={selectedId === conv.id}
                    onSelect={onSelect}
                    onDelete={onDelete}
                    onPin={onPin}
                    onArchive={onArchive}
                    isLoading={isLoading}
                  />
                ))}
              </div>
            </>
          )}

          {/* Regular section */}
          {regularConversations.length > 0 && (
            <>
              {pinnedConversations.length > 0 && <div className="h-px bg-gray-200 my-2" />}
              {pinnedConversations.length === 0 && (
                <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Recent
                </div>
              )}
              <div className="space-y-1">
                {regularConversations.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isSelected={selectedId === conv.id}
                    onSelect={onSelect}
                    onDelete={onDelete}
                    onPin={onPin}
                    onArchive={onArchive}
                    isLoading={isLoading}
                  />
                ))}
              </div>
            </>
          )}

          {/* Archived section */}
          {archivedConversations.length > 0 && (
            <>
              <div className="h-px bg-gray-200 my-2" />
              <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Archived
              </div>
              <div className="space-y-1">
                {archivedConversations.map((conv) => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isSelected={selectedId === conv.id}
                    onSelect={onSelect}
                    onDelete={onDelete}
                    onPin={onPin}
                    onArchive={onArchive}
                    isLoading={isLoading}
                  />
                ))}
              </div>
            </>
          )}

          {/* Empty state */}
          {filteredConversations.length === 0 && (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>
                {searchQuery ? 'No conversations match your search' : 'No conversations yet'}
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

interface ConversationItemProps {
  conversation: Conversation
  isSelected: boolean
  onSelect: (id: number) => void
  onDelete: (id: number) => void
  onPin: (id: number, isPinned: boolean) => void
  onArchive: (id: number, isArchived: boolean) => void
  isLoading?: boolean
}

function ConversationItem({
  conversation,
  isSelected,
  onSelect,
  onDelete,
  onPin,
  onArchive,
  isLoading,
}: ConversationItemProps) {
  return (
    <div
      className={cn(
        'px-2 py-2 rounded-md cursor-pointer transition-colors group relative',
        isSelected ? 'bg-blue-100' : 'hover:bg-gray-100'
      )}
      onClick={() => onSelect(conversation.id)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate text-gray-900">{conversation.title}</p>
          <p className="text-xs text-gray-500 truncate">
            {conversation.message_count} messages
          </p>
          {conversation.last_message_at && (
            <p className="text-xs text-gray-400">
              {format(new Date(conversation.last_message_at), 'MMM d, HH:mm')}
            </p>
          )}
        </div>

        {/* Action buttons - show on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onPin(conversation.id, !conversation.is_pinned)
            }}
            disabled={isLoading}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title={conversation.is_pinned ? 'Unpin' : 'Pin'}
          >
            {conversation.is_pinned ? (
              <PinOff className="w-3 h-3 text-gray-600" />
            ) : (
              <Pin className="w-3 h-3 text-gray-400" />
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              onArchive(conversation.id, !conversation.is_archived)
            }}
            disabled={isLoading}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title={conversation.is_archived ? 'Unarchive' : 'Archive'}
          >
            <Archive className="w-3 h-3 text-gray-400" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              if (confirm('Delete this conversation? This action cannot be undone.')) {
                onDelete(conversation.id)
              }
            }}
            disabled={isLoading}
            className="p-1 hover:bg-red-100 rounded transition-colors"
            title="Delete"
          >
            <Trash2 className="w-3 h-3 text-red-500" />
          </button>
        </div>
      </div>
    </div>
  )
}
