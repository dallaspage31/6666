'use client'

import { useState } from 'react'

import { RARITY_BADGE_COLORS, RARITY_BORDER_COLORS, type Rarity } from '../lib/rarity'
import { StatBar } from './ui/stat-bar'

interface EquipmentArtworkProps {
  name: string
  rarity: Rarity
  slot: string
  atk?: number
  def?: number
  hp?: number
  icon?: string
}

const RARITY_BORDERS: Record<Rarity, string> = {
  ...RARITY_BORDER_COLORS,
  Cosmic: `${RARITY_BORDER_COLORS.Cosmic} bg-gradient-to-br from-pink-500/30 via-purple-500/30 to-cyan-500/30`,
}

const RARITY_GLOWS: Record<Rarity, string> = {
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
        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${RARITY_BADGE_COLORS[rarity]}`}>
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
          {atk > 0 && <StatBar kind="atk" value={atk} />}
          {def > 0 && <StatBar kind="def" value={def} />}
          {hp > 0 && <StatBar kind="hp" value={hp} />}
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