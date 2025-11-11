'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'
import { Toaster } from 'sonner'

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
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        richColors
        expand={true}
        closeButton
        duration={4000}
        toastOptions={{
          classNames: {
            toast: 'rounded-xl shadow-lg border',
            title: 'font-semibold',
            description: 'text-sm',
            actionButton: 'bg-blue-600 text-white hover:bg-blue-700 rounded-lg px-3 py-1.5',
            cancelButton: 'bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg px-3 py-1.5',
          },
        }}
      />
    </QueryClientProvider>
  )
}
