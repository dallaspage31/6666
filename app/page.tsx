'use client'

import { useState, useMemo } from 'react'
import { useGameContext } from '@/lib/hooks/useGame'
import {
  HERO_CLASSES,
  HERO_CLASS_LIST,
  type HeroClass,
} from '@/lib/game-data/hero-rarity'
import {
  ALL_ITEMS,
  RARITY_COLORS,
  RARITY_BG,
  RARITY_MULTIPLIERS,
  SOCKET_LIMIT,
  SLOT_ORDER,
  ItemSlot,
} from '@/lib/game-data/items'
import {
  XP_TABLE,
  getLevelFromXp,
  getXpProgress,
  PRESTIGE_RANKS,
  type PrestigeRank,
} from '@/lib/game-data/progression'
import {
  GEM_TYPES,
  ENGRAVING_TYPES,
  GEM_STATS,
  ENGRAVING_STATS,
  ALL_MATERIALS,
  type GemType,
  type EngravingType,
} from '@/lib/game-data/crafting'
import { toast } from 'sonner'

type Tab = 'heroes' | 'stats' | 'equipment' | 'inventory' | 'sockets'

interface SocketData {
  gem: string | null
  engraving: string | null
}

function initDefaultInventory() {
  const defaultItems = [
    {
      name: 'Rusty Sword',
      slot: 'Main Hand' as ItemSlot,
      rarity: 'Common' as const,
      atk: 5,
      def: 0,
      hp: 0,
      spd: 0,
    },
    {
      name: 'Leather Vest',
      slot: 'Chest' as ItemSlot,
      rarity: 'Uncommon' as const,
      atk: 0,
      def: 8,
      hp: 25,
      spd: 0,
    },
    {
      name: 'Copper Ring',
      slot: 'Ring' as ItemSlot,
      rarity: 'Common' as const,
      atk: 2,
      def: 2,
      hp: 5,
      spd: 0,
    },
    {
      name: 'Flame Sword',
      slot: 'Main Hand' as ItemSlot,
      rarity: 'Rare' as const,
      atk: 30,
      def: 0,
      hp: 0,
      spd: 0,
    },
    {
      name: 'Iron Helm',
      slot: 'Helmet' as ItemSlot,
      rarity: 'Common' as const,
      atk: 0,
      def: 2,
      hp: 5,
      spd: 0,
    },
    {
      name: 'Steel Blade',
      slot: 'Main Hand' as ItemSlot,
      rarity: 'Uncommon' as const,
      atk: 15,
      def: 0,
      hp: 0,
      spd: 0,
    },
  ]
  return defaultItems.map((item, idx) => ({
    id: `item-${idx + 1}`,
    ...item,
    sockets: [{ gem: null as string | null, engraving: null as string | null }],
  }))
}

