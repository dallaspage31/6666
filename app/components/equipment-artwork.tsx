'use client'

import { useState } from 'react'

interface EquipmentArtworkProps {
  name: string
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Cosmic'
  slot: string
  atk?: number
  def?: number
  hp?: number
  icon?: string
}

const RARITY_BORDERS: Record<EquipmentArtworkProps['rarity'], string> = {
  Common: 'border-gray-500',
  Uncommon: 'border-green-500',
  Rare: 'border-blue-500',
  Epic: 'border-purple-500',
  Legendary: 'border-orange-500',
  Cosmic: 'border-transparent bg-gradient-to-br from-pink-500/30 via-purple-500/30 to-cyan-500/30',
}

const RARITY_GLOWS: Record<EquipmentArtworkProps['rarity'], string> = {
  Common: '',
  Uncommon: 'shadow-green-500/20',
  Rare: 'shadow-blue-500/20',
  Epic: 'shadow-purple-500/20',
  Legendary: 'shadow-orange-500/30',
  Cosmic: 'shadow-pink-500/30',
}

const SLOT_ICONS: Record<string, string> = {
  Weapon: '⚔️',
  Helmet: '🪖',
  Armor: '🛡️',
  Gloves: '🧤',
  Boots: '👢',
  Belt: '🪢',
  Ring: '💍',
  Amulet: '📿',
  Cape: '🧣',
  Artifact: '✨',
}

export function EquipmentArtwork({
  name,
  rarity,
  slot,
  atk = 0,
  def = 0,
  hp = 0,
  icon,
}: EquipmentArtworkProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className={`relative p-6 border-2 ${RARITY_BORDERS[rarity]} rounded-xl bg-gray-900 ${RARITY_GLOWS[rarity]} transition-all duration-300 ${
        hovered ? 'scale-[1.02]' : ''
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="absolute top-3 right-3">
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
          rarity === 'Common'
            ? 'bg-gray-700 text-gray-300'
            : rarity === 'Uncommon'
            ? 'bg-green-700 text-green-200'
            : rarity === 'Rare'
            ? 'bg-blue-700 text-blue-200'
            : rarity === 'Epic'
            ? 'bg-purple-700 text-purple-200'
            : rarity === 'Legendary'
            ? 'bg-orange-700 text-orange-200'
            : 'bg-gradient-to-r from-pink-600 to-cyan-600 text-white'
        }`}>
          {rarity}
        </span>
      </div>

      <div className="text-center mb-4">
        <div className="text-5xl mb-3">{icon ?? SLOT_ICONS[slot] ?? '📦'}</div>
        <h3 className="text-xl font-bold text-gray-100">{name}</h3>
        <p className="text-sm text-gray-500 mt-1">{slot}</p>
      </div>

      {(atk > 0 || def > 0 || hp > 0) && (
        <div className="space-y-2 mt-4">
          {atk > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-orange-400 font-semibold w-8">ATK</span>
              <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(atk / 50 * 100, 100)}%` }}
                />
              </div>
              <span className="text-orange-400 font-mono text-xs w-8 text-right">+{atk}</span>
            </div>
          )}
          {def > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-blue-400 font-semibold w-8">DEF</span>
              <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(def / 50 * 100, 100)}%` }}
                />
              </div>
              <span className="text-blue-400 font-mono text-xs w-8 text-right">+{def}</span>
            </div>
          )}
          {hp > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-400 font-semibold w-8">HP</span>
              <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(hp / 100 * 100, 100)}%` }}
                />
              </div>
              <span className="text-green-400 font-mono text-xs w-8 text-right">+{hp}</span>
            </div>
          )}
        </div>
      )}

      {rarity === 'Legendary' && (
        <div className="mt-4 text-center text-xs text-orange-400 font-semibold animate-pulse">
          ✨ Set Bonus Active ✨
        </div>
      )}

      {rarity === 'Cosmic' && (
        <div className="mt-4 text-center text-xs text-white font-semibold">
          🌟 Cosmic Effect: All Stats +15% 🌟
        </div>
      )}
    </div>
  )
}