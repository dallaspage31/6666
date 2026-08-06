export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-xl font-bold text-transparent">
            ROBHEROES
          </span>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <a
              href="#game"
              className="text-gray-400 transition-colors hover:text-gray-100"
            >
              Game
            </a>
            <a
              href="#equipment"
              className="text-gray-400 transition-colors hover:text-gray-100"
            >
              Equipment
            </a>
            <a
              href="#crafting"
              className="text-gray-400 transition-colors hover:text-gray-100"
            >
              Crafting
            </a>
            <a
              href="#admin"
              className="text-gray-400 transition-colors hover:text-gray-100"
            >
              Admin
            </a>
          </nav>
        </div>
      </div>
    </header>
  );
}
