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
  ItemRarity,
} from '@/lib/game-data/items'
import {
  XP_TABLE,
  getLevelFromXp,
  getXpProgress,
  PRESTIGE_RANKS,
} from '@/lib/game-data/progression'
import {
  GEM_TYPES,
  ENGRAVING_TYPES,
  GEM_STATS,
  ENGRAVING_STATS,
  ALL_MATERIALS,
  CRAFTING_RECIPES,
  type GemType,
  type EngravingType,
  type MaterialType,
} from '@/lib/game-data/crafting'
import {
  RUNES,
  RUNE_BRANCHES,
  RUNE_BRANCH_COLORS,
  BRANCH_TIERS,
  type RuneBranch,
} from '@/lib/game-data/runes'
import { toast } from 'sonner'

type Tab =
  | 'heroes'
  | 'stats'
  | 'equipment'
  | 'inventory'
  | 'sockets'
  | 'market'
  | 'cube'
  | 'melt'
  | 'pets'
  | 'runes'
  | 'progression'

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

const PET_DATA = [
  { id: 'pet-1', name: 'Spark', bonusType: 'xp', bonusValue: 10, icon: '⚡' },
  {
    id: 'pet-2',
    name: 'Goldie',
    bonusType: 'gold',
    bonusValue: 15,
    icon: '🪙',
  },
  {
    id: 'pet-3',
    name: 'Chestnut',
    bonusType: 'chestFind',
    bonusValue: 12,
    icon: '🎁',
  },
  {
    id: 'pet-4',
    name: 'Shell',
    bonusType: 'armor',
    bonusValue: 10,
    icon: '🛡️',
  },
  {
    id: 'pet-5',
    name: 'Swift',
    bonusType: 'atkSpeed',
    bonusValue: 8,
    icon: '🐇',
  },
  {
    id: 'pet-6',
    name: 'Critter',
    bonusType: 'critical',
    bonusValue: 10,
    icon: '🎯',
  },
  {
    id: 'pet-7',
    name: 'Shadow',
    bonusType: 'dodge',
    bonusValue: 10,
    icon: '👻',
  },
  {
    id: 'pet-8',
    name: 'Fang',
    bonusType: 'attack',
    bonusValue: 12,
    icon: '🐺',
  },
  {
    id: 'pet-9',
    name: 'Aegis',
    bonusType: 'defense',
    bonusValue: 10,
    icon: '🏰',
  },
]

