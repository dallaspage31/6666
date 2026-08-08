'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MeltPanel } from '@/components/melt-panel'
import { ITEM_DATABASE, RARITY_COLORS } from '@/lib/items'
import { CRAFTING_RECIPES, canCraft } from '@/lib/crafting'
import { PET_DATABASE } from '@/lib/pets'
import { RUNE_DATABASE } from '@/lib/runes'
import { XP_TABLE, PRESTIGE_RANKS } from '@/lib/progression'

type TabId = 'market' | 'cube' | 'melt' | 'pets' | 'runes' | 'progression'

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'market', label: 'Market', icon: '💰' },
  { id: 'cube', label: 'Cube / Crafting', icon: '🔨' },
  { id: 'melt', label: 'Melt', icon: '🔥' },
  { id: 'pets', label: 'Pets', icon: '🐾' },
  { id: 'runes', label: 'Runes', icon: '🌿' },
  { id: 'progression', label: 'Progression', icon: '📈' },
]

const MARKET_LISTINGS = [
  { id: 'm1', itemId: 'item_shadow_blade', price: 1200, seller: 'CyberWolf_99', currency: 'ROB' },
  { id: 'm2', itemId: 'item_dragon_plate', price: 3500, seller: 'NeonBlade', currency: 'ROB' },
  { id: 'm3', itemId: 'item_phoenix_gauntlets', price: 8900, seller: 'PixelRogue', currency: 'ROB' },
  { id: 'm4', itemId: 'item_cosmic_crown', price: 25000, seller: 'TitanCore', currency: 'ROB' },
  { id: 'm5', itemId: 'item_health_potion', price: 50, seller: 'GlitchX', currency: 'ROB' },
  { id: 'm6', itemId: 'item_mana_crystal', price: 150, seller: 'StarForge', currency: 'ROB' },
]

export default function Page() {
  const [activeTab, setActiveTab] = useState<TabId>('market')

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
              ROBHEROES
            </span>
            <nav className="hidden md:flex items-center gap-6 text-sm">
              <a href="#market" className="text-gray-400 hover:text-gray-100 transition-colors">Market</a>
              <a href="#cube" className="text-gray-400 hover:text-gray-100 transition-colors">Cube</a>
              <a href="#melt" className="text-gray-400 hover:text-gray-100 transition-colors">Melt</a>
              <a href="#pets" className="text-gray-400 hover:text-gray-100 transition-colors">Pets</a>
              <a href="#runes" className="text-gray-400 hover:text-gray-100 transition-colors">Runes</a>
              <a href="#progression" className="text-gray-400 hover:text-gray-100 transition-colors">Progression</a>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/game" className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors">Play</Link>
          </div>
        </div>
      </header>

      <section className="relative py-20 text-center">
        <div className="mx-auto max-w-4xl px-4">
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              ROBHEROES
            </span>
          </h1>
          <p className="mt-6 text-lg text-gray-400 sm:text-xl">
            Automated PvP combat. Collect heroes, equip gear, and climb the rankings.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/game"
              className="inline-flex items-center justify-center rounded-lg bg-cyan-500 px-8 py-3 text-sm font-semibold text-gray-950 transition-colors hover:bg-cyan-400"
            >
              Play Now
            </Link>
            <Link
              href="#market"
              className="inline-flex items-center justify-center rounded-lg border border-gray-700 px-8 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-800 hover:text-white"
            >
              Explore Market
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm rounded-lg border transition-colors ${
                activeTab === tab.id
                  ? 'bg-gray-800 border-gray-600 text-gray-100'
                  : 'bg-gray-900 border-gray-800 text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
          {activeTab === 'market' && <MarketSection />}
          {activeTab === 'cube' && <CubeSection />}
          {activeTab === 'melt' && <MeltSection />}
          {activeTab === 'pets' && <PetsSection />}
          {activeTab === 'runes' && <RunesSection />}
          {activeTab === 'progression' && <ProgressionSection />}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-16">
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

      <footer className="border-t border-gray-800 py-6 text-center text-sm text-gray-500">
        ROBHEROES &copy; 2026
      </footer>
    </div>
  )
}

