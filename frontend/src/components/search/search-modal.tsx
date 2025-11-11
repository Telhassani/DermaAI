'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, User, FileText, Calendar, Clock, TrendingUp, X } from 'lucide-react'
import { useKeyboardShortcut, isMacOS } from '@/lib/hooks/use-keyboard-shortcut'
import { searchAll, SearchResult, SearchCategory } from '@/lib/utils/search'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isSearching, setIsSearching] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recent-searches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  // Save search to history
  const saveSearch = useCallback((search: string) => {
    if (!search.trim()) return
    const updated = [search, ...recentSearches.filter((s) => s !== search)].slice(0, 5)
    setRecentSearches(updated)
    localStorage.setItem('recent-searches', JSON.stringify(updated))
  }, [recentSearches])

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([])
    localStorage.removeItem('recent-searches')
  }, [])

  // Perform search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setSelectedIndex(0)
      return
    }

    setIsSearching(true)

    const timeoutId = setTimeout(async () => {
      try {
        const searchResults = await searchAll(query)
        setResults(searchResults)
        setSelectedIndex(0)
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setIsSearching(false)
      }
    }, 300) // Debounce 300ms

    return () => clearTimeout(timeoutId)
  }, [query])

  // Handle result selection
  const handleSelect = useCallback((result: SearchResult) => {
    saveSearch(query)
    onClose()
    router.push(result.url)
  }, [query, saveSearch, onClose, router])

  // Keyboard navigation
  useKeyboardShortcut({ key: 'Escape' }, onClose, isOpen)

  useKeyboardShortcut(
    { key: 'ArrowDown' },
    () => setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1)),
    isOpen && results.length > 0
  )

  useKeyboardShortcut(
    { key: 'ArrowUp' },
    () => setSelectedIndex((prev) => Math.max(prev - 1, 0)),
    isOpen && results.length > 0
  )

  useKeyboardShortcut(
    { key: 'Enter' },
    () => {
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex])
      }
    },
    isOpen && results.length > 0
  )

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Group results by category
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = []
    }
    acc[result.category].push(result)
    return acc
  }, {} as Record<SearchCategory, SearchResult[]>)

  const categoryIcons: Record<SearchCategory, React.ReactNode> = {
    patients: <User className="h-4 w-4" />,
    consultations: <FileText className="h-4 w-4" />,
    appointments: <Calendar className="h-4 w-4" />,
  }

  const categoryLabels: Record<SearchCategory, string> = {
    patients: 'Patients',
    consultations: 'Consultations',
    appointments: 'Rendez-vous',
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl animate-in zoom-in-95 slide-in-from-top-4 duration-200">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200">
            <Search className="h-5 w-5 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher patients, consultations..."
              className="flex-1 text-base outline-none bg-transparent placeholder:text-slate-400"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="p-1 hover:bg-slate-100 rounded-md transition-colors"
              >
                <X className="h-4 w-4 text-slate-400" />
              </button>
            )}
            <kbd className="hidden sm:inline-block px-2 py-1 text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[60vh] overflow-y-auto">
            {isSearching ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-r-transparent" />
              </div>
            ) : query && results.length === 0 ? (
              <div className="text-center py-12">
                <Search className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <p className="text-sm text-slate-500">Aucun résultat pour "{query}"</p>
              </div>
            ) : query && results.length > 0 ? (
              <div className="py-2">
                {Object.entries(groupedResults).map(([category, categoryResults]) => (
                  <div key={category} className="mb-4 last:mb-0">
                    <div className="px-4 py-2 flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {categoryIcons[category as SearchCategory]}
                      {categoryLabels[category as SearchCategory]}
                    </div>
                    {categoryResults.map((result, index) => {
                      const globalIndex = results.indexOf(result)
                      const isSelected = globalIndex === selectedIndex

                      return (
                        <button
                          key={result.id}
                          onClick={() => handleSelect(result)}
                          className={`w-full px-4 py-3 flex items-start gap-3 text-left transition-colors ${
                            isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className={`mt-0.5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}>
                            {categoryIcons[result.category]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-slate-900 truncate">
                              {result.title}
                            </div>
                            {result.subtitle && (
                              <div className="text-sm text-slate-500 truncate">
                                {result.subtitle}
                              </div>
                            )}
                            {result.metadata && (
                              <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                                {result.metadata.map((meta, i) => (
                                  <span key={i} className="flex items-center gap-1">
                                    {meta}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          {isSelected && (
                            <kbd className="px-2 py-1 text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded">
                              ↵
                            </kbd>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            ) : (
              // Recent searches
              recentSearches.length > 0 && (
                <div className="py-2">
                  <div className="px-4 py-2 flex items-center justify-between">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Recherches récentes
                    </div>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-slate-500 hover:text-slate-700"
                    >
                      Effacer
                    </button>
                  </div>
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => setQuery(search)}
                      className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-slate-50 transition-colors"
                    >
                      <Clock className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-700">{search}</span>
                    </button>
                  ))}
                </div>
              )
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded">↓</kbd>
                naviguer
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded">↵</kbd>
                sélectionner
              </span>
            </div>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded">ESC</kbd>
              fermer
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
