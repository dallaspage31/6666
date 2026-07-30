'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'

type View = 'home' | 'game' | 'market' | 'cube' | 'melt' | 'pets' | 'runes' | 'progression' | 'arena' | 'admin'

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
    }
  } catch {
    return {}
  }
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [currentView, setCurrentView] = useState<View>(() => loadState().currentView ?? 'home')
  const [selectedHero, setSelectedHero] = useState<Hero | null>(() => loadState().selectedHero ?? null)
  const [gold, setGold] = useState<number>(() => loadState().gold ?? 0)
  const [xp, setXp] = useState<number>(() => loadState().xp ?? 0)
  const [inventory, setInventory] = useState<InventoryItem[]>(() => loadState().inventory ?? [])
  const [robheroesBalance, setRobheroesBalance] = useState<number>(() => loadState().robheroesBalance ?? 0)

  useEffect(() => {
    const stateToSave = {
      currentView,
      selectedHero,
      gold,
      xp,
      inventory,
      robheroesBalance,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
  }, [currentView, selectedHero, gold, xp, inventory, robheroesBalance])

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
  }

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGameContext(): GameState {
  const ctx = useContext(GameContext)
  return ctx
}