'use client'

import Link from 'next/link'

import { PageHeading } from '../components/ui/panel'

const docs = [
  {
    title: 'Installation',
    description: 'Setup the development environment and run the project locally.',
    href: '/docs/installation',
  },
  {
    title: 'API Reference',
    description: 'Player auth, heartbeat, session, and admin endpoints.',
    href: '/docs/api',
  },
  {
    title: 'Game Mechanics',
    description: 'Combat, items, pets, runes, and progression systems.',
    href: '/docs/game-mechanics',
  },
]

export default function DocsPage() {
  return (
    <div>
      <PageHeading title="Documentation" description="Guides and reference material for ROBHEROES." />
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {docs.map((doc) => (
          <Link
            key={doc.href}
            href={doc.href}
            className="group rounded-lg border border-gray-800 bg-gray-900 p-6 transition-colors hover:border-cyan-500/50"
          >
            <h2 className="text-lg font-semibold text-white group-hover:text-cyan-400">
              {doc.title}
            </h2>
            <p className="mt-2 text-sm text-gray-400">{doc.description}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
