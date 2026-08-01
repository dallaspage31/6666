'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { toast } from 'sonner'
import { SLOT_ORDER, ItemSlot } from '@/lib/game-data/items'

type View =
  | 'home'
  | 'game'
  | 'market'
  | 'cube'
  | 'melt'
  | 'pets'
  | 'runes'
  | 'progression'
  | 'arena'
  | 'admin'

interface Hero {
  id: string
  class: string
  level: number
  xp: number
  hp: number
  atk: number
  def: number
  spd: number
}

interface InventoryItem {
  id: string
  name: string
  slot: string
  rarity: string
  atk: number
  def: number
  hp: number
  spd: number
  sockets: { gem: string | null; engraving: string | null }[]
}

interface GameState {
  currentView: View
  setCurrentView: (view: View) => void
  selectedHero: Hero | null
  setSelectedHero: (hero: Hero | null) => void
  gold: number
  setGold: (gold: number) => void
  xp: number
  setXp: (xp: number) => void
  inventory: InventoryItem[]
  setInventory: (items: InventoryItem[]) => void
  robheroesBalance: number
  setRobheroesBalance: (balance: number) => void
  equipped: Record<ItemSlot, InventoryItem | null>
  setEquipped: (slot: ItemSlot, item: InventoryItem | null) => void
  unequipAll: () => void
}

const STORAGE_KEY = 'solaria-save-balance-v4'

const DEFAULT_STATE: GameState = {
  currentView: 'home',
  setCurrentView: () => {},
  selectedHero: null,
  setSelectedHero: () => {},
  gold: 0,
  setGold: () => {},
  xp: 0,
  setXp: () => {},
  inventory: [],
  setInventory: () => {},
  robheroesBalance: 0,
  setRobheroesBalance: () => {},
  equipped: SLOT_ORDER.reduce(
    (acc, slot) => ({ ...acc, [slot]: null }),
    {} as Record<ItemSlot, InventoryItem | null>,
  ),
  setEquipped: () => {},
  unequipAll: () => {},
}

const GameContext = createContext<GameState>(DEFAULT_STATE)

function loadState(): Partial<GameState> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return {
      currentView: parsed.currentView ?? 'home',
      selectedHero: parsed.selectedHero ?? null,
      gold: parsed.gold ?? 0,
      xp: parsed.xp ?? 0,
      inventory: parsed.inventory ?? [],
      robheroesBalance: parsed.robheroesBalance ?? 0,
      equipped:
        parsed.equipped ??
        SLOT_ORDER.reduce(
          (acc, slot) => ({ ...acc, [slot]: null }),
          {} as Record<ItemSlot, InventoryItem | null>,
        ),
    }
  } catch {
    return {}
  }
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [currentView, setCurrentView] = useState<View>(
    () => loadState().currentView ?? 'home',
  )
  const [selectedHero, setSelectedHero] = useState<Hero | null>(
    () => loadState().selectedHero ?? null,
  )
  const [gold, setGold] = useState<number>(() => loadState().gold ?? 0)
  const [xp, setXp] = useState<number>(() => loadState().xp ?? 0)
  const [inventory, setInventory] = useState<InventoryItem[]>(
    () => loadState().inventory ?? [],
  )
  const [robheroesBalance, setRobheroesBalance] = useState<number>(
    () => loadState().robheroesBalance ?? 0,
  )
  const [equipped, setEquipped] = useState<
    Record<ItemSlot, InventoryItem | null>
  >(
    () =>
      loadState().equipped ??
      SLOT_ORDER.reduce(
        (acc, slot) => ({ ...acc, [slot]: null }),
        {} as Record<ItemSlot, InventoryItem | null>,
      ),
  )

  useEffect(() => {
    const stateToSave = {
      currentView,
      selectedHero,
      gold,
      xp,
      inventory,
      robheroesBalance,
      equipped,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
  }, [
    currentView,
    selectedHero,
    gold,
    xp,
    inventory,
    robheroesBalance,
    equipped,
  ])

  const setEquippedItem = useCallback(
    (slot: ItemSlot, item: InventoryItem | null) => {
      setEquipped((prev) => ({ ...prev, [slot]: item }))
    },
    [],
  )

  const unequipAll = useCallback(() => {
    setEquipped(
      SLOT_ORDER.reduce(
        (acc, slot) => ({ ...acc, [slot]: null }),
        {} as Record<ItemSlot, InventoryItem | null>,
      ),
    )
  }, [])

  const setGoldSafe = useCallback((val: number) => {
    setGold(val)
    toast.success(`Gold updated: ${val.toLocaleString()}`)
  }, [])

  const setXpSafe = useCallback((val: number) => {
    setXp(val)
    if (val >= 100) {
      toast.success('Level up! XP threshold reached.')
    }
  }, [])

  const value: GameState = {
    currentView,
    setCurrentView,
    selectedHero,
    setSelectedHero,
    gold,
    setGold: setGoldSafe,
    xp,
    setXp: setXpSafe,
    inventory,
    setInventory,
    robheroesBalance,
    setRobheroesBalance,
    equipped,
    setEquipped: setEquippedItem,
    unequipAll,
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGameContext(): GameState {
  const ctx = useContext(GameContext)
  return ctx
}