function MarketSection() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">🏪 Player Market</h3>
        <span className="text-sm text-gray-400">{MARKET_LISTINGS.length} listings</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MARKET_LISTINGS.map((listing: typeof MARKET_LISTINGS[0]) => {
          const item = ITEM_DATABASE.find((i: typeof ITEM_DATABASE[0]) => i.id === listing.itemId)
          if (!item) return null
          return (
            <div key={listing.id} className="p-4 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <div className="font-semibold text-sm">{item.name}</div>
                  <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${RARITY_COLORS[item.rarity]}`}>
                    {item.rarity}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-yellow-400 font-semibold">{listing.price.toLocaleString()} {listing.currency}</span>
                <span className="text-gray-500 text-xs">by {listing.seller}</span>
              </div>
              <button className="mt-3 w-full px-3 py-1.5 text-sm bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg transition-colors text-gray-300">
                Buy Now
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CubeSection() {
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null)
  const [craftLog, setCraftLog] = useState<string[]>([])

  const handleCraft = (recipeId: string) => {
    const recipe = CRAFTING_RECIPES.find((r: typeof CRAFTING_RECIPES[0]) => r.id === recipeId)
    if (!recipe) return
    const fakeInventory: Record<string, number> = {}
    recipe.materials.forEach((m: { itemId: string; quantity: number }) => {
      fakeInventory[m.itemId] = m.quantity + 1
    })
    if (!canCraft(recipe, fakeInventory)) {
      setCraftLog((prev) => [...prev, `Not enough materials for ${recipe.name}`])
      return
    }
    setCraftLog((prev) => [...prev, `Crafted ${recipe.name}! +${recipe.xpReward} XP, -${recipe.goldCost} gold`])
    setSelectedRecipe(null)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-white">🔨 Cube / Crafting</h3>
      <p className="text-sm text-gray-400">Combine materials and equipment to forge powerful items.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CRAFTING_RECIPES.map((recipe: typeof CRAFTING_RECIPES[0]) => {
          const resultItem = ITEM_DATABASE.find((i: typeof ITEM_DATABASE[0]) => i.id === recipe.resultItemId)
          return (
            <div key={recipe.id} className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{resultItem?.icon ?? '📦'}</span>
                <div>
                  <div className="font-semibold text-sm">{recipe.name}</div>
                  <span className="text-xs text-gray-500">x{recipe.resultCount} result</span>
                </div>
              </div>
              <div className="text-xs text-gray-400 mb-3">
                Materials:{' '}
                {recipe.materials.map((m: { itemId: string; quantity: number }) => {
                  const matItem = ITEM_DATABASE.find((i: typeof ITEM_DATABASE[0]) => i.id === m.itemId)
                  return `${matItem?.icon ?? '📦'} ${matItem?.name ?? m.itemId} x${m.quantity}`
                }).join(', ')}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                <span>+{recipe.xpReward} XP</span>
                <span>-{recipe.goldCost} gold</span>
              </div>
              <button
                onClick={() => handleCraft(recipe.id)}
                className="w-full px-3 py-1.5 text-sm bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg transition-colors"
              >
                Craft
              </button>
            </div>
          )
        })}
      </div>
      {craftLog.length > 0 && (
        <div className="p-3 bg-gray-900 border border-gray-800 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-300 mb-2">Craft Log</h4>
          <div className="space-y-1">
            {craftLog.map((log, i) => (
              <div key={i} className="text-xs text-gray-400">{log}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MeltSection() {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-white">🔥 Melt Panel</h3>
      <p className="text-sm text-gray-400">Break down unwanted equipment into crafting materials.</p>
      <MeltPanel />
    </div>
  )
}

function PetsSection() {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-white">🐾 Pets</h3>
      <p className="text-sm text-gray-400">Companion pets that provide stat bonuses and abilities in battle.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PET_DATABASE.map((pet: typeof PET_DATABASE[0]) => (
          <div key={pet.id} className="p-4 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-700 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{pet.icon}</span>
              <div>
                <div className="font-semibold">{pet.name}</div>
                <span className="text-xs text-gray-500">Lvl {pet.level} • {pet.rarity}</span>
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-3">{pet.description}</p>
            <div className="p-2 bg-gray-950 border border-gray-800 rounded">
              <div className="text-xs font-semibold text-gray-300 mb-1">{pet.ability.name}</div>
              <div className="text-xs text-gray-500">{pet.ability.description}</div>
              <div className="flex gap-3 text-xs text-gray-400 mt-2">
                {pet.ability.statBonus.atk > 0 && <span className="text-orange-400">ATK +{pet.ability.statBonus.atk}</span>}
                {pet.ability.statBonus.def > 0 && <span className="text-blue-400">DEF +{pet.ability.statBonus.def}</span>}
                {pet.ability.statBonus.hp > 0 && <span className="text-green-400">HP +{pet.ability.statBonus.hp}</span>}
                {pet.ability.statBonus.spd > 0 && <span className="text-yellow-400">SPD +{pet.ability.statBonus.spd}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RunesSection() {
  const [selectedRune, setSelectedRune] = useState<string | null>(null)
  const selected = selectedRune ? RUNE_DATABASE.find((r: typeof RUNE_DATABASE[0]) => r.id === selectedRune) : null

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-white">🌿 Rune Trees</h3>
      <p className="text-sm text-gray-400">Socket runes into gear to unlock powerful stat bonuses and effects.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {RUNE_DATABASE.map((rune: typeof RUNE_DATABASE[0]) => (
          <div
            key={rune.id}
            onClick={() => setSelectedRune(rune.id)}
            className={`p-4 bg-gray-900 border rounded-lg cursor-pointer transition-colors ${
              selectedRune === rune.id ? 'border-gray-600 bg-gray-800' : 'border-gray-800 hover:border-gray-700'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{rune.icon}</span>
              <div>
                <div className="font-semibold text-sm">{rune.name}</div>
                <span className="text-xs text-gray-500">{rune.element} • {rune.slot}</span>
              </div>
            </div>
            <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${RARITY_COLORS[rune.rarity]}`}>
              {rune.rarity}
            </span>
            <div className="flex gap-3 text-xs text-gray-400 mt-2">
              {rune.statBonus.atk > 0 && <span className="text-orange-400">ATK +{rune.statBonus.atk}</span>}
              {rune.statBonus.def > 0 && <span className="text-blue-400">DEF +{rune.statBonus.def}</span>}
              {rune.statBonus.hp > 0 && <span className="text-green-400">HP +{rune.statBonus.hp}</span>}
              {rune.statBonus.spd > 0 && <span className="text-yellow-400">SPD +{rune.statBonus.spd}</span>}
            </div>
          </div>
        ))}
      </div>
      {selected && (
        <div className="p-4 bg-gray-900 border border-gray-800 rounded-lg">
          <div className="text-sm font-semibold text-white mb-1">{selected.name}</div>
          <div className="text-xs text-gray-400">{selected.description}</div>
          <div className="text-xs text-gray-500 mt-2">Effect: {selected.effect} ({selected.effectValue})</div>
        </div>
      )}
    </div>
  )
}

function ProgressionSection() {
  const [showAllLevels, setShowAllLevels] = useState(false)
  const levels = showAllLevels ? XP_TABLE : XP_TABLE.slice(0, 10)

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-white">📈 Progression</h3>
      <div>
        <h4 className="text-sm font-semibold text-gray-300 mb-3">XP Table</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-800">
            <thead className="bg-gray-800/50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-400">Level</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-400">XP Required</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-400">HP Bonus</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-400">ATK</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-400">DEF</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-400">SPD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {levels.map((cfg: typeof XP_TABLE[0]) => (
                <tr key={cfg.level} className="hover:bg-gray-800/30">
                  <td className="px-3 py-2 text-sm font-medium text-white">{cfg.level}</td>
                  <td className="px-3 py-2 text-sm text-gray-300">{cfg.xpRequired.toLocaleString()}</td>
                  <td className="px-3 py-2 text-sm text-green-400">+{cfg.hpBonus}</td>
                  <td className="px-3 py-2 text-sm text-orange-400">+{cfg.atkBonus}</td>
                  <td className="px-3 py-2 text-sm text-blue-400">+{cfg.defBonus}</td>
                  <td className="px-3 py-2 text-sm text-yellow-400">+{cfg.spdBonus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          onClick={() => setShowAllLevels((v) => !v)}
          className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          {showAllLevels ? 'Show less' : 'Show all levels'}
        </button>
      </div>
      <div>
        <h4 className="text-sm font-semibold text-gray-300 mb-3">Prestige Ranks</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {PRESTIGE_RANKS.map((rank: typeof PRESTIGE_RANKS[0]) => (
            <div key={rank.rank} className="p-3 bg-gray-900 border border-gray-800 rounded-lg">
              <div className="text-sm font-semibold text-white">Rank {rank.rank}: {rank.name}</div>
              <div className="text-xs text-gray-500 mt-1">Min Lvl {rank.minLevel}</div>
              <div className="text-xs text-cyan-400 mt-1">{rank.xpMultiplier}x XP</div>
              <div className="text-xs text-gray-400 mt-2">{rank.unlocks.join(', ')}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}