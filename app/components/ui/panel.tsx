import type { ReactNode } from 'react'

export function Panel({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`rounded-lg border border-gray-800 bg-gray-900 ${className}`}>{children}</div>
  )
}

export function InfoCard({
  title,
  description,
  className = 'p-6',
}: {
  title: string
  description: string
  className?: string
}) {
  return (
    <Panel className={className}>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-gray-400">{description}</p>
    </Panel>
  )
}

export function PageHeading({ title, description }: { title: string; description: string }) {
  return (
    <>
      <h1 className="text-3xl font-bold text-white">{title}</h1>
      <p className="mt-2 text-gray-400">{description}</p>
    </>
  )
}
