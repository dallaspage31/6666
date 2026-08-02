'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

interface ThemeProviderState {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeProviderState | undefined>(undefined)

const THEME_STORAGE_KEY = 'robheroes-theme'

function readStoredTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : null
  } catch (error) {
    console.warn('Could not read the stored theme, falling back to system preference', error)
    return null
  }
}

function storeTheme(theme: Theme) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch (error) {
    console.warn('Could not persist the selected theme', error)
  }
}

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const stored = readStoredTheme()
  if (stored) return stored
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'dark') {
    root.classList.add('dark')
    root.classList.remove('light')
  } else {
    root.classList.remove('dark')
    root.classList.add('light')
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    const handler = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'light' : 'dark')
    }
    const mql = window.matchMedia('(prefers-color-scheme: light)')
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      storeTheme(next)
      return next
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeProviderState {
  const ctx = useContext(ThemeContext)
  if (ctx === undefined) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return ctx
}