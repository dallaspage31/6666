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
  Cosmic:
    'border-transparent bg-gradient-to-br from-pink-500/30 via-purple-500/30 to-cyan-500/30',
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
      className={`relative border-2 p-6 ${RARITY_BORDERS[rarity]} rounded-xl bg-gray-900 ${RARITY_GLOWS[rarity]} transition-all duration-300 ${
        hovered ? 'scale-[1.02]' : ''
      }`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="absolute top-3 right-3">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
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
          }`}
        >
          {rarity}
        </span>
      </div>

      <div className="mb-4 text-center">
        <div className="mb-3 text-5xl">{icon ?? SLOT_ICONS[slot] ?? '📦'}</div>
        <h3 className="text-xl font-bold text-gray-100">{name}</h3>
        <p className="mt-1 text-sm text-gray-500">{slot}</p>
      </div>

      {(atk > 0 || def > 0 || hp > 0) && (
        <div className="mt-4 space-y-2">
          {atk > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="w-8 font-semibold text-orange-400">ATK</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-800">
                <div
                  className="h-full rounded-full bg-orange-500 transition-all duration-500"
                  style={{ width: `${Math.min((atk / 50) * 100, 100)}%` }}
                />
              </div>
              <span className="w-8 text-right font-mono text-xs text-orange-400">
                +{atk}
              </span>
            </div>
          )}
          {def > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="w-8 font-semibold text-blue-400">DEF</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-800">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${Math.min((def / 50) * 100, 100)}%` }}
                />
              </div>
              <span className="w-8 text-right font-mono text-xs text-blue-400">
                +{def}
              </span>
            </div>
          )}
          {hp > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="w-8 font-semibold text-green-400">HP</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-800">
                <div
                  className="h-full rounded-full bg-green-500 transition-all duration-500"
                  style={{ width: `${Math.min((hp / 100) * 100, 100)}%` }}
                />
              </div>
              <span className="w-8 text-right font-mono text-xs text-green-400">
                +{hp}
              </span>
            </div>
          )}
        </div>
      )}

      {rarity === 'Legendary' && (
        <div className="mt-4 animate-pulse text-center text-xs font-semibold text-orange-400">
          ✨ Set Bonus Active ✨
        </div>
      )}

      {rarity === 'Cosmic' && (
        <div className="mt-4 text-center text-xs font-semibold text-white">
          🌟 Cosmic Effect: All Stats +15% 🌟
        </div>
      )}
    </div>
  )
}