const HERO_CHEST_PRICES = {
  Mythic: 5,
  Astral: 15,
  Cosmic: 50,
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
  const [marketFilterRarity, setMarketFilterRarity] =
    useState<string>('Legendary')
  const [marketTab, setMarketTab] = useState<'buy' | 'sell' | 'chests'>('buy')
  const [cubeTab, setCubeTab] = useState<'synthesize' | 'recycle' | 'craft'>(
    'synthesize',
  )
  const [selectedCubeSlot, setSelectedCubeSlot] =
    useState<ItemSlot>('Main Hand')
  const [selectedRuneBranch, setSelectedRuneBranch] =
    useState<RuneBranch>('Power')
  const [selectedPet, setSelectedPet] = useState<string | null>(null)

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
    const totalXp = game.xp + (game.selectedHero?.xp ?? 0)
    const playerLevel = getLevelFromXp(totalXp)
    const prestigeCount = Math.floor(Math.max(0, playerLevel - 1) / 25)
    let rankData = PRESTIGE_RANKS[0]
    for (const rank of PRESTIGE_RANKS) {
      if (prestigeCount >= rank.requiredPrestige) {
        rankData = rank
      }
    }
    return { ...rankData, rank: rankData.rank }
  }, [game.xp, game.selectedHero])

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

  const handleBuyItem = (itemName: string) => {
    const allItems = ALL_ITEMS
    const item = allItems.find((i) => i.name === itemName)
    if (!item) return
    if (
      item.rarity === 'Common' ||
      item.rarity === 'Uncommon' ||
      item.rarity === 'Rare' ||
      item.rarity === 'Epic'
    ) {
      toast.error('Only Legendary+ items can be bought from the market')
      return
    }
    const price =
      RARITY_MULTIPLIERS[item.rarity as keyof typeof RARITY_MULTIPLIERS] * 10
    if (game.gold < price) {
      toast.error(`Need ${price.toLocaleString()} Gold to buy ${itemName}`)
      return
    }
    game.setGold(game.gold - price)
    const newItem = {
      id: `market-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: item.name,
      slot: item.slot,
      rarity: item.rarity,
      atk: item.atk,
      def: item.def,
      hp: item.hp,
      spd: item.spd,
      sockets: Array(
        SOCKET_LIMIT[item.rarity as keyof typeof SOCKET_LIMIT] || 0,
      )
        .fill(null)
        .map(() => ({
          gem: null as string | null,
          engraving: null as string | null,
        })),
    }
    game.setInventory([...inventory, newItem])
    toast.success(`Purchased ${itemName} for ${price.toLocaleString()} Gold`)
  }

  const handleSellItem = (itemId: string) => {
    const item = inventory.find((i) => i.id === itemId)
    if (!item) return
    if (
      item.rarity === 'Common' ||
      item.rarity === 'Uncommon' ||
      item.rarity === 'Rare' ||
      item.rarity === 'Epic'
    ) {
      toast.error('Only Legendary+ items can be sold')
      return
    }
    const price = Math.floor(
      RARITY_MULTIPLIERS[item.rarity as keyof typeof RARITY_MULTIPLIERS] * 10,
    )
    game.setGold(game.gold + price)
    game.setInventory(inventory.filter((i) => i.id !== itemId))
    toast.success(
      `Sold ${item.name || 'item'} for ${price.toLocaleString()} Gold`,
    )
  }

  const handleBuyChest = (tier: 'Mythic' | 'Astral' | 'Cosmic') => {
    const price = HERO_CHEST_PRICES[tier]
    if (game.robheroesBalance < price) {
      toast.error(`Need ${price} ROBH to buy a ${tier} Hero Chest`)
      return
    }
    game.setRobheroesBalance(game.robheroesBalance - price)
    const rarities: Record<string, string[]> = {
      Mythic: ['Legendary', 'Mythic'],
      Astral: ['Mythic', 'Astral'],
      Cosmic: ['Astral', 'Cosmic'],
    }
    const options = rarities[tier]
    const result = options[Math.floor(Math.random() * options.length)] as string
    const slot = SLOT_ORDER[Math.floor(Math.random() * SLOT_ORDER.length)]
    const newItem = {
      id: `chest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: `${tier} ${slot}`,
      slot: slot as ItemSlot,
      rarity: result as ItemRarity,
      atk: Math.floor(
        RARITY_MULTIPLIERS[result as keyof typeof RARITY_MULTIPLIERS] * 5,
      ),
      def: Math.floor(
        RARITY_MULTIPLIERS[result as keyof typeof RARITY_MULTIPLIERS] * 3,
      ),
      hp: Math.floor(
        RARITY_MULTIPLIERS[result as keyof typeof RARITY_MULTIPLIERS] * 10,
      ),
      spd: Math.floor(
        RARITY_MULTIPLIERS[result as keyof typeof RARITY_MULTIPLIERS] * 2,
      ),
      sockets: Array(SOCKET_LIMIT[result as keyof typeof SOCKET_LIMIT] || 0)
        .fill(null)
        .map(() => ({
          gem: null as string | null,
          engraving: null as string | null,
        })),
    }
    game.setInventory([...inventory, newItem])
    toast.success(`Opened ${tier} Hero Chest! Received: ${result} ${slot}`)
  }

  const handleSynthesize = () => {
    if (inventory.length < 9) {
      toast.error('Need at least 9 items to synthesize')
      return
    }
    const rarities = inventory.map((i) => i.rarity)
    const uniqueRarities = [...new Set(rarities)]
    if (uniqueRarities.length !== 1) {
      toast.error('All 9 items must be the same rarity')
      return
    }
    const currentRarity = uniqueRarities[0]
    const rarityOrder = [
      'Common',
      'Uncommon',
      'Rare',
      'Epic',
      'Legendary',
      'Mythic',
      'Astral',
      'Cosmic',
    ]
    const currentIdx = rarityOrder.indexOf(currentRarity)
    if (currentIdx >= rarityOrder.length - 1) {
      toast.error('Items are already at maximum rarity')
      return
    }
    const newRarity = rarityOrder[currentIdx + 1]
    const consumedItems = inventory.slice(0, 9)
    const remainingItems = inventory.slice(9)
    const newItem = {
      id: `synth-${Date.now()}`,
      name: `Upgraded ${selectedCubeSlot}`,
      slot: selectedCubeSlot,
      rarity: newRarity,
      atk: Math.floor(consumedItems[0].atk * 1.5),
      def: Math.floor(consumedItems[0].def * 1.5),
      hp: Math.floor(consumedItems[0].hp * 1.5),
      spd: Math.floor(consumedItems[0].spd * 1.5),
      sockets: Array(SOCKET_LIMIT[newRarity as keyof typeof SOCKET_LIMIT] || 0)
        .fill(null)
        .map(() => ({
          gem: null as string | null,
          engraving: null as string | null,
        })),
    }
    game.setInventory([...remainingItems, newItem])
    toast.success(`Synthesized! ${currentRarity} → ${newRarity}`)
  }

  const handleRecycle = () => {
    if (inventory.length < 9) {
      toast.error('Need at least 9 items to recycle')
      return
    }
    const consumedItems = inventory.slice(0, 9)
    const remainingItems = inventory.slice(9)
    const roll = Math.random()
    let reward: string
    if (roll < 0.65) {
      reward = 'equipment'
    } else if (roll < 0.8) {
      reward = 'material'
    } else if (roll < 0.93) {
      reward = 'gem'
    } else {
      reward = 'engraving'
    }
    const slot = SLOT_ORDER[Math.floor(Math.random() * SLOT_ORDER.length)]
    const rarities = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary']
    const rarity = rarities[Math.floor(Math.random() * rarities.length)]
    let rewardName = ''
    if (reward === 'equipment') {
      const found = ALL_ITEMS.find((i) => i.rarity === rarity) || ALL_ITEMS[0]
      rewardName = found.name
    } else if (reward === 'material') {
      rewardName =
        ALL_MATERIALS[Math.floor(Math.random() * ALL_MATERIALS.length)]
    } else if (reward === 'gem') {
      rewardName = GEM_TYPES[Math.floor(Math.random() * GEM_TYPES.length)]
    } else {
      rewardName =
        ENGRAVING_TYPES[Math.floor(Math.random() * ENGRAVING_TYPES.length)]
    }
    const newItem = {
      id: `recycle-${Date.now()}`,
      name: rewardName,
      slot: reward === 'equipment' ? slot : 'Bracer',
      rarity: reward === 'equipment' ? rarity : 'Common',
      atk: reward === 'equipment' ? Math.floor(Math.random() * 20) + 1 : 0,
      def: reward === 'equipment' ? Math.floor(Math.random() * 20) + 1 : 0,
      hp: reward === 'equipment' ? Math.floor(Math.random() * 30) + 1 : 0,
      spd: reward === 'equipment' ? Math.floor(Math.random() * 10) + 1 : 0,
      sockets: [],
    }
    game.setInventory([...remainingItems, newItem])
    toast.success(`Recycled 9 items! Received: ${rewardName}`)
  }

  const handleCraft = () => {
    const material = inventory.find((i) =>
      ALL_MATERIALS.includes(i.name as MaterialType),
    )
    if (!material) {
      toast.error('Need a material to craft')
      return
    }
    const recipe =
      CRAFTING_RECIPES[Math.floor(Math.random() * CRAFTING_RECIPES.length)]
    const newItem = {
      id: `craft-${Date.now()}`,
      name: recipe.name,
      slot: selectedCubeSlot,
      rarity: recipe.resultRarity,
      atk: Math.floor(Math.random() * 30) + 5,
      def: Math.floor(Math.random() * 20) + 2,
      hp: Math.floor(Math.random() * 20) + 5,
      spd: Math.floor(Math.random() * 10) + 1,
      sockets: Array(
        SOCKET_LIMIT[recipe.resultRarity as keyof typeof SOCKET_LIMIT] || 0,
      )
        .fill(null)
        .map(() => ({
          gem: null as string | null,
          engraving: null as string | null,
        })),
    }
    game.setInventory([
      ...inventory.filter((i) => i.id !== material.id),
      newItem,
    ])
    toast.success(`Crafted ${recipe.name} for ${selectedCubeSlot}!`)
  }

  const getMeltValue = (item: (typeof inventory)[0]) => {
    const mult =
      RARITY_MULTIPLIERS[item.rarity as keyof typeof RARITY_MULTIPLIERS] || 1
    return Math.floor((item.atk + item.def + item.hp + item.spd) * mult)
  }

  const handleMelt = (itemId: string) => {
    const item = inventory.find((i) => i.id === itemId)
    if (!item) return
    const value = getMeltValue(item)
    const material =
      ALL_MATERIALS[Math.floor(Math.random() * ALL_MATERIALS.length)]
    const materialItem = {
      id: `melt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: material,
      slot: 'Bracer' as ItemSlot,
      rarity: 'Common',
      atk: 0,
      def: 0,
      hp: 0,
      spd: 0,
      sockets: [] as { gem: string | null; engraving: string | null }[],
    }
    game.setGold(game.gold + value)
    game.setInventory([
      ...inventory.filter((i) => i.id !== itemId),
      materialItem,
    ])
    toast.success(
      `Melted ${item.name || 'item'} for ${value} Gold + ${material}`,
    )
  }

  const handleEquipPet = (petId: string) => {
    const pet = PET_DATA.find((p) => p.id === petId)
    if (!pet) return
    if (game.equippedPet?.id === petId) {
      game.setEquippedPet(null)
      toast.info(`Unequipped ${pet.name}`)
      return
    }
    game.setEquippedPet({ ...pet, equipped: true })
    toast.success(`Equipped ${pet.name}`)
  }

  const handleSpendRunePoint = (runeId: string) => {
    const rune = RUNES.find((r) => r.id === runeId)
    if (!rune) return
    if (game.runePoints < rune.cost) {
      toast.error('Not enough rune points')
      return
    }
    const maxTier = BRANCH_TIERS[rune.branch as RuneBranch]
    const existing = game.runes.find((r) => r.id === runeId)
    if (existing && existing.points >= maxTier) {
      toast.error('Rune is already at max level')
      return
    }
    if (existing) {
      game.setRunes(
        game.runes.map((r) =>
          r.id === runeId ? { ...r, points: r.points + 1 } : r,
        ),
      )
    } else {
      game.setRunes([
        ...game.runes,
        {
          id: rune.id,
          branch: rune.branch,
          name: rune.name,
          tier: rune.tier,
          points: 1,
        },
      ])
    }
    game.setRunePoints(game.runePoints - rune.cost)
    toast.success(`Spent ${rune.cost} rune points on ${rune.name}`)
  }

  const handleResetRunes = () => {
    game.setRunes([])
    game.setRunePoints(
      game.runePoints +
        game.runes.reduce((sum, r) => {
          const runeDef = RUNES.find((rd) => rd.id === r.id)
          return sum + (runeDef ? runeDef.cost * r.points : r.points)
        }, 0),
    )
    toast.info('Runes reset, points returned')
  }

  const renderMarket = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">Market</h2>
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        {[
          { id: 'buy', label: 'Buy' },
          { id: 'sell', label: 'Sell' },
          { id: 'chests', label: 'Hero Chests' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setMarketTab(t.id as typeof marketTab)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              marketTab === t.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {marketTab === 'buy' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Buy Legendary+ equipment with Gold
            </div>
            <select
              value={marketFilterRarity}
              onChange={(e) => setMarketFilterRarity(e.target.value)}
              className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-1 text-sm text-white"
            >
              <option value="all">All Legendary+</option>
              {['Legendary', 'Mythic', 'Astral', 'Cosmic'].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {ALL_ITEMS.filter(
              (i) =>
                i.rarity === 'Legendary' ||
                i.rarity === 'Mythic' ||
                i.rarity === 'Astral' ||
                i.rarity === 'Cosmic',
            )
              .filter(
                (i) =>
                  marketFilterRarity === 'all' ||
                  i.rarity === marketFilterRarity,
              )
              .map((item) => {
                const price = Math.floor(
                  RARITY_MULTIPLIERS[
                    item.rarity as keyof typeof RARITY_MULTIPLIERS
                  ] * 10,
                )
                const rarity = item.rarity as keyof typeof RARITY_COLORS
                return (
                  <div
                    key={item.name}
                    className={`rounded-xl border-2 p-3 ${RARITY_COLORS[rarity]} ${RARITY_BG[rarity]}`}
                  >
                    <div className="text-sm font-semibold">{item.name}</div>
                    <div className="mt-1 text-xs opacity-70">
                      {item.slot} - {item.rarity}
                    </div>
                    <div className="mt-2 space-y-0.5 text-xs opacity-80">
                      {item.atk > 0 && <div>ATK +{item.atk}</div>}
                      {item.def > 0 && <div>DEF +{item.def}</div>}
                      {item.hp > 0 && <div>HP +{item.hp}</div>}
                      {item.spd > 0 && <div>SPD +{item.spd}</div>}
                    </div>
                    <div className="mt-2 text-xs font-bold text-yellow-400">
                      {price.toLocaleString()} Gold
                    </div>
                    <button
                      onClick={() => handleBuyItem(item.name)}
                      disabled={game.gold < price}
                      className="mt-2 w-full rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-600"
                    >
                      Buy
                    </button>
                  </div>
                )
              })}
          </div>
        </div>
      )}
      {marketTab === 'sell' && (
        <div className="space-y-3">
          <div className="text-sm text-gray-400">
            Sell Legendary+ equipment for Gold
          </div>
          {inventory.filter(
            (i) =>
              i.rarity === 'Legendary' ||
              i.rarity === 'Mythic' ||
              i.rarity === 'Astral' ||
              i.rarity === 'Cosmic',
          ).length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No Legendary+ items to sell.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {inventory
                .filter(
                  (i) =>
                    i.rarity === 'Legendary' ||
                    i.rarity === 'Mythic' ||
                    i.rarity === 'Astral' ||
                    i.rarity === 'Cosmic',
                )
                .map((item) => {
                  const price = Math.floor(
                    RARITY_MULTIPLIERS[
                      item.rarity as keyof typeof RARITY_MULTIPLIERS
                    ] * 10,
                  )
                  const rarity = item.rarity as keyof typeof RARITY_COLORS
                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl border-2 p-3 ${RARITY_COLORS[rarity]} ${RARITY_BG[rarity]}`}
                    >
                      <div className="text-sm font-semibold">
                        {item.name || 'Item'}
                      </div>
                      <div className="mt-1 text-xs opacity-70">
                        {item.slot} - {item.rarity}
                      </div>
                      <div className="mt-2 text-xs font-bold text-yellow-400">
                        {price.toLocaleString()} Gold
                      </div>
                      <button
                        onClick={() => handleSellItem(item.id)}
                        className="mt-2 w-full rounded bg-red-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-red-500"
                      >
                        Sell
                      </button>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      )}
      {marketTab === 'chests' && (
        <div className="space-y-4">
          <div className="text-sm text-gray-400">
            Purchase Hero Chests with ROBHEROES tokens
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                tier: 'Mythic' as const,
                price: HERO_CHEST_PRICES.Mythic,
                drops: 'Legendary / Mythic',
              },
              {
                tier: 'Astral' as const,
                price: HERO_CHEST_PRICES.Astral,
                drops: 'Mythic / Astral',
              },
              {
                tier: 'Cosmic' as const,
                price: HERO_CHEST_PRICES.Cosmic,
                drops: 'Astral / Cosmic',
              },
            ].map(({ tier, price, drops }) => (
              <div
                key={tier}
                className="rounded-xl border border-gray-700 bg-gray-800/60 p-4"
              >
                <div className="text-lg font-bold text-white">{tier} Chest</div>
                <div className="mt-2 text-sm text-gray-400">
                  Cost: {price} ROBH
                </div>
                <div className="mt-1 text-xs text-gray-500">Drops: {drops}</div>
                <button
                  onClick={() => handleBuyChest(tier)}
                  disabled={game.robheroesBalance < price}
                  className="mt-3 w-full rounded bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-500 disabled:cursor-not-allowed disabled:bg-gray-600"
                >
                  Open Chest
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  const renderCube = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">Cube System</h2>
      <div className="flex gap-2 border-b border-gray-700 pb-2">
        {[
          { id: 'synthesize', label: 'Synthesize' },
          { id: 'recycle', label: 'Recycle' },
          { id: 'craft', label: 'Craft' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setCubeTab(t.id as typeof cubeTab)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              cubeTab === t.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {cubeTab === 'synthesize' && (
        <div className="space-y-4">
          <div className="text-sm text-gray-400">
            Combine 9 items of the same rarity to upgrade rarity
          </div>
          <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-4">
            <div className="mb-2 text-sm font-medium text-white">
              Inventory: {inventory.length} items
            </div>
            <div className="mb-3 text-xs text-gray-400">
              Need 9 items of the same rarity
            </div>
            <button
              onClick={handleSynthesize}
              disabled={inventory.length < 9}
              className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-600"
            >
              Synthesize (9 items)
            </button>
          </div>
        </div>
      )}
      {cubeTab === 'recycle' && (
        <div className="space-y-4">
          <div className="text-sm text-gray-400">
            Recycle 9 items for a random reward
          </div>
          <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-4">
            <div className="mb-2 text-sm font-medium text-white">
              Inventory: {inventory.length} items
            </div>
            <div className="mb-3 text-xs text-gray-400">
              Rewards: 65% Equipment, 15% Material, 13% Gem, 7% Engraving
            </div>
            <button
              onClick={handleRecycle}
              disabled={inventory.length < 9}
              className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-600"
            >
              Recycle (9 items)
            </button>
          </div>
        </div>
      )}
      {cubeTab === 'craft' && (
        <div className="space-y-4">
          <div className="text-sm text-gray-400">
            Craft equipment from materials
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={selectedCubeSlot}
              onChange={(e) => setSelectedCubeSlot(e.target.value as ItemSlot)}
              className="rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
            >
              {SLOT_ORDER.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-4">
            <div className="mb-2 text-sm font-medium text-white">
              Requires: 1 Material
            </div>
            <div className="mb-3 text-xs text-gray-400">
              Craft a random equipment for the selected slot
            </div>
            <button
              onClick={handleCraft}
              className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white transition-colors hover:bg-blue-500"
            >
              Craft
            </button>
          </div>
        </div>
      )}
    </div>
  )

  const renderMelt = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">Melt Panel</h2>
      <div className="text-sm text-gray-400">
        Decompose equipment into Gold + crafting materials based on rarity
      </div>
      {inventory.length === 0 ? (
        <div className="py-8 text-center text-gray-500">No items to melt.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {inventory.map((item) => {
            const value = getMeltValue(item)
            const rarity = item.rarity as keyof typeof RARITY_COLORS
            return (
              <div
                key={item.id}
                className={`rounded-xl border-2 p-3 ${RARITY_COLORS[rarity]} ${RARITY_BG[rarity]}`}
              >
                <div className="text-sm font-semibold">
                  {item.name || 'Item'}
                </div>
                <div className="mt-1 text-xs opacity-70">
                  {item.slot} - {item.rarity}
                </div>
                <div className="mt-2 text-xs font-bold text-yellow-400">
                  Melt Value: {value} Gold + Material
                </div>
                <button
                  onClick={() => handleMelt(item.id)}
                  className="mt-2 w-full rounded bg-red-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-red-500"
                >
                  Melt
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  const renderPets = () => (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white">Pets</h2>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {PET_DATA.map((pet) => {
          const isEquipped = game.equippedPet?.id === pet.id
          return (
            <div
              key={pet.id}
              onClick={() => setSelectedPet(isEquipped ? null : pet.id)}
              className={`cursor-pointer rounded-xl border-2 p-3 transition-all hover:scale-105 ${
                isEquipped
                  ? 'border-blue-500 bg-blue-900/30 ring-2 ring-white'
                  : 'border-gray-700 bg-gray-800/60 hover:border-gray-500'
              }`}
            >
              <div className="text-center text-2xl">{pet.icon}</div>
              <div className="mt-2 text-center text-sm font-semibold text-white">
                {pet.name}
              </div>
              <div className="mt-1 text-center text-xs text-gray-400 capitalize">
                {pet.bonusType} +{pet.bonusValue}
              </div>
              {isEquipped && (
                <div className="mt-2 text-center text-xs text-blue-400">
                  Equipped
                </div>
              )}
            </div>
          )
        })}
      </div>
      {selectedPet && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setSelectedPet(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-gray-700 bg-gray-900 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {(() => {
              const pet = PET_DATA.find((p) => p.id === selectedPet)
              if (!pet) return null
              const isEquipped = game.equippedPet?.id === pet.id
              return (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">{pet.name}</h3>
                    <button
                      onClick={() => setSelectedPet(null)}
                      className="text-2xl leading-none text-gray-400 hover:text-white"
                    >
                      &times;
                    </button>
                  </div>
                  <div className="text-center text-4xl">{pet.icon}</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-400">Bonus Type:</div>
                    <div className="text-white capitalize">
                      {pet.bonusType} +{pet.bonusValue}
                    </div>
                    <div className="text-gray-400">Status:</div>
                    <div className="text-white">
                      {isEquipped ? 'Equipped' : 'Not Equipped'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleEquipPet(pet.id)}
                    className={`w-full rounded-lg px-4 py-2 font-medium text-white transition-colors ${
                      isEquipped
                        ? 'bg-red-600 hover:bg-red-500'
                        : 'bg-blue-600 hover:bg-blue-500'
                    }`}
                  >
                    {isEquipped ? 'Unequip' : 'Equip'} {pet.name}
                  </button>
                </div>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )

  const renderRunes = () => {
    const branchRunes = RUNES.filter((r) => r.branch === selectedRuneBranch)
    const spentPoints = game.runes
      .filter((r) => r.branch === selectedRuneBranch)
      .reduce((sum, r) => sum + r.points, 0)
    const maxPoints = BRANCH_TIERS[selectedRuneBranch] * 5

    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Runes Tree</h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-400">
            Rune Points:{' '}
            <span className="font-bold text-purple-400">{game.runePoints}</span>
          </div>
          <div className="text-sm text-gray-400">
            Spent: {spentPoints} / {maxPoints}
          </div>
        </div>
        <div className="flex gap-2 border-b border-gray-700 pb-2">
          {RUNE_BRANCHES.map((branch) => (
            <button
              key={branch}
              onClick={() => setSelectedRuneBranch(branch)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                selectedRuneBranch === branch
                  ? `${RUNE_BRANCH_COLORS[branch]} border-2`
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-200'
              }`}
            >
              {branch}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {branchRunes.map((rune) => {
            const existing = game.runes.find((r) => r.id === rune.id)
            const currentPoints = existing?.points ?? 0
            const maxTier = BRANCH_TIERS[rune.branch as RuneBranch]
            const isMaxed = currentPoints >= maxTier
            return (
              <div
                key={rune.id}
                className={`rounded-xl border-2 p-3 ${RUNE_BRANCH_COLORS[selectedRuneBranch as RuneBranch]}`}
              >
                <div className="text-sm font-semibold text-white">
                  {rune.name}
                </div>
                <div className="mt-1 text-xs text-gray-300">
                  Tier {rune.tier} - {rune.stat} +{rune.value}
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  {rune.description}
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-xs text-gray-400">
                    Level: {currentPoints} / {maxTier}
                  </div>
                  <button
                    onClick={() => handleSpendRunePoint(rune.id)}
                    disabled={game.runePoints < rune.cost || isMaxed}
                    className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-600"
                  >
                    {isMaxed ? 'Maxed' : `Spend (${rune.cost})`}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
        {game.runes.length > 0 && (
          <button
            onClick={handleResetRunes}
            className="mt-4 rounded-lg bg-gray-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600"
          >
            Reset All Runes
          </button>
        )}
      </div>
    )
  }

  const renderProgression = () => {
    const xpForNext = XP_TABLE[totalLevel - 1]?.xpRequired ?? 100
    const xpCurrent = Math.min(
      game.xp + (game.selectedHero?.xp ?? 0),
      xpForNext,
    )
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Progression</h2>

        <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold text-white">
                Level {totalLevel}
              </div>
              <div className="text-sm text-gray-400">
                {game.selectedHero?.class ?? 'No Hero'}
              </div>
            </div>
            <div className="text-right text-sm text-gray-400">
              <div>
                XP: {xpCurrent} / {xpForNext}
              </div>
              <div>{xpProgress.toFixed(1)}% to next level</div>
            </div>
          </div>
          <div className="mt-3 h-4 w-full overflow-hidden rounded-full bg-gray-700">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
              style={{ width: `${Math.min(100, xpProgress)}%` }}
            />
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

        <div className="rounded-xl border border-gray-700 bg-gray-800/60 p-4">
          <div className="mb-3 text-sm text-gray-400">Unlocked Features</div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              { name: 'Market', unlocked: true },
              { name: 'Cube System', unlocked: true },
              { name: 'Melt Panel', unlocked: true },
              { name: 'Pets', unlocked: true },
              { name: 'Runes Tree', unlocked: true },
              { name: 'Battle Arena', unlocked: true },
              { name: 'Chest System', unlocked: true },
              { name: 'Token Gate', unlocked: true },
            ].map((feature) => (
              <div
                key={feature.name}
                className="flex items-center gap-2 text-white"
              >
                <span className="text-green-400">&#10003;</span>
                {feature.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
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
    { id: 'market', label: 'Market' },
    { id: 'cube', label: 'Cube' },
    { id: 'melt', label: 'Melt' },
    { id: 'pets', label: 'Pets' },
    { id: 'runes', label: 'Runes' },
    { id: 'progression', label: 'Progression' },
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
          {activeTab === 'market' && renderMarket()}
          {activeTab === 'cube' && renderCube()}
          {activeTab === 'melt' && renderMelt()}
          {activeTab === 'pets' && renderPets()}
          {activeTab === 'runes' && renderRunes()}
          {activeTab === 'progression' && renderProgression()}
        </main>
      </div>
    </div>
  )
}
