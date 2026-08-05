'use client'

import { ReactNode } from 'react'
import { AppHeader } from './app-header'

interface AppShellProps {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-gray-950 text-gray-100">
      <AppHeader />
      <main className="container mx-auto flex-1 px-4 py-6">{children}</main>
      <footer className="border-t border-gray-800 py-4 text-center text-sm text-gray-500">
        ROBHEROES &copy; 2026
      </footer>
    </div>
  )
}
