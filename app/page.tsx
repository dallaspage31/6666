import Link from 'next/link'

export const metadata = {
  title: 'ROBHEROES - Robo Heroes Game',
  description: 'Play Robo Heroes and battle in automated PvP combat',
}

export default function Page() {
  return (
    <div className="space-y-16">
      <section className="relative py-20 text-center">
        <div className="mx-auto max-w-4xl px-4">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              ROBHEROES
            </span>
          </h1>
          <p className="mt-6 text-lg text-gray-400 sm:text-xl">
            Automated PvP combat. Collect heroes, equip gear, and climb the
            rankings.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/game"
              className="inline-flex items-center justify-center rounded-lg bg-cyan-500 px-8 py-3 text-sm font-semibold text-gray-950 transition-colors hover:bg-cyan-400"
            >
              Play Now
            </Link>
            <Link
              href="/docs"
              className="inline-flex items-center justify-center rounded-lg border border-gray-700 px-8 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-8 transition-colors hover:border-gray-700">
            <div className="text-3xl mb-4">⚔️</div>
            <h2 className="text-xl font-bold text-white">Auto Battle</h2>
            <p className="mt-3 text-sm text-gray-400">
              Set your strategy and watch your heroes fight in automated PvP
              rounds. Earn rewards based on your battle performance.
            </p>
          </div>
          <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-8 transition-colors hover:border-gray-700">
            <div className="text-3xl mb-4">🧬</div>
            <h2 className="text-xl font-bold text-white">Craft & Upgrade</h2>
            <p className="mt-3 text-sm text-gray-400">
              Combine runes and materials to forge powerful equipment. Upgrade
              your heroes and gear to dominate the leaderboard.
            </p>
          </div>
          <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-8 transition-colors hover:border-gray-700">
            <div className="text-3xl mb-4">🏆</div>
            <h2 className="text-xl font-bold text-white">Compete</h2>
            <p className="mt-3 text-sm text-gray-400">
              Climb ranks in seasonal leagues. Earn tokens and NFT rewards for
              top placements on the global leaderboard.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-8 text-center">
          <h2 className="text-2xl font-bold text-white">Ready to Play?</h2>
          <p className="mt-3 text-gray-400">
            Connect your wallet and start your journey today.
          </p>
          <Link
            href="/game"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 px-8 py-3 text-sm font-semibold text-black transition-colors hover:from-yellow-400 hover:to-orange-400"
          >
            Launch Game
          </Link>
        </div>
      </section>
    </div>
  )
}