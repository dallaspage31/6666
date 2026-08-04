'use client'

export function AppHeader() {
  return (
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
            ROBHEROES
          </span>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#game" className="text-gray-400 hover:text-gray-100 transition-colors">
              Game
            </a>
            <a href="#equipment" className="text-gray-400 hover:text-gray-100 transition-colors">
              Equipment
            </a>
            <a href="#crafting" className="text-gray-400 hover:text-gray-100 transition-colors">
              Crafting
            </a>
            <a href="#admin" className="text-gray-400 hover:text-gray-100 transition-colors">
              Admin
            </a>
          </nav>
        </div>
      </div>
    </header>
  )
}