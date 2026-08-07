import Link from 'next/link'
import { BattleGame } from '@/app/game/BattleGame'
import { GameSystems } from '@/app/components/game-systems'
import { MeltPanel } from '@/app/components/melt-panel'
import { EquipmentArtwork } from '@/app/components/equipment-artwork'
import { TokenGate } from '@/app/components/token-gate'
import { ITEM_DATABASE, RARITY_COLORS } from '@/app/lib/items'
import { PET_DATABASE } from '@/app/lib/pets'
import { RUNE_DATABASE } from '@/app/lib/runes'
import { XP_TABLE, PRESTIGE_RANKS, getLevelConfig } from '@/app/lib/progression'
import type { Item } from '@/app/lib/items'

export const metadata = {
  title: 'ROBHEROES - Robo Heroes Game',
  description: 'Play Robo Heroes and battle in automated PvP combat',
}

const equipmentItems = ITEM_DATABASE.filter(
  (item): item is Item => item.type === 'equipment'
)

export default function Page() {
  return (
    <div className="space-y-16">
      <section id="game" className="relative py-20 text-center">
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
            <a
              href="#battle"
              className="inline-flex items-center justify-center rounded-lg bg-cyan-500 px-8 py-3 text-sm font-semibold text-gray-950 transition-colors hover:bg-cyan-400"
            >
              Play Now
            </a>
            <Link
              href="/docs"
              className="inline-flex items-center justify-center rounded-lg border border-gray-700 px-8 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      <section id="battle" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-white mb-6">Battle Arena</h2>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
          <BattleGame />
        </div>
      </section>

      <section id="market" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-white mb-6">Market</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {equipmentItems.map((item) => (
            <div
              key={item.id}
              className={`rounded-lg border p-4 ${RARITY_COLORS[item.rarity].replace('bg-', 'border-')} bg-gray-900`}
            >
              <div className="text-3xl mb-2">{item.icon}</div>
              <h3 className="text-lg font-semibold text-white">{item.name}</h3>
              <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${RARITY_COLORS[item.rarity]} text-white`}>
                {item.rarity}
              </span>
              <p className="mt-2 text-sm text-gray-400">{item.description}</p>
              <div className="mt-3 flex gap-3 text-xs text-gray-400">
                {item.atk > 0 && <span className="text-orange-400">ATK +{item.atk}</span>}
                {item.def > 0 && <span className="text-blue-400">DEF +{item.def}</span>}
                {item.hp > 0 && <span className="text-green-400">HP +{item.hp}</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="crafting" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-white mb-6">Cube & Crafting</h2>
        <GameSystems />
      </section>

      <section id="melt" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-white mb-6">Melt Panel</h2>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
          <MeltPanel />
        </div>
      </section>

      <section id="pets" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-white mb-6">Pets</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PET_DATABASE.map((pet) => (
            <div key={pet.id} className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
              <div className="text-4xl mb-3">{pet.icon}</div>
              <h3 className="text-xl font-bold text-white">{pet.name}</h3>
              <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${RARITY_COLORS[pet.rarity]} text-white`}>
                {pet.rarity}
              </span>
              <p className="mt-2 text-sm text-gray-400">{pet.description}</p>
              <div className="mt-3 text-xs text-gray-400">
                <span className="text-cyan-400">{pet.ability.name}</span> — {pet.ability.description}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="runes" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-white mb-6">Runes</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {RUNE_DATABASE.map((rune) => (
            <div key={rune.id} className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
              <div className="text-3xl mb-3">{rune.icon}</div>
              <h3 className="text-lg font-bold text-white">{rune.name}</h3>
              <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full ${RARITY_COLORS[rune.rarity]} text-white`}>
                {rune.rarity}
              </span>
              <p className="mt-2 text-sm text-gray-400">{rune.description}</p>
              <div className="mt-3 flex gap-3 text-xs text-gray-400">
                <span className="text-purple-400">{rune.slot}</span>
                <span className="text-yellow-400">{rune.element}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="progression" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-white mb-6">Progression</h2>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
            <h3 className="text-xl font-bold text-white mb-4">XP Table</h3>
            <div className="space-y-2">
              {XP_TABLE.slice(0, 10).map((level) => {
                const config = getLevelConfig(level.level)
                return (
                  <div key={level.level} className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Level {level.level}</span>
                    <span className="text-gray-500">{config.xpRequired} XP</span>
                    <span className="text-xs text-gray-600">
                      +{config.atkBonus} ATK +{config.defBonus} DEF +{config.hpBonus} HP
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Prestige Ranks</h3>
            <div className="space-y-3">
              {PRESTIGE_RANKS.map((rank) => (
                <div key={rank.rank} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-white">{rank.name}</span>
                    <span className="ml-2 text-xs text-gray-500">Lv.{rank.minLevel}</span>
                  </div>
                  <span className="text-xs text-cyan-400">{rank.xpMultiplier}x XP</span>
                </div>
              ))}
            </div>
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
            href="#battle"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-yellow-500 to-orange-500 px-8 py-3 text-sm font-semibold text-black transition-colors hover:from-yellow-400 hover:to-orange-400"
          >
            Launch Game
          </Link>
        </div>
      </section>

      <section id="equipment" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-white mb-6">Equipment Showcase</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {equipmentItems.slice(0, 3).map((item) => (
            <EquipmentArtwork
              key={item.id}
              name={item.name}
              rarity={item.rarity}
              slot={item.slot ?? 'Artifact'}
              atk={item.atk}
              def={item.def}
              hp={item.hp}
              icon={item.icon}
            />
          ))}
        </div>
      </section>

      <section id="token-gate" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-white mb-6">Token Gate</h2>
        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
          <TokenGate requiredAmount={100000} tokenSymbol="ROBHEROES">
            <p className="text-green-400 font-semibold">Access granted! You hold enough ROBHEROES tokens.</p>
          </TokenGate>
        </div>
      </section>
    </div>
  )
}
