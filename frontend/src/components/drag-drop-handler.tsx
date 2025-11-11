'use client'

import { useEffect } from 'react'

export function DragDropHandler() {
  useEffect(() => {
    // Define all handlers with stable references
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      console.log('[DragDropHandler] Drag started')
    }

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
    }

    const handleDrop = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      console.log('[DragDropHandler] Drop detected, files:', e.dataTransfer?.files?.length)

      // Dispatch a custom event that the consultation component can listen to
      const customEvent = new CustomEvent('appFileDrop', {
        detail: { files: e.dataTransfer?.files },
        bubbles: true,
        cancelable: true,
      })
      document.dispatchEvent(customEvent)
      console.log('[DragDropHandler] Custom event dispatched')
    }

    // Add listeners
    document.addEventListener('dragenter', handleDragEnter)
    document.addEventListener('dragover', handleDragOver)
    document.addEventListener('dragleave', handleDragLeave)
    document.addEventListener('drop', handleDrop)

    return () => {
      document.removeEventListener('dragenter', handleDragEnter)
      document.removeEventListener('dragover', handleDragOver)
      document.removeEventListener('dragleave', handleDragLeave)
      document.removeEventListener('drop', handleDrop)
    }
  }, [])

  return null
}
