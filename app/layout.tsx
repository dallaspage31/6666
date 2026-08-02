import Link from 'next/link'
import { ThemeProvider } from './providers'
import { ThemeToggle } from './components/theme-toggle'
import './globals.css'

export const metadata = {
  title: 'ROBHEROES',
  description: 'Robo Heroes Game',
}

const navItems = [
  { href: '/game', label: 'Game' },
  { href: '/admin', label: 'Admin' },
  { href: '/docs', label: 'Docs' },
]

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-gray-950 text-gray-100 font-sans antialiased">
        <ThemeProvider>
          <ThemeToggle />
          <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex h-16 items-center justify-between">
                <Link
                  href="/"
                  className="text-xl font-bold tracking-tight text-cyan-400"
                >
                  ROBHEROES
                </Link>
                <nav className="flex gap-6">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="text-sm font-medium text-gray-400 transition-colors hover:text-cyan-400"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </ThemeProvider>
      </body>
    </html>
  )
}