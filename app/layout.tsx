import type { Metadata } from 'next'
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
      <body>{children}</body>
    </html>
  )
}
