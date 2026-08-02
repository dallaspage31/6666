'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Phaser from 'phaser'
import {
  WAVE_CONFIGS,
  BOSS_CONFIGS,
  MAX_WAVE,
  DIFFICULTIES,
  getFrontierModifiers,
  type FrontierModifier,
  type BossConfig,
  type WaveConfig,
} from '../lib/combat-config'
import type {
  CombatPhase,
  CombatLogEntry,
  CombatResult,
  CombatRole,
  CombatElement,
} from '../lib/combat-types'
import { HERO_RARITY_CONFIGS, type HeroRarity } from '../lib/hero-rarity'
import {
  preloadGameAssets,
  playEntityAnim,
  getHeroTextureKey,
  getMonsterTextureKey,
  getPetTextureKey,
  getEffectKey,
  type EffectName,
} from '../lib/game-assets'
import { getSfxVolume, isSfxMuted, playSfx, setSfxMuted, setSfxVolume } from '../lib/sfx'
import { rollLoot } from '../lib/loot'
import {
  addGold,
  addItems,
  addXpToHero,
  allocateStatPoint,
  computeHeroStats,
  equipItem,
  loadMetaState,
  metaState,
  mintForgeTokens,
  saveMetaState,
  salvageBelowRarity,
  salvageItem,
  exportSave,
  importSave,
  type StatKey,
} from '../lib/progression'
import { generateItemIconDataUrl } from '../lib/sprite-gen'
import { getCampaignRegions } from '../lib/campaign'
import { getFrontierEncounter, type FrontierPolicy } from '../lib/frontier'
import { solveOfflineProgress, type OfflineSummary } from '../lib/offline'

const RARITY_BORDER_COLORS: Record<HeroRarity, string> = {
  Common: '#9ca3af',
  Uncommon: '#4ade80',
  Rare: '#60a5fa',
  Epic: '#c084fc',
  Legendary: '#fb923c',
  Cosmic: '#f0abfc',
}

interface CombatHero {
  id: string
  name: string
  role: CombatRole
  rarity: HeroRarity
  level: number
  hp: number
  maxHp: number
  atk: number
  def: number
  spd: number
  defending: boolean
  specialCooldown: number
  specialMaxCooldown: number
  ultimateCharge: number
  ultimateMaxCharge: number
  element: CombatElement
  buffs: Array<{ type: string; value: number; duration: number }>
  x: number
  y: number
  textureKey: string
  petKey: string
}

interface CombatMonster {
  id: string
  name: string
  wave: number
  isBoss: boolean
  hp: number
  maxHp: number
  atk: number
  def: number
  spd: number
  defending: boolean
  buffs: Array<{ type: string; value: number; duration: number }>
  x: number
  y: number
  textureKey: string
  element: CombatElement
}

interface CombatPet {
  id: string
  heroId: string
  key: string
  x: number
  y: number
}

interface BattleAction {
  combatantId: string
  kind: 'hero' | 'monster' | 'pet'
  action: 'attack' | 'special' | 'defend' | 'heal'
  targetId: string | null
  damage: number
  healing: number
  effect?: EffectName
  isUltimate?: boolean
  isCrit?: boolean
  tag?: 'WEAK!' | 'RESIST'
  targetIds?: string[]
}

interface ParallaxLayer {
  sprite: Phaser.GameObjects.TileSprite
  speed: number
}

interface HpBar {
  bg: Phaser.GameObjects.Image
  fill: Phaser.GameObjects.Image
}

