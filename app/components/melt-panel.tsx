'use client'

import { useState } from 'react'

interface EquipmentItem {
  id: string
  name: string
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Cosmic'
  slot: string
  atk: number
  def: number
  hp: number
}

const RARITY_COLORS: Record<EquipmentItem['rarity'], string> = {
  Common: 'bg-gray-500',
  Uncommon: 'bg-green-600',
  Rare: 'bg-blue-600',
  Epic: 'bg-purple-600',
  Legendary: 'bg-orange-600',
  Cosmic: 'bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500',
}

const RARITY_MULTIPLIERS: Record<EquipmentItem['rarity'], number> = {
  Common: 1,
  Uncommon: 1.3,
  Rare: 1.7,
  Epic: 2.2,
  Legendary: 3.0,
  Cosmic: 5.0,
}

const SAMPLE_EQUIPMENT: EquipmentItem[] = [
  { id: '1', name: 'Iron Sword', rarity: 'Common', slot: 'Weapon', atk: 10, def: 0, hp: 0 },
  { id: '2', name: 'Steel Helm', rarity: 'Uncommon', slot: 'Helmet', atk: 0, def: 8, hp: 20 },
  { id: '3', name: 'Shadow Blade', rarity: 'Rare', slot: 'Weapon', atk: 25, def: 0, hp: 0 },
  { id: '4', name: 'Dragon Plate', rarity: 'Epic', slot: 'Armor', atk: 5, def: 30, hp: 80 },
  { id: '5', name: 'Phoenix Gauntlets', rarity: 'Legendary', slot: 'Gloves', atk: 15, def: 10, hp: 30 },
  { id: '6', name: 'Cosmic Crown', rarity: 'Cosmic', slot: 'Helmet', atk: 20, def: 20, hp: 50 },
]

export function MeltPanel() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [melted, setMelted] = useState<string[]>([])

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleMelt = () => {
    setMelted((prev) => [...prev, ...selectedIds])
    setSelectedIds(new Set())
  }

  const selectedItems = SAMPLE_EQUIPMENT.filter((item) => selectedIds.has(item.id))
  const totalValue = selectedItems.reduce((sum, item) => sum + RARITY_MULTIPLIERS[item.rarity], 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Melt Equipment</h3>
        <span className="text-sm text-gray-400">
          {selectedIds.size} selected
        </span>
      </div>

      <div className="space-y-2">
        {SAMPLE_EQUIPMENT.map((item) => {
          const isMelted = melted.includes(item.id)
          const isSelected = selectedIds.has(item.id)

          if (isMelted) {
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-gray-900 border border-gray-800 rounded-lg opacity-50 line-through"
              >
                <div className={`w-3 h-3 rounded-full ${RARITY_COLORS[item.rarity]}`} />
                <span className="text-gray-500 text-sm">{item.name} — Melted</span>
              </div>
            )
          }

          return (
            <label
              key={item.id}
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-gray-800 border-gray-600'
                  : 'bg-gray-900 border-gray-800 hover:border-gray-700'
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleSelect(item.id)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-yellow-500 focus:ring-yellow-500"
              />
              <div className={`w-3 h-3 rounded-full ${RARITY_COLORS[item.rarity]}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{item.name}</span>
                  <span className="text-xs text-gray-500">{item.slot}</span>
                </div>
                <div className="flex gap-3 text-xs text-gray-400 mt-0.5">
                  {item.atk > 0 && <span className="text-orange-400">ATK +{item.atk}</span>}
                  {item.def > 0 && <span className="text-blue-400">DEF +{item.def}</span>}
                  {item.hp > 0 && <span className="text-green-400">HP +{item.hp}</span>}
                </div>
              </div>
              <span className="text-xs text-gray-500">
                {RARITY_MULTIPLIERS[item.rarity]}x
              </span>
            </label>
          )
        })}
      </div>

      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between p-3 bg-gray-900 border border-gray-800 rounded-lg">
          <span className="text-sm text-gray-400">
            Melt {selectedIds.size} item{selectedIds.size > 1 ? 's' : ''} for materials
          </span>
          <button
            onClick={handleMelt}
            className="px-4 py-1.5 text-sm bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-colors"
          >
            Melt Selected
          </button>
        </div>
      )}
    </div>
  )
}