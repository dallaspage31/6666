'use client'

import { useState } from 'react'

interface GameSystem {
  key: string
  label: string
  icon: string
  description: string
  status: 'active' | 'locked' | 'beta'
}

const GAME_SYSTEMS: GameSystem[] = [
  {
    key: 'combat',
    label: 'Combat',
    icon: '⚔️',
    description: 'Auto-battle with wave-based encounters and hero combat logic',
    status: 'active',
  },
  {
    key: 'equipment',
    label: 'Equipment',
    icon: '🛡️',
    description: 'Collect and upgrade gear across multiple rarity tiers',
    status: 'active',
  },
  {
    key: 'crafting',
    label: 'Crafting',
    icon: '🔨',
    description: 'Synthesize, recycle, and socket items to enhance gear',
    status: 'active',
  },
  {
    key: 'runes',
    label: 'Rune Trees',
    icon: '🌿',
    description: 'Unlock offensive, defensive, and growth rune paths',
    status: 'beta',
  },
  {
    key: 'pets',
    label: 'Pets',
    icon: '🐾',
    description: 'Summon and level up companion pets for battle bonuses',
    status: 'locked',
  },
  {
    key: 'melt',
    label: 'Melt',
    icon: '🔥',
    description: 'Break down unwanted equipment for crafting materials',
    status: 'active',
  },
]

const STATUS_STYLES: Record<GameSystem['status'], string> = {
  active: 'bg-green-600 text-green-100',
  beta: 'bg-yellow-600 text-yellow-100',
  locked: 'bg-gray-600 text-gray-300',
}

export function GameSystems() {
  const [activeTab, setActiveTab] = useState<string>('combat')
  const activeSystem =
    GAME_SYSTEMS.find((s) => s.key === activeTab) ?? GAME_SYSTEMS[0]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {GAME_SYSTEMS.map((system) => (
          <button
            key={system.key}
            onClick={() => setActiveTab(system.key)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
              activeTab === system.key
                ? 'border-gray-600 bg-gray-800 text-gray-100'
                : 'border-gray-800 bg-gray-900 text-gray-500 hover:text-gray-300'
            }`}
          >
            {system.icon} {system.label}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-gray-800 bg-gray-900 p-4">
        <div className="mb-3 flex items-center gap-3">
          <span className="text-2xl">{activeSystem.icon}</span>
          <div>
            <h3 className="text-lg font-semibold">{activeSystem.label}</h3>
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs ${STATUS_STYLES[activeSystem.status]}`}
            >
              {activeSystem.status}
            </span>
          </div>
        </div>
        <p className="text-sm text-gray-400">{activeSystem.description}</p>
      </div>
    </div>
  )
}
