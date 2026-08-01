import type { Metadata } from 'next'
import { GameProvider } from '@/lib/hooks/useGame'
import './globals.css'

export const metadata: Metadata = {
  title: 'ROBHEROES',
  description: 'Robo Heroes Game',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <GameProvider>
          {children}
        </GameProvider>
      </body>
    </html>
  )
}