export default function BattleGame() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const [overlay, setOverlay] = useState<{
    phase: CombatPhase
    wave: number
    turn: number
    aliveHeroes: number
    totalHeroes: number
    aliveMonsters: number
    totalMonsters: number
    result: CombatResult | null
    frontierModifiers: FrontierModifier[]
    frontierLabel: string
  } | null>(null)
  const [difficulty, setDifficulty] = useState('normal')
  const [speed, setSpeed] = useState(1)
  const [endless, setEndless] = useState(false)
  const [muted, setMuted] = useState(isSfxMuted())
  const [, setMetaVersion] = useState(0)
  const [metaTab, setMetaTab] = useState<'heroes' | 'inventory' | 'forge' | 'map' | 'settings'>('heroes')
  const [metaOpen, setMetaOpen] = useState(false)
  const [selectedHeroId, setSelectedHeroId] = useState('hero-Ironclad')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [saveCode, setSaveCode] = useState('')
  const [offlineSummary, setOfflineSummary] = useState<OfflineSummary | null>(null)
  const [selectedStage, setSelectedStage] = useState(1)
  const [selectedMode, setSelectedMode] = useState<'campaign' | 'frontier'>('campaign')

  const createGame = useCallback(() => {
    if (!containerRef.current || gameRef.current) return
    const container = containerRef.current
    const width = container.clientWidth || 800
    const height = container.clientHeight || 600

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width,
      height,
      parent: container,
      backgroundColor: '#0a0a1a',
      pixelArt: true,
      render: {
        antialias: false,
        pixelArt: true,
      },
      physics: {
        default: 'arcade',
        arcade: { debug: false },
      },
      scene: {
        init: initScene,
        preload: preloadScene,
        create: createScene,
        update: updateScene,
      },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    }

    const game = new Phaser.Game(config)
    gameRef.current = game

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true)
        gameRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    loadMetaState()
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches && !metaState.settings.reducedMotion) {
      metaState.settings.reducedMotion = true
    }
    setSfxMuted(metaState.settings.muted)
    setSfxVolume(metaState.settings.volume)
    setOfflineSummary(solveOfflineProgress())
    setMetaVersion((version) => version + 1)
    stateUpdateCallback = () => setOverlay(buildOverlay())
    const cleanup = createGame()
    return () => {
      stateUpdateCallback = null
      if (cleanup) cleanup()
    }
  }, [createGame])

  const refreshMeta = () => {
    saveMetaState()
    setMetaVersion((version) => version + 1)
  }

  const updateSetting = (update: Partial<typeof metaState.settings>) => {
    metaState.settings = { ...metaState.settings, ...update }
    setSfxMuted(metaState.settings.muted)
    setSfxVolume(metaState.settings.volume)
    saveMetaState()
    setMetaVersion((version) => version + 1)
  }

  const handleRestart = () => {
    difficultyKey = difficulty
    speedMultiplier = speed
    endlessMode = endless
    restartBattle()
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-gray-800 bg-black shadow-2xl">
      <div ref={containerRef} className="h-full w-full" />

      {overlay && (
        <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-lg border border-gray-800 bg-black/80 p-3 font-mono text-xs text-green-400 shadow-lg backdrop-blur-sm">
          <div className="font-bold text-cyan-300">
            {endlessMode && overlay.wave > MAX_WAVE
              ? overlay.frontierLabel
              : `Wave ${overlay.wave}/${MAX_WAVE}`}
          </div>
          <div>Turn: {overlay.turn}</div>
          <div>Phase: {overlay.phase}</div>
          <div>
            Heroes: {overlay.aliveHeroes}/{overlay.totalHeroes}
          </div>
          <div>
            Monsters: {overlay.aliveMonsters}/{overlay.totalMonsters}
          </div>
          {overlay.frontierModifiers.length > 0 && (
            <div className="mt-1 text-fuchsia-300">
              Modifiers: {overlay.frontierModifiers.join(' | ')}
            </div>
          )}
          {overlay.result && (
            <div className="mt-1 font-bold uppercase text-yellow-400">
              Result: {overlay.result}
            </div>
          )}
        </div>
      )}

      {offlineSummary && (
        <div role="dialog" aria-label="Offline progress summary" className="absolute inset-0 z-30 flex items-center justify-center bg-black/60">
          <div className="rounded-xl border border-cyan-700 bg-gray-900 p-5 text-sm text-gray-200 shadow-xl">
            <h2 className="text-lg font-bold text-cyan-300">While you were away</h2>
            <p className="mt-2">Frontier depth gained: +{offlineSummary.depthGained}</p>
            <p>Gold: +{offlineSummary.gold} · Essence: +{offlineSummary.essence}</p>
            <p>Items kept: {offlineSummary.itemsKept} · Safe depth: D{offlineSummary.stoppedAtDepth}</p>
            <button aria-label="Claim offline progress" onClick={() => setOfflineSummary(null)} className="mt-4 rounded bg-cyan-600 px-3 py-1.5 font-semibold text-black">Claim</button>
          </div>
        </div>
      )}

      <div className="absolute right-3 top-3 z-10 flex flex-col gap-2">
        <div className="rounded-lg border border-gray-800 bg-black/80 p-3 text-xs text-gray-200 shadow-lg backdrop-blur-sm">
          <label className="block font-semibold text-cyan-300">Difficulty</label>
          <select
            aria-label="Difficulty"
            className="mt-1 w-full rounded bg-gray-900 px-2 py-1 text-gray-100 outline-none ring-1 ring-gray-700"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="easy">Easy</option>
            <option value="normal">Normal</option>
            <option value="hard">Hard</option>
            <option value="nightmare">Nightmare</option>
          </select>

          <label className="mt-2 block font-semibold text-cyan-300">Speed</label>
          <input
            aria-label="Game speed"
            type="range"
            min={1}
            max={4}
            step={1}
            value={speed}
            onChange={(e) => setSpeed(Number(e.target.value))}
            className="mt-1 w-full accent-cyan-400"
          />
          <div className="text-right text-gray-400">x{speed}</div>

          <label className="mt-2 flex items-center gap-2 font-semibold text-cyan-300">
            <input
              aria-label="Enable endless frontier"
              type="checkbox"
              checked={endless}
              onChange={(e) => setEndless(e.target.checked)}
              className="accent-cyan-400"
            />
            Endless Frontier
          </label>
          <button
            aria-label="Toggle sound"
            onClick={() => {
              const next = !muted
              setMuted(next)
              setSfxMuted(next)
            }}
            className="mt-2 w-full rounded bg-gray-800 px-3 py-1.5 font-semibold text-gray-200 transition hover:bg-gray-700"
          >
            {muted ? 'Sound: Off' : 'Sound: On'}
          </button>

          <button
            aria-label="Restart battle"
            onClick={handleRestart}
            className="mt-3 w-full rounded bg-cyan-600 px-3 py-1.5 font-semibold text-black transition hover:bg-cyan-400"
          >
            Restart
          </button>
        </div>
      </div>

      <div className="pointer-events-auto absolute bottom-3 left-3 z-10 w-[min(440px,calc(100%-1.5rem))] rounded-lg border border-gray-800 bg-black/85 text-xs text-gray-200 shadow-lg backdrop-blur-sm">
        <button
          onClick={() => setMetaOpen((open) => !open)}
          className="flex w-full items-center justify-between px-3 py-2 font-semibold text-cyan-300"
        >
          <span>Progression &amp; Inventory</span>
          <span>{metaOpen ? '−' : '+'}</span>
        </button>
        {metaOpen && (
          <div className="border-t border-gray-800 p-3">
            <div className="mb-3 flex gap-1">
              {(['heroes', 'inventory', 'forge', 'map', 'settings'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setMetaTab(tab)}
                  className={`rounded px-2 py-1 capitalize ${metaTab === tab ? 'bg-cyan-600 text-black' : 'bg-gray-800 text-gray-300'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            {metaTab === 'heroes' && (
              <div className="max-h-56 space-y-2 overflow-y-auto">
                {Object.values(metaState.heroes).map((progression) => {
                  const heroName = progression.heroId.replace('hero-', '')
                  const heroParty = heroes.find((hero) => hero.id === progression.heroId)
                  const stats = computeHeroStats(progression.heroId, heroParty?.rarity ?? 'Common')
                  return (
                    <div key={progression.heroId} className="rounded border border-gray-700 p-2">
                      <button className="font-semibold text-yellow-300" onClick={() => setSelectedHeroId(progression.heroId)}>
                        {heroName} · Lv {progression.level}
                      </button>
                      <div className="mt-1 h-1.5 overflow-hidden rounded bg-gray-700">
                        <div className="h-full bg-green-400" style={{ width: `${Math.min(100, progression.currentXp / progression.xpToNext * 100)}%` }} />
                      </div>
                      <div className="mt-1 text-gray-400">XP {progression.currentXp}/{progression.xpToNext} · Points {progression.statPoints}</div>
                      <div className="flex gap-2 text-cyan-200">HP {stats.hp} · ATK {stats.atk} · DEF {stats.def} · SPD {stats.spd}</div>
                      <div className="mt-1 flex gap-1">
                        {(['hp', 'atk', 'def', 'spd'] as StatKey[]).map((stat) => (
                          <button key={stat} onClick={() => { if (allocateStatPoint(progression.heroId, stat)) refreshMeta() }} className="rounded bg-gray-800 px-1.5 py-0.5 text-[10px]">
                            +{stat}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {metaTab === 'inventory' && (
              <div>
                <div className="mb-2 text-gray-400">Selected hero: {selectedHeroId.replace('hero-', '')}</div>
                <div className="grid max-h-52 grid-cols-2 gap-2 overflow-y-auto">
                  {metaState.inventory.map((item) => (
                    <div
                      key={item.id}
                      className="rounded border p-2"
                      style={{ borderColor: RARITY_BORDER_COLORS[item.rarity] }}
                      title={`${item.name}\n${item.rarity} ${item.slot}\n${item.affixes.map((affix) => `${affix.label}: ${affix.value}`).join('\n')}\nSockets: ${item.socketedRunes.filter(Boolean).length}/${item.sockets}`}
                    >
                      <div className="flex items-center gap-2">
                        <img
                          alt=""
                          className="h-8 w-8"
                          src={item.iconDataUrl ?? (typeof document !== 'undefined' ? generateItemIconDataUrl(document, item.slot, item.rarity, item.element === 'fire' ? '#ff8855' : '#66ddff') : '')}
                        />
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-yellow-300">{item.name}</div>
                          <div className="text-gray-400">{item.rarity} · {item.slot}</div>
                        </div>
                      </div>
                      <div className="mt-1 text-gray-300">+{item.baseStats.hp} HP · +{item.baseStats.atk} ATK · +{item.baseStats.def} DEF · +{item.baseStats.spd} SPD</div>
                      <div className="mt-1 flex gap-1">
                        <button onClick={() => { if (equipItem(item.id, selectedHeroId)) refreshMeta() }} className="rounded bg-cyan-700 px-1.5 py-0.5">Equip</button>
                        <button onClick={() => { salvageItem(item.id); refreshMeta() }} className="rounded bg-red-900 px-1.5 py-0.5">Salvage</button>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={() => { salvageBelowRarity('Rare'); refreshMeta() }} className="mt-2 rounded bg-gray-800 px-2 py-1 text-gray-300">Salvage below Rare</button>
              </div>
            )}
            {metaTab === 'forge' && (
              <div className="space-y-2">
                <div className="flex justify-between"><span>Gold</span><span className="text-yellow-300">{metaState.gold}</span></div>
                <div className="flex justify-between"><span>Forge Tokens</span><span className="text-fuchsia-300">{metaState.forgeTokens}</span></div>
                <div className="flex justify-between"><span>Essence</span><span className="text-cyan-300">{metaState.essence}</span></div>
                <div className="text-gray-400">Mint ratio: 10,000 gold = 1 token · remainder {metaState.forgeRemainder}</div>
                <button onClick={() => { mintForgeTokens(); refreshMeta() }} className="rounded bg-fuchsia-700 px-2 py-1">Mint Forge Tokens</button>
              </div>
            )}
            {metaTab === 'map' && (
              <div role="region" aria-label="Campaign map" className="max-h-56 overflow-y-auto">
                <div className="mb-2 flex gap-2">
                  <button aria-label="Campaign mode" onClick={() => setSelectedMode('campaign')} className={`rounded px-2 py-1 ${selectedMode === 'campaign' ? 'bg-cyan-600 text-black' : 'bg-gray-800'}`}>Campaign</button>
                  <button aria-label="Frontier mode" onClick={() => setSelectedMode('frontier')} className={`rounded px-2 py-1 ${selectedMode === 'frontier' ? 'bg-fuchsia-600 text-black' : 'bg-gray-800'}`}>Frontier</button>
                </div>
                {selectedMode === 'campaign' ? getCampaignRegions().map((region) => (
                  <div key={region.id} className="mb-2">
                    <div className="font-semibold text-cyan-300">{region.name} · {region.biome}</div>
                    <div className="flex flex-wrap gap-1">
                      {region.stages.map((stage) => {
                        const unlocked = stage.id <= metaState.campaign.highestUnlockedStage
                        const complete = metaState.campaign.completedStages.includes(stage.id)
                        return <button key={stage.id} disabled={!unlocked} aria-label={`${stage.name}${unlocked ? '' : ' locked'}`} onClick={() => { setSelectedStage(stage.id); selectedCampaignStage = stage.id }} className={`rounded px-1.5 py-0.5 ${complete ? 'bg-green-700' : unlocked ? 'bg-gray-700' : 'bg-gray-900 text-gray-600'}`}>{stage.stage}</button>
                      })}
                    </div>
                  </div>
                )) : (
                  <div className="space-y-1">
                    <div className="font-semibold text-fuchsia-300">Frontier</div>
                    <div>Unlock: {metaState.campaign.campaignCompleted ? 'Campaign complete' : 'Complete all campaign stages'}</div>
                    <div>Best depth: D{metaState.frontier.bestDepth} · Checkpoint: D{Math.floor(metaState.frontier.bestDepth / 10) * 10}</div>
                    <div>Seed: {metaState.frontier.runSeed}</div>
                    <select aria-label="Frontier policy" value={metaState.frontier.policy} onChange={(event) => { metaState.frontier.policy = event.target.value as FrontierPolicy; refreshMeta() }} className="rounded bg-gray-900 px-2 py-1">
                      <option value="push">Push</option><option value="farm">Farm</option><option value="safePush">Safe Push</option><option value="greedy">Greedy</option>
                    </select>
                    <button aria-label="Start frontier" disabled={!metaState.campaign.campaignCompleted} onClick={() => { endlessMode = true; restartBattle() }} className="ml-2 rounded bg-fuchsia-700 px-2 py-1">Start / Resume</button>
                    <button aria-label="Leave frontier" onClick={() => { endlessMode = false }} className="ml-1 rounded bg-gray-700 px-2 py-1">Leave</button>
                  </div>
                )}
                {selectedMode === 'campaign' && <button aria-label="Start selected campaign stage" onClick={() => { selectedCampaignStage = selectedStage; endlessMode = false; restartBattle() }} className="rounded bg-cyan-700 px-2 py-1">Start Stage {selectedStage}</button>}
              </div>
            )}
            {metaTab === 'settings' && (
              <div role="region" aria-label="Settings" className="space-y-2">
                <label className="flex items-center justify-between gap-2">Volume
                  <input aria-label="Master volume" type="range" min={0} max={1} step={0.05} value={metaState.settings.volume} onChange={(event) => updateSetting({ volume: Number(event.target.value) })} />
                </label>
                <label className="flex items-center gap-2"><input aria-label="Mute audio" type="checkbox" checked={metaState.settings.muted} onChange={(event) => updateSetting({ muted: event.target.checked })} />Mute</label>
                <label className="flex items-center gap-2"><input aria-label="Reduced motion" type="checkbox" checked={metaState.settings.reducedMotion} onChange={(event) => { reducedMotion = event.target.checked; updateSetting({ reducedMotion: event.target.checked }) }} />Reduced motion</label>
                <label className="flex items-center gap-2"><input aria-label="Auto mint" type="checkbox" checked={metaState.settings.autoMint} onChange={(event) => updateSetting({ autoMint: event.target.checked })} />Auto-mint</label>
                <label className="block">Salvage below
                  <select aria-label="Salvage filter" value={metaState.settings.salvageBelow} onChange={(event) => updateSetting({ salvageBelow: event.target.value as HeroRarity })} className="ml-2 rounded bg-gray-900 px-2 py-1">
                    {(['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Cosmic'] as HeroRarity[]).map((rarity) => <option key={rarity}>{rarity}</option>)}
                  </select>
                </label>
                <textarea aria-label="Save export or import code" value={saveCode} onChange={(event) => setSaveCode(event.target.value)} placeholder="Paste save code here" className="h-16 w-full rounded bg-gray-900 p-1" />
                <div className="flex gap-1"><button aria-label="Export save" onClick={() => setSaveCode(exportSave())} className="rounded bg-gray-700 px-2 py-1">Export</button><button aria-label="Import save" onClick={() => { if (importSave(saveCode)) refreshMeta() }} className="rounded bg-cyan-700 px-2 py-1">Import</button></div>
              </div>
            )}
          </div>
        )}
      </div>

      {overlay?.result && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/70">
          <div className="rounded-2xl border border-gray-700 bg-gray-900 p-8 text-center shadow-2xl">
            <h2
              className={`text-3xl font-extrabold ${
                overlay.result === 'victory' ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {overlay.result === 'victory' ? 'Victory!' : 'Defeat'}
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              {overlay.result === 'victory'
                ? `Conquered ${overlay.wave} waves on ${difficulty} difficulty`
                : 'Your party fell in battle.'}
            </p>
            <button
              onClick={handleRestart}
              className="mt-5 rounded-lg bg-cyan-500 px-6 py-2 font-semibold text-gray-950 transition hover:bg-cyan-400"
            >
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function buildOverlay() {
  const frontier = endlessMode && currentWave > MAX_WAVE ? getFrontierEncounter(metaState.frontier.runSeed, currentWave - MAX_WAVE) : null
  return {
    phase: battlePhase,
    wave: currentWave,
    turn: turnNumber,
    aliveHeroes: heroes.filter((h) => h.hp > 0).length,
    totalHeroes: heroes.length,
    aliveMonsters: monsters.filter((m) => m.hp > 0).length,
    totalMonsters: monsters.length,
    result: battleResult,
    frontierModifiers: endlessMode && currentWave > MAX_WAVE ? frontierEncounter.modifiers : getFrontierModifiers(currentWave),
    frontierLabel: frontier ? `Frontier D${frontier.depth} · ${frontier.biome} · ${frontier.template} · ${frontier.modifiers.join(', ')}` : '',
  }
}

let sceneRef: Phaser.Scene | null = null
let battlePhase: CombatPhase = 'wave-intro'
let currentWave = 0
let turnNumber = 0
let heroes: CombatHero[] = []
let monsters: CombatMonster[] = []
let pets: CombatPet[] = []
let battleLog: CombatLogEntry[] = []
let battleResult: CombatResult | null = null
let parallaxLayers: ParallaxLayer[] = []
let heroSprites = new Map<string, Phaser.GameObjects.Sprite>()
let monsterSprites = new Map<string, Phaser.GameObjects.Sprite>()
let petSprites = new Map<string, Phaser.GameObjects.Sprite>()
let hpBars = new Map<string, HpBar>()
let logText: Phaser.GameObjects.Text | null = null
let stateUpdateCallback: (() => void) | null = null
let difficultyKey = 'normal'
let speedMultiplier = 1
let endlessMode = false
let hitStop = false
let selectedCampaignStage = 1
let frontierEncounter = getFrontierEncounter('run-1', 1)
let reducedMotion = false

function initScene(this: Phaser.Scene) {
  sceneRef = this
  resetGameState()
}

function resetGameState() {
  heroes = []
  monsters = []
  pets = []
  battleLog = []
  battleResult = null
  currentWave = 0
  turnNumber = 0
  battlePhase = 'wave-intro'
  heroSprites = new Map()
  monsterSprites = new Map()
  petSprites = new Map()
  hpBars = new Map()
  parallaxLayers = []
  hitStop = false
  reducedMotion = metaState.settings.reducedMotion
}

function preloadScene(this: Phaser.Scene) {
  preloadGameAssets(this)
}

function createScene(this: Phaser.Scene) {
  const w = this.cameras.main.width
  const h = this.cameras.main.height

  createBackground(this, w, h)
  createGround(this, w, h)
  createUI(this)
  spawnHeroParty(this)
  positionCombatants(this, w, h)
  startWaveIntro()
}

function createBackground(scene: Phaser.Scene, width: number, height: number) {
  const sky = scene.add.tileSprite(width / 2, height / 2, width, height, 'bg-sky')
  sky.setScrollFactor(0)
  sky.setDepth(-10)

  const mountains = scene.add.tileSprite(
    width / 2,
    height * 0.65,
    width,
    height,
    'bg-mountains'
  )
  mountains.setScrollFactor(0)
  mountains.setDepth(-5)

  const ground = scene.add.tileSprite(
    width / 2,
    height - 32,
    width,
    64,
    'bg-ground'
  )
  ground.setScrollFactor(0)
  ground.setDepth(-1)

  parallaxLayers = [
    { sprite: sky, speed: 0.05 },
    { sprite: mountains, speed: 0.2 },
    { sprite: ground, speed: 0.5 },
  ]
}

function createGround(scene: Phaser.Scene, width: number, height: number) {
  const battleLine = scene.add.rectangle(width / 2, height * 0.78, width, 2, 0x33aa88, 0.4)
  battleLine.setScrollFactor(0)
  battleLine.setDepth(-1)
}

function createUI(scene: Phaser.Scene) {
  logText = scene.add.text(16, 16, '', {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#00ff88',
    backgroundColor: '#000000cc',
    padding: { x: 8, y: 4 },
    wordWrap: { width: 320 },
  })
  logText.setScrollFactor(0)
  logText.setDepth(100)
  logText.setAlpha(0.9)
}

function spawnHeroParty(scene: Phaser.Scene) {
  const party: Array<{ name: string; role: CombatRole; rarity: HeroRarity; level: number }> = [
    { name: 'Ironclad', role: 'tank', rarity: 'Common', level: 1 },
    { name: 'Blazefang', role: 'damage', rarity: 'Rare', level: 1 },
    { name: 'Windsong', role: 'support', rarity: 'Uncommon', level: 1 },
    { name: 'Frostweaver', role: 'controller', rarity: 'Epic', level: 1 },
    { name: 'Longshot', role: 'damage', rarity: 'Legendary', level: 1 },
  ]

  heroes = party.map((p, i) => createHero(p.name, p.role, p.rarity, p.level, i))
  updateSprites(scene)
}

function createHero(
  name: string,
  role: CombatRole,
  rarity: HeroRarity,
  level: number,
  index: number
): CombatHero {
  const config = HERO_RARITY_CONFIGS[rarity]
  const textureKey = getHeroTextureKey(name)
  const progression = metaState.heroes[`hero-${name}`]
  const effectiveLevel = progression?.level ?? level
  const stats = computeHeroStats(`hero-${name}`, rarity)
  return {
    id: `hero-${name}`,
    name,
    role,
    rarity,
    level: effectiveLevel,
    hp: stats.hp,
    maxHp: stats.hp,
    atk: stats.atk,
    def: stats.def,
    spd: stats.spd,
    defending: false,
    specialCooldown: 0,
    specialMaxCooldown: 3,
    ultimateCharge: 0,
    ultimateMaxCharge: 5,
    element: getHeroElement(name),
    buffs: [],
    x: 0,
    y: 0,
    textureKey,
    petKey: getPetTextureKey(index),
  }
}

function getHeroElement(name: string): CombatElement {
  if (name === 'Blazefang') return 'shadow'
  if (name === 'Windsong') return 'holy'
  if (name === 'Frostweaver') return 'fire'
  return 'physical'
}

function getMonsterElement(monsterId: string): CombatElement {
  if (monsterId.includes('mage')) return 'fire'
  if (monsterId.includes('shadow')) return 'shadow'
  if (monsterId.includes('healer')) return 'holy'
  if (monsterId.includes('scout')) return 'nature'
  if (monsterId.includes('brute')) return 'ice'
  return 'physical'
}

function createMonster(wave: number, monsterId: string, isBoss: boolean): CombatMonster {
  const diff = DIFFICULTIES[difficultyKey] ?? DIFFICULTIES.normal
  const effectiveWave = getEffectiveWave(wave)
  const waveConfig = WAVE_CONFIGS.find((w) => w.waveNumber === effectiveWave)
  const hpScale = waveConfig?.hpScale ?? 1.0
  const atkScale = waveConfig?.atkScale ?? 1.0
  const baseHp = 60 + effectiveWave * 20
  const baseAtk = 5 + effectiveWave * 2
  const baseDef = 2 + effectiveWave * 1

  const bossConfig = BOSS_CONFIGS[effectiveWave]
  const bossMult = isBoss && bossConfig ? Math.max(bossConfig.hpMultiplier, bossConfig.atkMultiplier) : 1.0

  const endlessMult = getEndlessMultiplier(wave)
  const modifiers = wave > MAX_WAVE && endlessMode ? frontierEncounter.modifiers : getFrontierModifiers(wave)
  const frenzied = modifiers.includes('Frenzied')
  const armored = modifiers.includes('Armored')
  const storm = modifiers.includes('ElementalStorm')
  const element = storm
    ? (['fire', 'ice', 'nature', 'shadow', 'holy'] as CombatElement[])[wave % 5]
    : getMonsterElement(monsterId)

  return {
    id: `monster-${monsterId}-${wave}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    name: isBoss ? monsterId.toUpperCase() : monsterId,
    wave,
    isBoss,
    hp: Math.floor(baseHp * hpScale * bossMult * diff.hpMultiplier * endlessMult),
    maxHp: Math.floor(baseHp * hpScale * bossMult * diff.hpMultiplier * endlessMult),
    atk: Math.floor(baseAtk * atkScale * (isBoss && bossConfig ? bossConfig.atkMultiplier : 1) * diff.atkMultiplier * endlessMult * (frenzied ? 1.35 : 1)),
    def: Math.floor(baseDef * (isBoss && bossConfig ? bossConfig.defMultiplier : 1) * diff.defMultiplier * endlessMult * (armored ? 1.45 : frenzied ? 0.75 : 1)),
    spd: Math.max(1, 3 + effectiveWave - (isBoss ? 0 : 1)),
    defending: false,
    buffs: [],
    x: 0,
    y: 0,
    textureKey: getMonsterTextureKey(monsterId),
    element,
  }
}

function getEffectiveWave(wave: number): number {
  if (wave <= MAX_WAVE) return wave
  return ((wave - 1) % MAX_WAVE) + 1
}

function getEndlessMultiplier(wave: number): number {
  if (wave <= MAX_WAVE) return 1
  const cycles = Math.floor((wave - 1) / MAX_WAVE)
  return 1 + cycles * 0.15
}

function positionCombatants(scene: Phaser.Scene, width: number, height: number) {
  const heroLaneY = height * 0.68
  const monsterLaneY = height * 0.68
  const heroSpacing = width * 0.12
  const monsterSpacing = Math.min(width * 0.09, 64)

  heroes.forEach((hero, i) => {
    hero.x = width * 0.18 + i * heroSpacing
    hero.y = heroLaneY + (i % 2 === 0 ? 0 : 20)
  })

  monsters.forEach((monster, i) => {
    monster.x = width * 0.72 + (i % 6) * monsterSpacing
    monster.y = monsterLaneY + Math.floor(i / 6) * 42
  })
}

function startWaveIntro() {
  if (battleResult) return
  currentWave++
  battlePhase = 'wave-intro'
  turnNumber++

  const effectiveWave = getEffectiveWave(currentWave)
  if (endlessMode && currentWave > MAX_WAVE) frontierEncounter = getFrontierEncounter(metaState.frontier.runSeed, currentWave - MAX_WAVE)
  const bossConfig = BOSS_CONFIGS[effectiveWave]
  const campaignStage = !endlessMode && selectedCampaignStage > MAX_WAVE ? getCampaignRegions().flatMap((region) => region.stages).find((stage) => stage.id === selectedCampaignStage) : undefined
  const waveConfig = WAVE_CONFIGS.find((w) => w.waveNumber === effectiveWave)

  const label = endlessMode && currentWave > MAX_WAVE
    ? `Frontier D${frontierEncounter.depth} · ${frontierEncounter.biome} · ${frontierEncounter.template} · ${frontierEncounter.modifiers.join(', ')}`
    : `Wave ${currentWave}/${MAX_WAVE}`

  if (bossConfig) {
    addLog(`${label} — BOSS: ${bossConfig.monsterId.toUpperCase()}!`, 'wave-start')
  } else if (waveConfig) {
    addLog(`${label} — ${waveConfig.monsterCount} enemies approach`, 'wave-start')
  } else {
    addLog(`${label}`, 'wave-start')
  }
  playSfx('wave-start')

  if (sceneRef) {
    const modifiers = getFrontierModifiers(currentWave)
    const tint = modifiers.includes('Darkness') ? 0x555577 : modifiers.includes('ElementalStorm') ? 0x6644aa : 0xffffff
    sceneRef.children.list.filter((child): child is Phaser.GameObjects.TileSprite => child instanceof Phaser.GameObjects.TileSprite).forEach((layer) => layer.setTint(tint))
    if (campaignStage) {
      monsters = campaignStage.monsterIds.map((monsterId) => createMonster(currentWave, monsterId, false))
    } else {
      spawnWaveMonsters(currentWave > MAX_WAVE && endlessMode ? undefined : waveConfig, currentWave > MAX_WAVE && endlessMode ? undefined : bossConfig)
    }
    positionCombatants(sceneRef, sceneRef.cameras.main.width, sceneRef.cameras.main.height)
    updateSprites(sceneRef)
    updateHpBars(sceneRef)
    notifyStateUpdate()
  }

  scheduleNextTurn()
}

function spawnWaveMonsters(waveConfig?: WaveConfig, bossConfig?: BossConfig) {
  monsters = []

  if (endlessMode && currentWave > MAX_WAVE) {
    frontierEncounter = getFrontierEncounter(metaState.frontier.runSeed, currentWave - MAX_WAVE)
    frontierEncounter.monsterIds.forEach((mid) => monsters.push(createMonster(currentWave, mid, false)))
    if (frontierEncounter.checkpoint) monsters.push(createMonster(currentWave, 'boss-warden', true))
    return
  }
  if (bossConfig) {
    monsters.push(createMonster(currentWave, bossConfig.monsterId, true))
  } else if (waveConfig) {
    waveConfig.monsterIds.forEach((mid) => {
      monsters.push(createMonster(currentWave, mid, false))
    })
  }
}

function updateSprites(scene: Phaser.Scene) {
  heroSprites.forEach((sprite) => sprite.destroy())
  heroSprites.clear()
  petSprites.forEach((sprite) => sprite.destroy())
  petSprites.clear()
  hpBars.forEach((bar) => {
    bar.bg.destroy()
    bar.fill.destroy()
  })
  hpBars.clear()

  heroes.forEach((hero) => {
    const sprite = scene.add.sprite(hero.x, hero.y, hero.textureKey)
    sprite.setDepth(hero.y)
    sprite.setDisplaySize(64, 64)
    sprite.setFlipX(false)
    playEntityAnim(sprite, hero.textureKey, 'idle')
    heroSprites.set(hero.id, sprite)

    const pet = pets.find((p) => p.heroId === hero.id) ?? createPetForHero(hero)
    const petSprite = scene.add.sprite(hero.x - 38, hero.y + 6, pet.key)
    petSprite.setDisplaySize(32, 32)
    petSprite.setDepth(hero.y - 1)
    playEntityAnim(petSprite, pet.key, 'idle')
    petSprites.set(hero.id, petSprite)

    createOrUpdateHpBar(scene, hero.id, hero.x, hero.y - 48, hero.hp, hero.maxHp)
  })

  // monsters
  monsterSprites.forEach((sprite) => {
    if (sprite.active) sprite.destroy()
  })
  monsterSprites.clear()

  monsters.forEach((monster) => {
    const sprite = scene.add.sprite(monster.x, monster.y, monster.textureKey)
    sprite.setDepth(monster.y)
    const size = monster.isBoss ? 96 : 52
    sprite.setDisplaySize(size, size)
    sprite.setFlipX(true)
    if (monster.element === 'fire') sprite.setTint(0xff8866)
    if (monster.element === 'ice') sprite.setTint(0x88ccff)
    if (monster.element === 'shadow') sprite.setTint(0xaa66cc)
    if (monster.element === 'holy') sprite.setTint(0xffffaa)
    playEntityAnim(sprite, monster.textureKey, 'idle')
    monsterSprites.set(monster.id, sprite)

    createOrUpdateHpBar(scene, monster.id, monster.x, monster.y - (monster.isBoss ? 60 : 36), monster.hp, monster.maxHp)
  })
}

function createPetForHero(hero: CombatHero): CombatPet {
  const pet: CombatPet = {
    id: `pet-${hero.id}`,
    heroId: hero.id,
    key: hero.petKey,
    x: hero.x - 38,
    y: hero.y + 6,
  }
  pets.push(pet)
  return pet
}

function createOrUpdateHpBar(
  scene: Phaser.Scene,
  id: string,
  x: number,
  y: number,
  hp: number,
  maxHp: number
) {
  let bar = hpBars.get(id)
  if (!bar || !bar.bg.active) {
    if (bar) {
      bar.bg.destroy()
      bar.fill.destroy()
    }
    const bg = scene.add.image(x - 32, y, 'ui-hp-bg')
    bg.setOrigin(0, 0.5)
    bg.setScrollFactor(0)
    bg.setDepth(200)
    bg.setDisplaySize(64, 8)

    const fill = scene.add.image(x - 32, y, 'ui-hp-fill')
    fill.setOrigin(0, 0.5)
    fill.setScrollFactor(0)
    fill.setDepth(201)
    fill.setDisplaySize(64, 8)

    bar = { bg, fill }
    hpBars.set(id, bar)
  }

  bar.bg.setPosition(x - 32, y)
  bar.fill.setPosition(x - 32, y)
  const ratio = Math.max(0, Math.min(1, hp / maxHp))
  bar.fill.setDisplaySize(64 * ratio, 8)

  if (hp <= 0) {
    bar.bg.setVisible(false)
    bar.fill.setVisible(false)
  } else {
    bar.bg.setVisible(true)
    bar.fill.setVisible(true)
  }
}

function updateHpBars(scene: Phaser.Scene) {
  heroes.forEach((hero) => createOrUpdateHpBar(scene, hero.id, hero.x, hero.y - 48, hero.hp, hero.maxHp))
  monsters.forEach((monster) =>
    createOrUpdateHpBar(
      scene,
      monster.id,
      monster.x,
      monster.y - (monster.isBoss ? 60 : 36),
      monster.hp,
      monster.maxHp
    )
  )
}

function scheduleNextTurn() {
  if (battleResult) return

  const baseDelay = 900
  const delay = Math.max(150, baseDelay / speedMultiplier) + (hitStop ? 80 : 0)
  hitStop = false
  setTimeout(() => {
    switch (battlePhase) {
      case 'wave-intro':
      case 'boss-intro':
        transitionToActive()
        break
      case 'wave-complete':
        handleWaveComplete()
        break
      case 'active':
      case 'boss-active':
        processAutoTurn()
        break
      case 'complete':
      default:
        break
    }
  }, delay)
}

function transitionToActive() {
  battlePhase = currentBoss() ? 'boss-active' : 'active'
  notifyStateUpdate()
  scheduleNextTurn()
}

function currentBoss(): boolean {
  const effectiveWave = getEffectiveWave(currentWave)
  return !!BOSS_CONFIGS[effectiveWave]
}

function processAutoTurn() {
  if (battleResult) return

  const aliveHeroes = heroes.filter((h) => h.hp > 0)
  const aliveMonsters = monsters.filter((m) => m.hp > 0)

  if (aliveHeroes.length === 0) {
    endBattle('defeat')
    return
  }

  if (aliveMonsters.length === 0) {
    endWave()
    return
  }

  turnNumber++

  aliveHeroes.sort((a, b) => b.spd - a.spd)
  aliveMonsters.sort((a, b) => b.spd - a.spd)

  const actions: BattleAction[] = []

  aliveHeroes.forEach((hero) => {
    const action = determineHeroAction(hero, aliveMonsters)
    actions.push(...expandActionTargets(action, aliveMonsters))
    const petAction = determinePetAction(hero, action.targetId, aliveMonsters)
    if (petAction) actions.push(petAction)
  })

  aliveMonsters.forEach((monster) => {
    actions.push(determineMonsterAction(monster, aliveHeroes))
  })

  applyActions(actions)
  processBuffs()
  checkBattleEnd()
  notifyStateUpdate()
  scheduleNextTurn()
}

function expandActionTargets(action: BattleAction, targets: CombatMonster[]): BattleAction[] {
  if (!action.targetIds || action.targetIds.length < 2) return [action]
  return action.targetIds.map((targetId) => ({ ...action, targetId, targetIds: undefined }))
}

function getElementMultiplier(source: CombatElement, target: CombatElement): number {
  if (source === 'physical' || target === 'physical') return 1
  if ((source === 'fire' && target === 'nature') || (source === 'nature' && target === 'ice') || (source === 'ice' && target === 'fire') || (source === 'holy' && target === 'shadow') || (source === 'shadow' && target === 'holy')) return 1.5
  if ((source === 'nature' && target === 'fire') || (source === 'ice' && target === 'nature') || (source === 'fire' && target === 'ice')) return 0.66
  return 1
}

function computeDamage(source: CombatElement, target: CombatElement, base: number): { damage: number; tag?: 'WEAK!' | 'RESIST' } {
  const multiplier = getElementMultiplier(source, target)
  return { damage: Math.max(1, Math.floor(base * multiplier)), tag: multiplier > 1 ? 'WEAK!' : multiplier < 1 ? 'RESIST' : undefined }
}

function applyFrontierAccuracy(damage: number): number {
  return getFrontierModifiers(currentWave).includes('Darkness') && Math.random() < 0.25
    ? Math.floor(damage * 0.5)
    : damage
}

function determineHeroAction(hero: CombatHero, targets: CombatMonster[]): BattleAction {
  hero.defending = false
  hero.specialCooldown = Math.max(0, hero.specialCooldown - 1)
  hero.ultimateCharge = Math.min(hero.ultimateMaxCharge, hero.ultimateCharge + 1)

  const aliveTargets = targets.filter((t) => t.hp > 0)
  if (aliveTargets.length === 0) {
    return { combatantId: hero.id, kind: 'hero', action: 'defend', targetId: null, damage: 0, healing: 0 }
  }

  const lowest = aliveTargets.reduce((prev, curr) => (curr.hp < prev.hp ? curr : prev))
  if (hero.ultimateCharge >= hero.ultimateMaxCharge) {
    hero.ultimateCharge = 0
    const base = hero.atk * 3.2
    if (hero.role === 'support') {
      return { combatantId: hero.id, kind: 'hero', action: 'heal', targetId: hero.id, damage: 0, healing: Math.floor(hero.atk * 1.8), isUltimate: true }
    }
    const damage = computeDamage(hero.element, lowest.element, base)
    return {
      combatantId: hero.id, kind: 'hero', action: 'special', targetId: lowest.id,
      targetIds: hero.role === 'controller' || hero.name === 'Longshot' ? aliveTargets.slice(0, hero.name === 'Longshot' ? 3 : aliveTargets.length).map((target) => target.id) : [lowest.id],
      damage: damage.damage, healing: 0, effect: hero.name === 'Longshot' ? 'arrow' : hero.name === 'Frostweaver' ? 'fireball' : 'slash', isUltimate: true, tag: damage.tag,
    }
  }

  if (hero.role === 'support' && hero.specialCooldown <= 0) {
    const healingTargets = heroes.filter((h) => h.hp > 0 && h.hp < h.maxHp)
    if (healingTargets.length > 0) {
      hero.specialCooldown = hero.specialMaxCooldown
      const target = healingTargets.reduce((prev, curr) => (curr.hp / curr.maxHp < prev.hp / prev.maxHp ? curr : prev))
      const heal = Math.floor(hero.atk * 0.9)
      return { combatantId: hero.id, kind: 'hero', action: 'heal', targetId: target.id, damage: 0, healing: heal, tag: undefined }
    }
  }

  if (hero.specialCooldown <= 0 && (hero.role === 'damage' || hero.role === 'controller')) {
    hero.specialCooldown = hero.specialMaxCooldown
    const target = aliveTargets.reduce((prev, curr) => (curr.hp > prev.hp ? curr : prev))
    const multiplier = hero.role === 'controller' ? 2.8 : 2.2
    const computed = computeDamage(hero.element, target.element, applyFrontierAccuracy(hero.atk * multiplier - target.def * 0.4))
    return {
      combatantId: hero.id,
      kind: 'hero',
      action: 'special',
      targetId: target.id,
      damage: computed.damage,
      healing: 0,
      effect: hero.textureKey === 'hero-Mage' ? 'fireball' : hero.textureKey === 'hero-Archer' ? 'arrow' : 'slash',
      tag: computed.tag,
    }
  }

  if (hero.role === 'tank' && hero.hp < hero.maxHp * 0.3) {
    hero.defending = true
    return { combatantId: hero.id, kind: 'hero', action: 'defend', targetId: null, damage: 0, healing: 0 }
  }

  const target = aliveTargets.reduce((prev, curr) => (curr.hp < prev.hp ? curr : prev))
  const critical = hero.name === 'Blazefang' && Math.random() < 0.35
  const computed = computeDamage(hero.element, target.element, applyFrontierAccuracy((hero.atk - Math.floor(target.def * 0.5)) * (critical ? 2 : 1)))
  return {
    combatantId: hero.id,
    kind: 'hero',
    action: 'attack',
    targetId: target.id,
    damage: computed.damage,
    healing: 0,
    effect: hero.textureKey === 'hero-Mage' ? 'fireball' : hero.textureKey === 'hero-Archer' ? 'arrow' : 'slash',
    tag: computed.tag,
    isCrit: critical,
  }
}

function determinePetAction(hero: CombatHero, targetId: string | null, targets: CombatMonster[]): BattleAction | null {
  if (!targetId || hero.hp <= 0) return null
  const target = targets.find((t) => t.id === targetId && t.hp > 0)
  if (!target) return null
  const damage = Math.max(1, Math.floor(hero.atk * 0.3))
  return {
    combatantId: `pet-${hero.id}`,
    kind: 'pet',
    action: 'attack',
    targetId: target.id,
    damage,
    healing: 0,
    effect: 'projectile',
  }
}

function determineMonsterAction(monster: CombatMonster, targets: CombatHero[]): BattleAction {
  monster.defending = false

  const aliveTargets = targets.filter((t) => t.hp > 0)
  if (aliveTargets.length === 0) {
    return { combatantId: monster.id, kind: 'monster', action: 'defend', targetId: null, damage: 0, healing: 0 }
  }

  if (monster.hp < monster.maxHp * 0.25 && Math.random() < 0.25) {
    monster.defending = true
    return { combatantId: monster.id, kind: 'monster', action: 'defend', targetId: null, damage: 0, healing: 0 }
  }

  const target = aliveTargets.reduce((prev, curr) => (curr.hp < prev.hp ? curr : prev))
  const computed = computeDamage(monster.element, target.element, monster.atk - Math.floor(target.def * (target.defending ? 1.0 : 0.5)))

  return {
    combatantId: monster.id,
    kind: 'monster',
    action: 'attack',
    targetId: target.id,
    damage: computed.damage,
    healing: 0,
    effect: monster.textureKey === 'monster-archer' ? 'arrow' : isMonsterRanged(monster) ? 'fireball' : 'slash',
    tag: computed.tag,
  }
}

function isMonsterRanged(monster: CombatMonster): boolean {
  return ['monster-archer', 'monster-mage', 'monster-healer'].includes(monster.textureKey)
}

function applyActions(actions: BattleAction[]) {
  actions.forEach((action) => applyAction(action))
}

function applyAction(action: BattleAction) {
  if (!sceneRef) return

  if (action.kind === 'hero') {
    const hero = heroes.find((h) => h.id === action.combatantId)
    if (!hero || hero.hp <= 0) return
    const sprite = heroSprites.get(hero.id)
    if (!sprite) return

    if (action.action === 'defend') {
      showFloatingText(hero.x, hero.y - 60, 'DEFEND', '#44aaff')
      return
    }

    if (action.action === 'heal' && action.targetId) {
      const target = heroes.find((h) => h.id === action.targetId)
      if (target) {
        target.buffs = []
        if (action.isUltimate) {
          showFloatingText(hero.x, hero.y - 72, 'ULTIMATE!', '#ffdd44')
          addLog(`${hero.name} casts PARTY REGEN!`, 'buff')
          playSfx('ultimate')
          heroes.filter((member) => member.hp > 0).forEach((member) => {
            playAttackAnim(sprite, member, 'heal', 0, action.healing)
          })
          return
        }
        playAttackAnim(sprite, target, 'heal', 0, action.healing)
      }
      return
    }

    if (action.targetId && (action.action === 'attack' || action.action === 'special')) {
      const target = monsters.find((m) => m.id === action.targetId)
      if (target) {
        if (action.isUltimate) {
          showFloatingText(hero.x, hero.y - 72, 'ULTIMATE!', '#ffdd44')
          addLog(`${hero.name} unleashes an ultimate!`, 'buff')
          playSfx('ultimate')
        } else if (action.action === 'special') {
          showFloatingText(hero.x, hero.y - 64, 'SKILL!', '#66ddff')
          addLog(`${hero.name} uses a skill`, 'buff')
          playSfx('attack')
        }
        if (action.tag) showFloatingText(target.x, target.y - 76, action.tag, action.tag === 'WEAK!' ? '#ffdd44' : '#99aacc')
        if (action.isCrit) {
          showFloatingText(target.x, target.y - 92, 'CRIT!', '#ffe44d', 22)
          playSfx('crit')
        }
        if (action.isUltimate || target.isBoss) {
          if (!reducedMotion) sceneRef.cameras.main.shake(180, 0.008)
          hitStop = true
        }
        playAttackAnim(sprite, target, action.effect ?? 'slash', action.damage)
      }
    }
  }

  if (action.kind === 'pet') {
    const hero = heroes.find((h) => `pet-${h.id}` === action.combatantId)
    const target = monsters.find((m) => m.id === action.targetId)
    const sprite = hero ? petSprites.get(hero.id) : undefined
    if (hero && target && sprite) {
      playProjectile(sprite, target, 'projectile', action.damage)
    }
  }

  if (action.kind === 'monster') {
    const monster = monsters.find((m) => m.id === action.combatantId)
    if (!monster || monster.hp <= 0) return
    const sprite = monsterSprites.get(monster.id)
    if (!sprite) return

    if (action.action === 'defend') {
      showFloatingText(monster.x, monster.y - 60, 'DEFEND', '#ffaa44')
      return
    }

    if (action.targetId) {
      const target = heroes.find((h) => h.id === action.targetId)
      if (target) {
        if (action.tag) showFloatingText(target.x, target.y - 76, action.tag, action.tag === 'WEAK!' ? '#ffdd44' : '#99aacc')
        if (monster.isBoss && !reducedMotion) sceneRef.cameras.main.shake(160, 0.006)
        playAttackAnim(sprite, target, action.effect ?? 'slash', action.damage)
      }
    }
  }
}

function playAttackAnim(
  sprite: Phaser.GameObjects.Sprite,
  target: CombatHero | CombatMonster,
  effect: EffectName,
  damage: number,
  healing = 0
) {
  if (!sceneRef) return
  const startX = sprite.x
  const startY = sprite.y
  const isHeroAttacking = sprite.flipX === false

  if (effect === 'heal') {
    const heal = sceneRef.add.sprite(target.x, target.y, 'fx-heal')
    heal.setDepth(target.y + 10)
    heal.anims.play('fx-heal')
    sceneRef.time.delayedCall(250, () => {
      applyDamageToTarget(target.id, 0, Math.max(0, healing), 'heal')
      heal.destroy()
    })
    return
  }

  if (effect === 'arrow' || effect === 'fireball' || effect === 'projectile') {
    playProjectile(sprite, target, effect, damage)
    return
  }

  // melee lunge
  const dist = isHeroAttacking ? 40 : -40
  sceneRef.tweens.add({
    targets: sprite,
    x: target.x - dist,
    duration: 200 / speedMultiplier,
    yoyo: true,
    ease: 'Sine.easeInOut',
    onStart: () => playEntityAnim(sprite, sprite.texture.key, 'attack'),
    onYoyo: () => {
      if (effect === 'slash') {
        const slash = sceneRef!.add.sprite(target.x, target.y, 'fx-slash')
        slash.setDepth(target.y + 10)
        slash.setDisplaySize(48, 48)
        slash.setFlipX(!isHeroAttacking)
        slash.anims.play('fx-slash')
        sceneRef!.time.delayedCall(250, () => slash.destroy())
      }
      sceneRef!.time.delayedCall(50, () => {
        const targetSprite = getCombatantSprite(target)
        if (targetSprite) {
          const targetX = targetSprite.x
          sceneRef!.tweens.add({
            targets: targetSprite,
            x: targetX + (isHeroAttacking ? 8 : -8),
            duration: 70,
            yoyo: true,
          })
        }
        applyDamageToTarget(target.id, Math.max(1, damage), 0, 'damage')
      })
    },
    onComplete: () => {
      sprite.setPosition(startX, startY)
      playEntityAnim(sprite, sprite.texture.key, 'idle')
    },
  })
}

function getCombatantSprite(target: CombatHero | CombatMonster): Phaser.GameObjects.Sprite | undefined {
  return 'isBoss' in target ? monsterSprites.get(target.id) : heroSprites.get(target.id)
}

function playProjectile(
  sourceSprite: Phaser.GameObjects.Sprite,
  target: CombatHero | CombatMonster,
  effect: EffectName,
  damage: number
) {
  if (!sceneRef) return
  const projectile = sceneRef.add.sprite(sourceSprite.x, sourceSprite.y, getEffectKey(effect))
  projectile.setDepth(sourceSprite.y + 10)
  projectile.setDisplaySize(32, 32)
  projectile.setFlipX(sourceSprite.flipX)
  projectile.anims.play(getEffectKey(effect))

  sceneRef.tweens.add({
    targets: projectile,
    x: target.x,
    y: target.y,
    duration: 250 / speedMultiplier,
    ease: 'Linear',
    onComplete: () => {
      if (effect === 'arrow' || effect === 'fireball' || effect === 'projectile') {
        const hit = sceneRef!.add.sprite(target.x, target.y, 'fx-hit')
        hit.setDepth(target.y + 12)
        hit.setDisplaySize(40, 40)
        hit.anims.play('fx-hit')
        sceneRef!.time.delayedCall(250, () => hit.destroy())
      }
      projectile.destroy()
      applyDamageToTarget(target.id, Math.max(1, damage), 0, 'damage')
    },
  })
}

function applyDamageToTarget(targetId: string, damage: number, healing: number, type: 'damage' | 'heal' | 'kill') {
  const hero = heroes.find((h) => h.id === targetId)
  const monster = monsters.find((m) => m.id === targetId)
  void type

  if (hero && hero.hp > 0) {
    if (healing > 0) {
      const actual = Math.min(healing, hero.maxHp - hero.hp)
      hero.hp += actual
      playSfx('heal')
      showFloatingText(hero.x, hero.y - 56, `+${actual}`, '#44ff88')
      addLog(`${hero.name} heals ${actual}`, 'heal')
    } else {
      const actual = Math.max(1, damage)
      hero.hp = Math.max(0, hero.hp - actual)
      playSfx('hit')
      showFloatingText(hero.x, hero.y - 56, `-${actual}`, '#ff4444')
      addLog(`${hero.name} takes ${actual}`, hero.hp <= 0 ? 'kill' : 'damage')
      if (hero.hp <= 0) {
        addLog(`${hero.name} has fallen!`, 'kill')
        killHero(hero)
      }
    }
  }

  if (monster && monster.hp > 0) {
    if (healing > 0) {
      const actual = Math.min(healing, monster.maxHp - monster.hp)
      monster.hp += actual
      showFloatingText(monster.x, monster.y - (monster.isBoss ? 70 : 46), `+${actual}`, '#44ff88')
    } else {
      const actual = Math.max(1, damage)
      monster.hp = Math.max(0, monster.hp - actual)
      playSfx('hit')
      showFloatingText(monster.x, monster.y - (monster.isBoss ? 70 : 46), `-${actual}`, '#ffaa44')
      addLog(`${monster.name} takes ${actual}`, monster.hp <= 0 ? 'kill' : 'damage')
      if (monster.hp <= 0) {
        hitStop = true
        addLog(`${monster.name} defeated!`, 'kill')
        killMonster(monster)
      }
    }
  }

  if (sceneRef) updateHpBars(sceneRef)
}

function killHero(hero: CombatHero) {
  const sprite = heroSprites.get(hero.id)
  if (sprite && sceneRef) {
    playEntityAnim(sprite, sprite.texture.key, 'death')
    createDeathBurst(hero.x, hero.y, 0xff5555)
    sceneRef.time.delayedCall(600, () => {
      sprite.setAlpha(0.4)
    })
  }
}

function killMonster(monster: CombatMonster) {
  if (!sceneRef) return
  const sprite = monsterSprites.get(monster.id)
  if (sprite) {
    playEntityAnim(sprite, sprite.texture.key, 'death')
    createDeathBurst(monster.x, monster.y, 0xffaa44)
    if (getFrontierModifiers(currentWave).includes('Volatile')) {
      heroes.filter((hero) => hero.hp > 0 && Math.abs(hero.x - monster.x) < 220).forEach((hero) => {
        applyDamageToTarget(hero.id, Math.max(1, Math.floor(monster.atk * 0.35)), 0, 'damage')
      })
    }
    sceneRef.time.delayedCall(500, () => {
      sprite.destroy()
      const bar = hpBars.get(monster.id)
      if (bar) {
        bar.bg.destroy()
        bar.fill.destroy()
        hpBars.delete(monster.id)
      }
      monsterSprites.delete(monster.id)
    })
  }
}

function createDeathBurst(x: number, y: number, color: number) {
  if (!sceneRef) return
  const flash = sceneRef.add.circle(x, y, 22, color, 0.55)
  flash.setDepth(y + 20)
  sceneRef.tweens.add({ targets: flash, scale: 2, alpha: 0, duration: 220, onComplete: () => flash.destroy() })
  for (let i = 0; i < 5; i++) {
    const spark = sceneRef.add.rectangle(x, y, 4, 4, color)
    spark.setDepth(y + 20)
    sceneRef.tweens.add({
      targets: spark,
      x: x + (i - 2) * 18,
      y: y - 18 - (i % 2) * 14,
      alpha: 0,
      duration: 300,
      onComplete: () => spark.destroy(),
    })
  }
}

function showFloatingText(x: number, y: number, text: string, color: string, fontSize = 14) {
  if (!sceneRef) return
  const label = sceneRef.add.text(x, y, text, {
    fontFamily: 'monospace',
    fontSize: `${fontSize}px`,
    color,
    stroke: '#000000',
    strokeThickness: 3,
  })
  label.setOrigin(0.5)
  label.setScrollFactor(0)
  label.setDepth(300)

  sceneRef.tweens.add({
    targets: label,
    y: y - 40,
    alpha: 0,
    duration: 800,
    ease: 'Power1',
    onComplete: () => label.destroy(),
  })
}

function processBuffs() {
  if (getFrontierModifiers(currentWave).includes('Regenerating')) {
    monsters.filter((monster) => monster.hp > 0).forEach((monster) => {
      const healing = Math.max(1, Math.floor(monster.maxHp * 0.04))
      applyDamageToTarget(monster.id, 0, healing, 'heal')
      showFloatingText(monster.x, monster.y - 54, 'REGEN', '#66ff99')
    })
  }
  ;[...heroes, ...monsters].forEach((combatant) => {
    combatant.buffs = combatant.buffs.filter((buff) => {
      buff.duration--
      if (buff.duration <= 0 && buff.type === 'defend') {
        combatant.defending = false
      }
      return buff.duration > 0
    })
  })
}

function checkBattleEnd() {
  const aliveHeroes = heroes.filter((h) => h.hp > 0)
  const aliveMonsters = monsters.filter((m) => m.hp > 0)

  if (aliveHeroes.length === 0) {
    endBattle('defeat')
  } else if (aliveMonsters.length === 0) {
    endWave()
  }
}

function endWave() {
  battlePhase = 'wave-complete'
  notifyStateUpdate()

  const effectiveWave = getEffectiveWave(currentWave)
  const waveConfig = WAVE_CONFIGS.find((w) => w.waveNumber === effectiveWave)
  const bossConfig = BOSS_CONFIGS[effectiveWave]
  const diff = DIFFICULTIES[difficultyKey] ?? DIFFICULTIES.normal
  const baseXp = bossConfig?.xpReward ?? waveConfig?.xpReward ?? 0
  const xpReward = Math.floor(baseXp * diff.xpMultiplier)
  const livingHeroes = heroes.filter((hero) => hero.hp > 0)
  const xpPerHero = livingHeroes.length > 0 ? Math.floor(xpReward / livingHeroes.length) : 0
  livingHeroes.forEach((hero) => addXpToHero(hero.id, xpPerHero))
  const goldReward = bossConfig?.goldReward ?? waveConfig?.goldReward ?? 0
  addGold(Math.floor(goldReward))
  const drops = rollLoot(currentWave, difficultyKey, Boolean(bossConfig))
  addItems(drops)
  saveMetaState()
  if (!endlessMode) {
    metaState.campaign.completedStages = Array.from(new Set([...metaState.campaign.completedStages, currentWave]))
    metaState.campaign.highestUnlockedStage = Math.max(metaState.campaign.highestUnlockedStage, currentWave + 1)
    if (currentWave >= 120) metaState.campaign.campaignCompleted = true
    saveMetaState()
  }
  notifyStateUpdate()
  if (drops.length > 0) addLog(`Loot found: ${drops.map((item) => item.name).join(', ')}`, 'wave-end')
  addLog(`Rewards: +${xpReward} XP each, +${Math.floor(goldReward)} gold`, 'wave-end')

  if (waveConfig) {
    addLog(`Wave ${currentWave} complete! +${waveConfig.xpReward} XP, +${waveConfig.goldReward} gold`, 'wave-end')
  }
  if (bossConfig) {
    addLog(`BOSS defeated! +${bossConfig.xpReward} XP, +${bossConfig.goldReward} gold`, 'wave-end')
  }

  const campaignTargetReached = !endlessMode && currentWave >= selectedCampaignStage
  if (campaignTargetReached) {
    battlePhase = 'complete'
    battleResult = 'victory'
    addLog('VICTORY! All waves conquered!', 'wave-end')
    notifyStateUpdate()
    return
  }

  battlePhase = 'wave-complete'
  if (endlessMode && currentWave >= MAX_WAVE && currentWave % MAX_WAVE === 0) {
    addLog(`Frontier checkpoint D${currentWave} reached. Heat reset.`, 'wave-end')
  }

  scheduleNextTurn()
}

function handleWaveComplete() {
  const campaignTargetReached = !endlessMode && currentWave >= selectedCampaignStage
  if (campaignTargetReached) {
    battlePhase = 'complete'
    battleResult = 'victory'
    addLog('VICTORY! All waves conquered!', 'wave-end')
    notifyStateUpdate()
    return
  }
  startWaveIntro()
}

function endBattle(result: CombatResult) {
  battlePhase = 'complete'
  battleResult = result
  playSfx(result === 'victory' ? 'victory' : 'defeat')
  addLog(result === 'victory' ? 'Battle Victory!' : 'Battle Defeat!', result === 'victory' ? 'wave-end' : 'kill')
  notifyStateUpdate()
}

function addLog(text: string, type: CombatLogEntry['type']) {
  battleLog.push({ turn: turnNumber, text, type })
  if (sceneRef && logText) {
    updateLogDisplay(sceneRef)
  }
}

function updateLogDisplay(scene: Phaser.Scene) {
  if (!logText) return
  const recent = battleLog.slice(-6)
  logText.setText(recent.map((e) => e.text).join('\n'))
}

function notifyStateUpdate() {
  if (stateUpdateCallback) stateUpdateCallback()
}

function updateScene(this: Phaser.Scene, _time: number, delta: number) {
  parallaxLayers.forEach((layer) => {
    layer.sprite.tilePositionX += layer.speed * (delta / 16)
  })
}

function restartBattle() {
  if (!sceneRef) return
  resetGameState()
  if (!endlessMode) currentWave = Math.max(0, selectedCampaignStage - 1)
  const w = sceneRef.cameras.main.width
  const h = sceneRef.cameras.main.height
  spawnHeroParty(sceneRef)
  positionCombatants(sceneRef, w, h)
  startWaveIntro()
}
