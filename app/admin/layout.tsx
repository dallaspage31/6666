import Link from 'next/link'

const NAV_LINKS = [
  { href: '/admin', label: 'Dashboard', active: true },
  { href: '/admin/players', label: 'Players', active: false },
  { href: '/admin/game-settings', label: 'Game Settings', active: false },
  { href: '/admin/items', label: 'Items', active: false },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      <aside className="lg:col-span-1">
        <nav className="space-y-1 rounded-lg border border-gray-800 bg-gray-900 p-4">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Admin
          </h2>
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                link.active
                  ? 'text-cyan-400 bg-gray-800'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="lg:col-span-3">{children}</div>
    </div>
  )
}
