/**
 * Progress Bar Component
 * Top loading bar for page navigation
 */

'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

export default function ProgressBar() {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Start loading
    setIsLoading(true)
    setProgress(0)

    // Simulate progress
    const timer1 = setTimeout(() => setProgress(30), 100)
    const timer2 = setTimeout(() => setProgress(60), 300)
    const timer3 = setTimeout(() => setProgress(90), 600)

    // Complete loading
    const timer4 = setTimeout(() => {
      setProgress(100)
      setTimeout(() => setIsLoading(false), 300)
    }, 800)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
    }
  }, [pathname])

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: progress / 100 }}
          exit={{ scaleX: 1, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="fixed left-0 top-0 z-[100] h-1 origin-left bg-gradient-to-r from-accent-500 to-accent-600"
          style={{ width: '100%' }}
        />
      )}
    </AnimatePresence>
  )
}
