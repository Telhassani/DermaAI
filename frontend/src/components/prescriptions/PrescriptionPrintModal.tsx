/**
 * Prescription Print Modal
 * Preview and print prescription with options
 */

'use client'

import React, { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Printer, Download, X, FileText, Eye, Maximize2 } from 'lucide-react'
import { cn } from '@/lib/theme'
import { Button } from '@/components/ui/modern'
import PrescriptionTemplate, { type PrescriptionData } from './PrescriptionTemplate'

interface PrescriptionPrintModalProps {
  isOpen: boolean
  onClose: () => void
  prescriptionData: PrescriptionData
}

export default function PrescriptionPrintModal({
  isOpen,
  onClose,
  prescriptionData,
}: PrescriptionPrintModalProps) {
  const printRef = useRef<HTMLDivElement>(null)
  const [isPrinting, setIsPrinting] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Handle print
  const handlePrint = async () => {
    setIsPrinting(true)

    try {
      // Wait for any images/fonts to load
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Use browser print
      window.print()
    } catch (error) {
      console.error('Print error:', error)
    } finally {
      setIsPrinting(false)
    }
  }

  // Handle PDF export
  const handleExportPDF = async () => {
    setIsPrinting(true)

    try {
      // Dynamic import for client-side only
      const html2pdf = (await import('html2pdf.js')).default

      const element = printRef.current
      if (!element) return

      const opt = {
        margin: 0,
        filename: `ordonnance-${prescriptionData.prescription_number}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          letterRendering: true,
        },
        jsPDF: {
          unit: 'mm',
          format: 'a5',
          orientation: 'portrait',
        },
      }

      await html2pdf().set(opt).from(element).save()
    } catch (error) {
      console.error('PDF export error:', error)
      alert('Erreur lors de l\'export PDF. Utilisez l\'impression navigateur.')
    } finally {
      setIsPrinting(false)
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-mono-900/50 backdrop-blur-sm"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            'relative w-full rounded-3xl border border-mono-200 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.2)]',
            'dark:border-mono-800 dark:bg-mono-900',
            isFullscreen ? 'max-w-7xl' : 'max-w-5xl'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-mono-200 px-6 py-4 dark:border-mono-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-accent-600">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-mono-900 dark:text-mono-100">
                  Prévisualisation Ordonnance
                </h2>
                <p className="text-sm text-mono-600 dark:text-mono-400">
                  #{prescriptionData.prescription_number}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Fullscreen toggle */}
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className={cn(
                  'rounded-xl p-2 transition-colors',
                  'hover:bg-mono-100 dark:hover:bg-mono-800'
                )}
                title={isFullscreen ? 'Réduire' : 'Plein écran'}
              >
                <Maximize2 className="h-5 w-5 text-mono-600 dark:text-mono-400" />
              </button>

              {/* Close button */}
              <button
                onClick={onClose}
                className={cn(
                  'rounded-xl p-2 transition-colors',
                  'hover:bg-mono-100 dark:hover:bg-mono-800'
                )}
              >
                <X className="h-5 w-5 text-mono-600 dark:text-mono-400" />
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="max-h-[70vh] overflow-auto bg-mono-100 p-8 dark:bg-mono-950">
            <div className="mx-auto" style={{ width: '148mm' }}>
              <PrescriptionTemplate ref={printRef} data={prescriptionData} />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-4 border-t border-mono-200 px-6 py-4 dark:border-mono-800">
            <div className="flex items-center gap-2 text-sm text-mono-600 dark:text-mono-400">
              <Eye className="h-4 w-4" />
              <span>Format A5 (148 × 210 mm)</span>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="md"
                leftIcon={<Download className="h-5 w-5" />}
                onClick={handleExportPDF}
                loading={isPrinting}
                disabled={isPrinting}
              >
                Exporter PDF
              </Button>

              <Button
                variant="primary"
                size="md"
                leftIcon={<Printer className="h-5 w-5" />}
                onClick={handlePrint}
                loading={isPrinting}
                disabled={isPrinting}
              >
                Imprimer
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Print styles - Hidden print template */}
      <div className="hidden print:block">
        <PrescriptionTemplate data={prescriptionData} />
      </div>
    </>
  )
}