export default function Page() {
  const game = useGameContext()
  const [activeTab, setActiveTab] = useState<Tab>('heroes')
  const [showHeroModal, setShowHeroModal] = useState(false)
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<
    string | null
  >(null)
  const [socketMap, setSocketMap] = useState<Record<string, SocketData[]>>({})
  const [inventoryFilterType, setInventoryFilterType] = useState<string>('all')
  const [inventoryFilterRarity, setInventoryFilterRarity] =
    useState<string>('all')

  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)

  const inventory = useMemo(() => {
    if (game.inventory.length === 0) {
      return initDefaultInventory()
    }
    return game.inventory
  }, [game.inventory])

  const equippedStats = useMemo(() => {
    const stats = { atk: 0, def: 0, hp: 0, spd: 0 }
    Object.values(game.equipped).forEach((item) => {
      if (item) {
        stats.atk += item.atk
        stats.def += item.def
        stats.hp += item.hp
        stats.spd += item.spd
        const sockets = socketMap[item.id]
        if (sockets) {
          sockets.forEach((s) => {
            if (s.gem && s.gem in GEM_STATS) {
              const gemStats = GEM_STATS[s.gem as GemType]
              stats.atk += gemStats.atk
              stats.def += gemStats.def
              stats.hp += gemStats.hp
              stats.spd += gemStats.spd
            }
            if (s.engraving && s.engraving in ENGRAVING_STATS) {
              const engStats = ENGRAVING_STATS[s.engraving as EngravingType]
              stats.atk += engStats.atk
              stats.def += engStats.def
              stats.hp += engStats.hp
              stats.spd += engStats.spd
            }
          })
        }
      }
    })
    return stats
  }, [game.equipped, socketMap])

  const totalLevel = useMemo(() => {
    if (!game.selectedHero) return 1
    return getLevelFromXp(game.selectedHero.xp + game.xp)
  }, [game.selectedHero, game.xp])

  const xpProgress = useMemo(() => {
    if (!game.selectedHero) return 0
    return getXpProgress(totalLevel, game.selectedHero.xp + game.xp)
  }, [game.selectedHero, game.xp, totalLevel])

  const prestige = useMemo(() => {
    const rank = PRESTIGE_RANKS[PRESTIGE_RANKS.length - 1]
    return { ...rank, rank: PRESTIGE_RANKS.length }
  }, [])

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      if (inventoryFilterType !== 'all' && item.slot !== inventoryFilterType)
        return false
      if (
        inventoryFilterRarity !== 'all' &&
        item.rarity !== inventoryFilterRarity
      )
        return false
      return true
    })
  }, [inventory, inventoryFilterType, inventoryFilterRarity])

  const handleSelectHero = (heroClass: HeroClass) => {
    const base = HERO_CLASSES[heroClass]
    const hero = {
      id: `hero-${heroClass.toLowerCase()}`,
      class: heroClass,
      level: 1,
      xp: 0,
      hp: base.hp,
      atk: base.atk,
      def: base.def,
      spd: base.spd,
    }
    game.setSelectedHero(hero)
    setShowHeroModal(false)
    toast.success(`Selected ${heroClass}`)
  }

  const handleLevelUp = () => {
    if (!game.selectedHero) return
    const nextLevel = totalLevel + 1
    const xpNeeded = XP_TABLE[totalLevel - 1]?.xpRequired ?? 100
    if (game.xp >= xpNeeded) {
      game.setXp(game.xp - xpNeeded)
      game.setSelectedHero({ ...game.selectedHero, level: nextLevel })
      toast.success(`Level up! Now level ${nextLevel}`)
    } else {
      toast.info(`Need ${xpNeeded} XP to level up.`)
    }
  }

  const handleEquip = (item: (typeof inventory)[0], targetSlot: ItemSlot) => {
    if (item.slot !== targetSlot) {
      toast.error(`Item cannot be equipped in ${targetSlot}`)
      return
    }
    game.setEquipped(targetSlot, item)
    game.setInventory(inventory.filter((i) => i.id !== item.id))
    toast.success(`Equipped ${item.name || 'item'} in ${targetSlot}`)
  }

  const handleUnequip = (slot: ItemSlot) => {
    const item = game.equipped[slot]
    if (!item) return
    game.setEquipped(slot, null)
    game.setInventory([...inventory, item])
    toast.success(`Unequipped ${item.name || 'item'}`)
  }

  const handleDrop = (e: React.DragEvent, targetSlot: ItemSlot) => {
    e.preventDefault()
    if (!draggedItemId) return
    const item = inventory.find((i) => i.id === draggedItemId)
    if (!item) return
    handleEquip(item, targetSlot)
    setDraggedItemId(null)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const equipGem = (slot: ItemSlot, socketIdx: number, gem: string) => {
    const equippedItem = game.equipped[slot]
    if (!equippedItem) return
    const key = equippedItem.id
    const existing =
      socketMap[key] ||
      Array(SOCKET_LIMIT[equippedItem.rarity as keyof typeof SOCKET_LIMIT] || 0)
        .fill(null)
        .map(() => ({ gem: null, engraving: null }))
    const updated = [...existing]
    updated[socketIdx] = { ...updated[socketIdx], gem }
    setSocketMap((prev) => ({ ...prev, [key]: updated }))
    toast.success(`Placed ${gem} in ${slot}`)
  }

  const equipEngraving = (
    slot: ItemSlot,
    socketIdx: number,
    engraving: string,
  ) => {
    const equippedItem = game.equipped[slot]
    if (!equippedItem) return
    const key = equippedItem.id
    const existing =
      socketMap[key] ||
      Array(SOCKET_LIMIT[equippedItem.rarity as keyof typeof SOCKET_LIMIT] || 0)
        .fill(null)
        .map(() => ({ gem: null, engraving: null }))
    const updated = [...existing]
    updated[socketIdx] = { ...updated[socketIdx], engraving }
    setSocketMap((prev) => ({ ...prev, [key]: updated }))
    toast.success(`Applied ${engraving} to ${slot}`)
  }

  const renderHeroSelection = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Hero Selection</h2>
        <button
          onClick={() => setShowHeroModal(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-500"
        >
          {game.selectedHero ? 'Change Hero' : 'Select Hero'}
        </button>
      </div>
      {game.selectedHero ? (
        <div className="flex items-center gap-4 rounded-xl border border-gray-700 bg-gray-800/60 p-4">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full border-2 text-2xl font-bold ${HERO_CLASSES[game.selectedHero.class as HeroClass]?.color || 'border-gray-500 text-gray-300'}`}
          >
            {game.selectedHero.class[0]}
          </div>
          <div>
            <div className="text-lg font-bold text-white">
              {game.selectedHero.class}
            </div>
            <div className="text-sm text-gray-400">
              Level {game.selectedHero.level} Hero
            </div>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-gray-400">
          No hero selected. Click the button above to choose your hero.
        </div>
      )}

      {showHeroModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-700 bg-gray-900 p-6">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Choose Your Hero</h3>
              <button
                onClick={() => setShowHeroModal(false)}
                className="text-2xl leading-none text-gray-400 hover:text-white"
              >
                &times;
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {HERO_CLASS_LIST.map((heroClass) => {
                const stats = HERO_CLASSES[heroClass]
                return (
                  <button
                    key={heroClass}
                    onClick={() => handleSelectHero(heroClass)}
                    className={`rounded-xl border-2 p-4 text-left transition-all hover:scale-105 ${stats.color} ${RARITY_BG[game.selectedHero?.class === heroClass ? 'Legendary' : 'Common']}`}
                  >
                    <div className="mb-2 text-2xl">{heroClass[0]}</div>
                    <div className="text-lg font-bold">{heroClass}</div>
                    <div className="mb-3 text-xs opacity-80">
                      {stats.description}
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div>HP: {stats.hp}</div>
                      <div>ATK: {stats.atk}</div>
                      <div>DEF: {stats.def}</div>
                      <div>SPD: {stats.spd}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderStatsPanel = () => {
    if (!game.selectedHero) {
      return (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Hero Stats</h2>
          <div className="py-12 text-center text-gray-400">
            Select a hero to view stats.
          </div>
        </div>
      )
    }

    const hero = game.selectedHero
    const baseStats = HERO_CLASSES[hero.class as HeroClass]
    const effectiveHp = hero.hp + equippedStats.hp
    const effectiveAtk = hero.atk + equippedStats.atk
    const effectiveDef = hero.def + equippedStats.def
    const effectiveSpd = hero.spd + equippedStats.spd
    const xpForNext = XP_TABLE[totalLevel - 1]?.xpRequired ?? 100
    const xpCurrent = Math.min(game.xp + hero.xp, xpForNext)

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Hero Stats</h2>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-4 text-center">
            <div className="mb-1 text-xs tracking-wider text-gray-400 uppercase">
              HP
            </div>
            <div className="text-2xl font-bold text-green-400">
              {effectiveHp}
            </div>
            {equippedStats.hp > 0 && (
              <div className="text-xs text-green-500">+{equippedStats.hp}</div>
            )}
          </div>
          <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-4 text-center">
            <div className="mb-1 text-xs tracking-wider text-gray-400 uppercase">
              ATK
            </div>
            <div className="text-2xl font-bold text-red-400">
              {effectiveAtk}
            </div>
            {equippedStats.atk > 0 && (
              <div className="text-xs text-red-500">+{equippedStats.atk}</div>
            )}
          </div>
          <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-4 text-center">
            <div className="mb-1 text-xs tracking-wider text-gray-400 uppercase">
              DEF
            </div>
            <div className="text-2xl font-bold text-blue-400">
              {effectiveDef}
            </div>
            {equippedStats.def > 0 && (
              <div className="text-xs text-blue-500">+{equippedStats.def}</div>
            )}
          </div>
          <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-4 text-center">
            <div className="mb-1 text-xs tracking-wider text-gray-400 uppercase">
              SPD
            </div>
            <div className="text-2xl font-bold text-yellow-400">
              {effectiveSpd}
            </div>
            {equippedStats.spd > 0 && (
              <div className="text-xs text-yellow-500">
                +{equippedStats.spd}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-gray-700 bg-gray-800/60 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold text-white">{hero.class}</div>
              <div className="text-sm text-gray-400">Level {totalLevel}</div>
            </div>
            <button
              onClick={handleLevelUp}
              disabled={game.xp < xpForNext}
              className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-500 disabled:cursor-not-allowed disabled:bg-gray-600"
            >
              Level Up
            </button>
          </div>
          <div className="h-4 w-full overflow-hidden rounded-full bg-gray-700">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
              style={{ width: `${Math.min(100, xpProgress)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>
              {xpCurrent} / {xpForNext} XP
            </span>
            <span>{xpProgress.toFixed(1)}%</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-4">
          <div className="mb-2 text-sm text-gray-400">Base Stats</div>
          <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
            <div>HP: {baseStats.hp}</div>
            <div>ATK: {baseStats.atk}</div>
            <div>DEF: {baseStats.def}</div>
            <div>SPD: {baseStats.spd}</div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-4">
          <div className="mb-2 text-sm text-gray-400">Prestige Rank</div>
          <div className="text-lg font-bold text-white">{prestige.name}</div>
          <div className="mt-1 text-xs text-gray-500">
            XP Bonus: {(prestige.xpBonus * 100).toFixed(0)}% | Gold Bonus:{' '}
            {(prestige.goldBonus * 100).toFixed(0)}%
          </div>
        </div>
      </div>
    )
  }

  const renderEquipment = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Equipment</h2>
        <button
          onClick={game.unequipAll}
          className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-500"
        >
          Unequip All
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {SLOT_ORDER.map((slot) => {
          const equipped = game.equipped[slot]
          const rarity = equipped?.rarity as
            keyof typeof RARITY_COLORS | undefined
          return (
            <div
              key={slot}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, slot)}
              className={`min-h-[100px] cursor-pointer rounded-xl border-2 border-dashed p-3 transition-colors ${
                equipped
                  ? `${RARITY_COLORS[rarity || 'Common']} ${RARITY_BG[rarity || 'Common']}`
                  : 'border-gray-600 bg-gray-800/30 hover:border-gray-500'
              }`}
            >
              <div className="mb-2 text-xs tracking-wider text-gray-400 uppercase">
                {slot}
              </div>
              {equipped ? (
                <div className="space-y-2">
                  <div className="text-sm font-semibold">
                    {equipped.name || 'Equipped'}
                  </div>
                  <div className="text-xs opacity-80">{equipped.rarity}</div>
                  <div className="space-y-0.5 text-xs">
                    {equipped.atk > 0 && <div>ATK +{equipped.atk}</div>}
                    {equipped.def > 0 && <div>DEF +{equipped.def}</div>}
                    {equipped.hp > 0 && <div>HP +{equipped.hp}</div>}
                    {equipped.spd > 0 && <div>SPD +{equipped.spd}</div>}
                  </div>
                  <button
                    onClick={() => handleUnequip(slot)}
                    className="mt-2 w-full rounded bg-gray-700 px-2 py-1 text-xs text-white transition-colors hover:bg-gray-600"
                  >
                    Unequip
                  </button>
                </div>
              ) : (
                <div className="text-xs text-gray-500">Empty</div>
              )}
            </div>
          )
        })}
      </div>

      <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-4">
        <div className="mb-3 text-sm text-gray-400">
          Drag items from inventory to equip
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {inventory.map((item) => {
            const rarity = item.rarity as keyof typeof RARITY_COLORS
            return (
              <div
                key={item.id}
                draggable
                onDragStart={() => setDraggedItemId(item.id)}
                className={`cursor-grab rounded-lg border p-2 active:cursor-grabbing ${RARITY_COLORS[rarity]} ${RARITY_BG[rarity]}`}
              >
                <div className="truncate text-xs font-semibold">
                  {item.name || 'Item'}
                </div>
                <div className="text-[10px] opacity-70">{item.slot}</div>
              </div>
            )
          })}
          {inventory.length === 0 && (
            <div className="col-span-full py-4 text-center text-sm text-gray-500">
              No items in inventory
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderSocketPanel = (slot: ItemSlot) => {
    const equippedItem = game.equipped[slot]
    if (!equippedItem) return null
    const maxSockets =
      SOCKET_LIMIT[equippedItem.rarity as keyof typeof SOCKET_LIMIT] || 0
    const itemSockets =
      socketMap[equippedItem.id] ||
      Array(maxSockets)
        .fill(null)
        .map(() => ({ gem: null, engraving: null }))

    return (
      <div className="space-y-4 rounded-xl border border-gray-700 bg-gray-800/60 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-bold text-white">
              {equippedItem.name || 'Equipped'}
            </div>
            <div className="text-xs text-gray-400">
              {slot} - {equippedItem.rarity}
            </div>
          </div>
          <div className="text-xs text-gray-500">
            {maxSockets} socket{maxSockets !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="space-y-2">
          {itemSockets.map((s, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="w-20 text-xs text-gray-400">Socket {idx + 1}</div>
              <select
                value={s.gem || ''}
                onChange={(e) =>
                  e.target.value && equipGem(slot, idx, e.target.value)
                }
                className="flex-1 rounded border border-gray-600 bg-gray-900 px-2 py-1 text-xs text-white"
              >
                <option value="">Gem (empty)</option>
                {GEM_TYPES.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <select
                value={s.engraving || ''}
                onChange={(e) =>
                  e.target.value && equipEngraving(slot, idx, e.target.value)
                }
                className="flex-1 rounded border border-gray-600 bg-gray-900 px-2 py-1 text-xs text-white"
              >
                <option value="">Engraving (empty)</option>
                {ENGRAVING_TYPES.map((en) => (
                  <option key={en} value={en}>
                    {en}
                  </option>
                ))}
              </select>
            </div>
          ))}
          {maxSockets === 0 && (
            <div className="text-xs text-gray-500 italic">
              No sockets available for this item rarity.
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderSockets = () => {
    const equippedSlots = SLOT_ORDER.filter(
      (slot) => game.equipped[slot] !== null,
    )
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Socket System</h2>
        {equippedSlots.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            Equip items to manage their sockets and engravings.
          </div>
        ) : (
          <div className="space-y-4">
            {equippedSlots.map((slot) => (
              <div key={slot}>{renderSocketPanel(slot)}</div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const renderInventory = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">Inventory</h2>
      <div className="flex flex-wrap gap-3">
        <select
          value={inventoryFilterType}
          onChange={(e) => setInventoryFilterType(e.target.value)}
          className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
        >
          <option value="all">All Types</option>
          {SLOT_ORDER.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={inventoryFilterRarity}
          onChange={(e) => setInventoryFilterRarity(e.target.value)}
          className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
        >
          <option value="all">All Rarities</option>
          {Object.keys(RARITY_COLORS).map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {filteredInventory.map((item) => {
          const rarity = item.rarity as keyof typeof RARITY_COLORS
          const isSelected = selectedInventoryItem === item.id
          return (
            <div
              key={item.id}
              onClick={() =>
                setSelectedInventoryItem(isSelected ? null : item.id)
              }
              className={`cursor-pointer rounded-xl border-2 p-3 transition-all hover:scale-105 ${
                isSelected ? 'ring-2 ring-white' : ''
              } ${RARITY_COLORS[rarity]} ${RARITY_BG[rarity]}`}
            >
              <div className="truncate text-sm font-semibold">
                {item.name || 'Item'}
              </div>
              <div className="mt-1 text-xs opacity-70">{item.slot}</div>
              <div className="mt-1 text-xs">{item.rarity}</div>
              <div className="mt-2 space-y-0.5 text-[10px] opacity-80">
                {item.atk > 0 && <div>ATK +{item.atk}</div>}
                {item.def > 0 && <div>DEF +{item.def}</div>}
                {item.hp > 0 && <div>HP +{item.hp}</div>}
                {item.spd > 0 && <div>SPD +{item.spd}</div>}
              </div>
            </div>
          )
        })}
        {filteredInventory.length === 0 && (
          <div className="col-span-full py-8 text-center text-gray-500">
            No items match your filters.
          </div>
        )}
      </div>

      {selectedInventoryItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedInventoryItem(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const item = inventory.find((i) => i.id === selectedInventoryItem)
              if (!item) return null
              const rarity = item.rarity as keyof typeof RARITY_COLORS
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">
                      {item.name || 'Item'}
                    </h3>
                    <button
                      onClick={() => setSelectedInventoryItem(null)}
                      className="text-2xl leading-none text-gray-400 hover:text-white"
                    >
                      &times;
                    </button>
                  </div>
                  <div
                    className={`rounded-xl border-2 p-4 ${RARITY_COLORS[rarity]} ${RARITY_BG[rarity]}`}
                  >
                    <div className="mb-2 text-sm opacity-80">
                      {item.slot} - {item.rarity}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {item.atk > 0 && <div>ATK: +{item.atk}</div>}
                      {item.def > 0 && <div>DEF: +{item.def}</div>}
                      {item.hp > 0 && <div>HP: +{item.hp}</div>}
                      {item.spd > 0 && <div>SPD: +{item.spd}</div>}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">
                    Rarity Multiplier:{' '}
                    {
                      RARITY_MULTIPLIERS[
                        rarity as keyof typeof RARITY_MULTIPLIERS
                      ]
                    }
                    x
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )

  const tabs: { id: Tab; label: string }[] = [
    { id: 'heroes', label: 'Heroes' },
    { id: 'stats', label: 'Stats' },
    { id: 'equipment', label: 'Equipment' },
    { id: 'sockets', label: 'Sockets' },
    { id: 'inventory', label: 'Inventory' },
  ]

  return (
    <div
      id="game-container"
      className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white"
    >
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <header className="flex items-center justify-between">
          <h1 className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-3xl font-black tracking-tight text-transparent">
            ROBHEROES
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-400">
              Gold:{' '}
              <span className="font-bold text-yellow-400">
                {game.gold.toLocaleString()}
              </span>
            </div>
            <div className="text-sm text-gray-400">
              Balance:{' '}
              <span className="font-bold text-purple-400">
                {game.robheroesBalance.toLocaleString()} ROBH
              </span>
            </div>
          </div>
        </header>

        <nav className="flex flex-wrap gap-2 border-b border-gray-700 pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <main>
          {activeTab === 'heroes' && renderHeroSelection()}
          {activeTab === 'stats' && renderStatsPanel()}
          {activeTab === 'equipment' && renderEquipment()}
          {activeTab === 'sockets' && renderSockets()}
          {activeTab === 'inventory' && renderInventory()}
        </main>
      </div>
    </div>
  )
}
