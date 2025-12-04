import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'
import { Providers } from '@/components/providers'
import { DragDropHandler } from '@/components/drag-drop-handler'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'DermAI - Cabinet Dermatologie',
  description: 'Application SAAS pour la gestion de cabinet dermatologique avec IA',
  keywords: ['dermatologie', 'SAAS', 'IA', 'cabinet médical'],
  authors: [{ name: 'DermAI Team' }],
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#ffffff',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <DragDropHandler />
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
