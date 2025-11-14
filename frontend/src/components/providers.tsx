'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/lib/theme'
import { ToastProvider } from '@/components/ui/modern'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            retry: 1,
          },
        },
      })
  )

  return (
    <ThemeProvider defaultTheme="system">
      <QueryClientProvider client={queryClient}>
        <ToastProvider position="bottom-right">
          {children}
          <Toaster position="top-right" richColors />
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
