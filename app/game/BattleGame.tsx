'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Phaser from 'phaser'
import {
  WAVE_CONFIGS,
  BOSS_CONFIGS,
  MAX_WAVE,
} from '@/lib/combat-config'
import type {
  CombatPhase,
  CombatLogEntry,
  CombatResult,
} from '@/lib/combat-types'
import { HERO_RARITY_CONFIGS } from '@/lib/hero-rarity'

interface HeroState {
  id: string
  name: string
  role: 'tank' | 'damage' | 'support' | 'controller'
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Cosmic'
  hp: number
  maxHp: number
  atk: number
  def: number
  spd: number
  level: number
  defending: boolean
  specialCooldown: number
  specialMaxCooldown: number
  buffs: Array<{ type: string; value: number; duration: number }>
  x: number
  y: number
}

interface MonsterState {
  id: string
  name: string
  wave: number
  isBoss: boolean
  hp: number
  maxHp: number
  atk: number
  def: number
  spd: number
  x: number
  y: number
  defending: boolean
  buffs: Array<{ type: string; value: number; duration: number }>
}

interface BattleAction {
  combatantId: string
  action: 'attack' | 'special' | 'defend'
  targetId: string | null
  damage: number
  healing: number
}

interface ParallaxLayer {
  sprite: Phaser.GameObjects.TileSprite
  speed: number
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
  } | null>(null)

  const createGame = useCallback(() => {
    if (!containerRef.current) return
    if (gameRef.current) return

    const container = containerRef.current
    const width = container.clientWidth || 800
    const height = container.clientHeight || 600

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width,
      height,
      parent: container,
      backgroundColor: '#0a0a1a',
      physics: {
        default: 'arcade',
        arcade: {
          debug: false,
        },
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
    const onUpdate = () => setOverlay((prev) => {
      if (!prev) return { phase: battlePhase, wave: currentWave, turn: turnNumber, aliveHeroes: heroes.filter((h) => h.hp > 0).length, totalHeroes: heroes.length, aliveMonsters: monsters.filter((m) => m.hp > 0).length, totalMonsters: monsters.length }
      return { phase: battlePhase, wave: currentWave, turn: turnNumber, aliveHeroes: heroes.filter((h) => h.hp > 0).length, totalHeroes: heroes.length, aliveMonsters: monsters.filter((m) => m.hp > 0).length, totalMonsters: monsters.length }
    })
    stateUpdateCallback = onUpdate
    const cleanup = createGame()
    return () => {
      stateUpdateCallback = null
      if (cleanup) cleanup()
    }
  }, [createGame])

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <div ref={containerRef} className="w-full h-full" />
      {overlay && (
        <div className="absolute top-2 left-2 bg-black/70 text-green-400 font-mono text-xs p-2 rounded max-w-[260px] pointer-events-none z-10">
          <div>Wave: {overlay.wave}/{MAX_WAVE}</div>
          <div>Turn: {overlay.turn}</div>
          <div>Phase: {overlay.phase}</div>
          <div>Heroes: {overlay.aliveHeroes}/{overlay.totalHeroes}</div>
          <div>Monsters: {overlay.aliveMonsters}/{overlay.totalMonsters}</div>
        </div>
      )}
    </div>
  )
}

let sceneRef: Phaser.Scene | null = null
let battlePhase: CombatPhase = 'wave-intro'
let currentWave = 0
let turnNumber = 0
let heroes: HeroState[] = []
let monsters: MonsterState[] = []
let battleLog: CombatLogEntry[] = []
let battleResult: CombatResult | null = null
let parallaxLayers: ParallaxLayer[] = []
let heroSprites: Map<string, Phaser.GameObjects.Rectangle> = new Map()
let monsterSprites: Map<string, Phaser.GameObjects.Rectangle> = new Map()
let hpBarGroup: Phaser.GameObjects.Group | null = null
let logText: Phaser.GameObjects.Text | null = null
let turnDelayMs = 800
let stateUpdateCallback: (() => void) | null = null

function initScene(this: Phaser.Scene) {
  const defaultHeroes: HeroState[] = [
    createHero('hero-1', 'Ironclad', 'tank', 'Common', 1),
    createHero('hero-2', 'Blazefang', 'damage', 'Rare', 1),
    createHero('hero-3', 'Windsong', 'support', 'Uncommon', 1),
    createHero('hero-4', 'Frostweaver', 'controller', 'Epic', 1),
  ]

  heroes = defaultHeroes
  monsters = []
  battleLog = []
  battleResult = null
  currentWave = 0
  turnNumber = 0
  battlePhase = 'wave-intro'
  turnDelayMs = 800
  heroSprites.clear()
  monsterSprites.clear()
  parallaxLayers = []
}

function createHero(
  id: string,
  name: string,
  role: HeroState['role'],
  rarity: HeroState['rarity'],
  level: number
): HeroState {
  const config = HERO_RARITY_CONFIGS[rarity]
  return {
    id,
    name,
    role,
    rarity,
    hp: Math.floor(config.baseHp * (1 + (level - 1) * 0.15)),
    maxHp: Math.floor(config.baseHp * (1 + (level - 1) * 0.15)),
    atk: Math.floor(config.baseAtk * (1 + (level - 1) * 0.1)),
    def: Math.floor(config.baseDef * (1 + (level - 1) * 0.08)),
    spd: Math.floor(config.baseSpd * (1 + (level - 1) * 0.05)),
    level,
    defending: false,
    specialCooldown: 0,
    specialMaxCooldown: 3,
    buffs: [],
    x: 0,
    y: 0,
  }
}

function createMonster(wave: number, monsterId: string, isBoss: boolean = false): MonsterState {
  const hpScale = WAVE_CONFIGS.find((w) => w.waveNumber === wave)?.hpScale ?? 1.0
  const atkScale = WAVE_CONFIGS.find((w) => w.waveNumber === wave)?.atkScale ?? 1.0
  const baseHp = 60 + wave * 20
  const baseAtk = 5 + wave * 2
  const baseDef = 2 + wave * 1
  const multiplier = isBoss ? 3.0 : 1.0

  return {
    id: `monster-${monsterId}-${wave}-${Date.now()}`,
    name: isBoss ? `Boss ${monsterId}` : monsterId,
    wave,
    isBoss,
    hp: Math.floor(baseHp * hpScale * multiplier),
    maxHp: Math.floor(baseHp * hpScale * multiplier),
    atk: Math.floor(baseAtk * atkScale * multiplier),
    def: Math.floor(baseDef * multiplier),
    spd: Math.max(1, 3 + wave - (isBoss ? 0 : 1)),
    x: 0,
    y: 0,
    defending: false,
    buffs: [],
  }
}

function preloadScene(this: Phaser.Scene) {
  const graphics = this.make.graphics({ x: 0, y: 0 })
  graphics.fillStyle(0x0a0a2e, 1)
  graphics.fillRect(0, 0, 2, 2)
  graphics.generateTexture('bg-far', 2, 2)
  graphics.clear()
  graphics.fillStyle(0x1a1a4e, 1)
  graphics.fillRect(0, 0, 2, 2)
  graphics.generateTexture('bg-mid', 2, 2)
  graphics.clear()
  graphics.fillStyle(0x2a2a5e, 1)
  graphics.fillRect(0, 0, 2, 2)
  graphics.generateTexture('bg-near', 2, 2)
}

function createScene(this: Phaser.Scene) {
  sceneRef = this
  const w = this.cameras.main.width
  const h = this.cameras.main.height

  createParallaxBackground(this, w, h)
  createBattleGround(this, w, h)
  positionCombatants(this, w, h)
  createHpBars(this)
  createUI(this, w, h)
  startWaveIntro()
}

function createParallaxBackground(scene: Phaser.Scene, width: number, height: number) {
  parallaxLayers = []

  const layers = [
    { texture: 'bg-far', speed: 0.1 },
    { texture: 'bg-mid', speed: 0.25 },
    { texture: 'bg-near', speed: 0.5 },
  ]

  layers.forEach((layer) => {
    const sprite = scene.add.tileSprite(0, 0, width, height, layer.texture)
    sprite.setOrigin(0, 0)
    sprite.setScrollFactor(layer.speed)
    parallaxLayers.push({ sprite, speed: layer.speed })
  })
}

function createBattleGround(scene: Phaser.Scene, width: number, height: number) {
  const ground = scene.add.rectangle(width / 2, height, width, height * 0.3, 0x1a1a2e, 0.5)
  ground.setOrigin(0, 1)
  ground.setScrollFactor(0)
}

function positionCombatants(scene: Phaser.Scene, width: number, height: number) {
  const heroAreaWidth = width * 0.5
  const monsterAreaWidth = width * 0.5
  const heroSpacing = heroAreaWidth / Math.max(1, heroes.length)
  const monsterSpacing = monsterAreaWidth / Math.max(1, 6)

  heroes.forEach((hero, i) => {
    hero.x = heroSpacing * (i + 0.5)
    hero.y = height * 0.65
  })

  monsters.forEach((monster, i) => {
    monster.x = monsterAreaWidth + monsterSpacing * (i + 0.5)
    monster.y = height * 0.65
  })
}

function createHpBars(scene: Phaser.Scene) {
  hpBarGroup = scene.add.group()
  hpBarGroup.clear(true, true)
}

function createUI(scene: Phaser.Scene, width: number, height: number) {
  logText = scene.add.text(16, 16, '', {
    fontFamily: 'monospace',
    fontSize: '11px',
    color: '#00ff88',
    backgroundColor: '#000000cc',
    padding: { x: 8, y: 4 },
    wordWrap: { width: 300 },
  })
  logText.setScrollFactor(0)
  logText.setAlpha(0.9)
}

function startWaveIntro() {
  currentWave++
  battlePhase = 'wave-intro'

  const waveConfig = WAVE_CONFIGS.find((w) => w.waveNumber === currentWave)
  const bossConfig = BOSS_CONFIGS[currentWave]

  const waveMsg = bossConfig
    ? `Wave ${currentWave} — BOSS: ${bossConfig.monsterId.toUpperCase()}!`
    : waveConfig
    ? `Wave ${currentWave} — ${waveConfig.monsterCount} enemies approach`
    : `Wave ${currentWave}`

  addLog(waveMsg, 'wave-start')
  spawnWaveMonsters(waveConfig, bossConfig)

  if (sceneRef) {
    positionCombatants(sceneRef, sceneRef.cameras.main.width, sceneRef.cameras.main.height)
    updateSprites(sceneRef)
    updateHpBars(sceneRef)
    notifyStateUpdate()
  }

  scheduleNextTurn()
}

function spawnWaveMonsters(waveConfig?: ReturnType<typeof WAVE_CONFIGS.find>, bossConfig?: typeof BOSS_CONFIGS[number]) {
  monsters = []

  if (bossConfig) {
    monsters.push(createMonster(bossConfig.waveNumber, bossConfig.monsterId, true))
  } else if (waveConfig) {
    waveConfig.monsterIds.forEach((mid) => {
      monsters.push(createMonster(waveConfig.waveNumber, mid, false))
    })
  }

  if (sceneRef) {
    const w = sceneRef.cameras.main.width
    const h = sceneRef.cameras.main.height
    monsters.forEach((monster, i) => {
      monster.x = w * 0.55 + (i % 5) * (w * 0.45 / 5)
      monster.y = h * 0.4 + Math.floor(i / 5) * 60
    })
  }
}

function updateSprites(scene: Phaser.Scene) {
  heroSprites.forEach((sprite) => sprite.destroy())
  heroSprites.clear()

  monsterSprites.forEach((sprite) => sprite.destroy())
  monsterSprites.clear()

  const heroRoleColors: Record<HeroState['role'], number> = {
    tank: 0x0066ff,
    damage: 0xff4444,
    support: 0x44ff44,
    controller: 0xffaa00,
  }

  const rarityBorderColors: Record<HeroState['rarity'], number> = {
    Common: 0x888888,
    Uncommon: 0x44aa44,
    Rare: 0x4488ff,
    Epic: 0xaa44ff,
    Legendary: 0xff8800,
    Cosmic: 0xff00ff,
  }

  heroes.forEach((hero) => {
    const rect = scene.add.rectangle(hero.x, hero.y, 40, 40, heroRoleColors[hero.role], 0.9)
    rect.setStrokeStyle(2, rarityBorderColors[hero.rarity])
    heroSprites.set(hero.id, rect)

    scene.add.text(hero.x, hero.y - 24, hero.name, {
      fontSize: '10px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setScrollFactor(0)
  })

  monsters.forEach((monster) => {
    const color = monster.isBoss ? 0xff0000 : 0x8844ff
    const rect = scene.add.rectangle(monster.x, monster.y, 40, 40, color, 0.9)
    rect.setStrokeStyle(2, 0xffffff)
    monsterSprites.set(monster.id, rect)

    scene.add.text(monster.x, monster.y - 24, monster.name, {
      fontSize: '10px',
      color: '#ff8888',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setScrollFactor(0)
  })
}

function updateHpBars(scene: Phaser.Scene) {
  if (hpBarGroup) {
    hpBarGroup.clear(true, true)
  }

  const barWidth = 50
  const barHeight = 6

  heroes.forEach((hero) => {
    const barX = hero.x - barWidth / 2
    const barY = hero.y + 26
    const bg = scene.add.rectangle(barX + barWidth / 2, barY, barWidth, barHeight, 0x333333, 0.8).setScrollFactor(0)
    const hpRatio = Math.max(0, hero.hp / hero.maxHp)
    const hpColor = hpRatio > 0.5 ? 0x00ff00 : hpRatio > 0.25 ? 0xffff00 : 0xff0000
    const hpBar = scene.add.rectangle(barX + barWidth * hpRatio / 2, barY, Math.max(1, barWidth * hpRatio), barHeight, hpColor, 0.9).setScrollFactor(0)
    hpBarGroup?.add(bg)
    hpBarGroup?.add(hpBar)
  })

  monsters.forEach((monster) => {
    const barX = monster.x - barWidth / 2
    const barY = monster.y + 26
    const bg = scene.add.rectangle(barX + barWidth / 2, barY, barWidth, barHeight, 0x333333, 0.8).setScrollFactor(0)
    const hpRatio = Math.max(0, monster.hp / monster.maxHp)
    const hpColor = monster.isBoss ? 0xff4444 : 0xff8844
    const hpBar = scene.add.rectangle(barX + barWidth * hpRatio / 2, barY, Math.max(1, barWidth * hpRatio), barHeight, hpColor, 0.9).setScrollFactor(0)
    hpBarGroup?.add(bg)
    hpBarGroup?.add(hpBar)
  })
}

function updateLogDisplay(scene: Phaser.Scene) {
  if (!logText) return
  const recent = battleLog.slice(-5)
  logText.setText(recent.map((e) => e.text).join('\n'))
}

function notifyStateUpdate() {
  if (stateUpdateCallback) {
    stateUpdateCallback()
  }
}

function scheduleNextTurn() {
  if (battleResult) return

  const timeout = setTimeout(() => {
    switch (battlePhase) {
      case 'wave-intro':
        transitionToActive()
        break
      case 'wave-complete':
        handleWaveComplete()
        break
      case 'wave-outro':
        startWaveIntro()
        break
      case 'active':
        processAutoTurn()
        break
      case 'boss-intro':
        transitionToActive()
        break
      case 'boss-active':
        processAutoTurn()
        break
      case 'complete':
        break
    }
  }, turnDelayMs)
}

function transitionToActive() {
  battlePhase = 'active'
  notifyStateUpdate()
  scheduleNextTurn()
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

  aliveHeroes.sort((a, b) => b.spd - a.spd)
  aliveMonsters.sort((a, b) => b.spd - a.spd)

  const actions: BattleAction[] = []

  aliveHeroes.forEach((hero) => {
    actions.push(determineHeroAction(hero, aliveMonsters))
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

function determineHeroAction(hero: HeroState, targets: MonsterState[]): BattleAction {
  hero.defending = false
  hero.specialCooldown = Math.max(0, hero.specialCooldown - 1)

  const aliveTargets = targets.filter((t) => t.hp > 0)
  if (aliveTargets.length === 0) {
    return { combatantId: hero.id, action: 'defend', targetId: null, damage: 0, healing: 0 }
  }

  if (hero.role === 'support' && hero.hp < hero.maxHp * 0.5 && hero.specialCooldown <= 0) {
    hero.specialCooldown = hero.specialMaxCooldown
    const healAmount = Math.floor(hero.atk * 0.8)
    const healingTargets = heroes.filter((h) => h.hp > 0 && h.hp < h.maxHp)
    const supportTarget = healingTargets.length > 0 ? healingTargets[0] : hero
    return { combatantId: hero.id, action: 'special', targetId: supportTarget.id, damage: 0, healing: healAmount }
  }

  if (hero.role === 'damage' && hero.specialCooldown <= 0) {
    hero.specialCooldown = hero.specialMaxCooldown
    const target = aliveTargets.reduce((prev, curr) => (curr.hp > prev.hp ? curr : prev))
    const damage = Math.max(1, hero.atk * 2 - Math.floor(target.def * 0.5))
    return { combatantId: hero.id, action: 'special', targetId: target.id, damage, healing: 0 }
  }

  if (hero.role === 'tank' && hero.hp < hero.maxHp * 0.3) {
    hero.defending = true
    return { combatantId: hero.id, action: 'defend', targetId: null, damage: 0, healing: 0 }
  }

  if (hero.role === 'controller' && hero.specialCooldown <= 0 && aliveTargets.length > 1) {
    hero.specialCooldown = hero.specialMaxCooldown
    const target = aliveTargets[0]
    const damage = Math.max(1, hero.atk * 3 - Math.floor(target.def * 0.3))
    return { combatantId: hero.id, action: 'special', targetId: target.id, damage, healing: 0 }
  }

  const target = aliveTargets.reduce((prev, curr) => (curr.hp < prev.hp ? curr : prev))
  const damage = Math.max(1, hero.atk - Math.floor(target.def * 0.5))
  return { combatantId: hero.id, action: 'attack', targetId: target.id, damage, healing: 0 }
}

function determineMonsterAction(monster: MonsterState, targets: HeroState[]): BattleAction {
  monster.defending = false

  const aliveTargets = targets.filter((t) => t.hp > 0)
  if (aliveTargets.length === 0) {
    return { combatantId: monster.id, action: 'defend', targetId: null, damage: 0, healing: 0 }
  }

  if (monster.hp < monster.maxHp * 0.3 && Math.random() < 0.3) {
    monster.defending = true
    return { combatantId: monster.id, action: 'defend', targetId: null, damage: 0, healing: 0 }
  }

  const target = aliveTargets.reduce((prev, curr) => (curr.hp < prev.hp ? curr : prev))
  const damage = Math.max(1, monster.atk - Math.floor(target.def * 0.5))
  return { combatantId: monster.id, action: 'attack', targetId: target.id, damage, healing: 0 }
}

function applyActions(actions: BattleAction[]) {
  actions.forEach((action) => {
    if (action.action === 'defend') return

    if (action.action === 'special' && action.healing > 0) {
      const target = heroes.find((h) => h.id === action.targetId)
      if (target) {
        const actualHeal = Math.min(action.healing, target.maxHp - target.hp)
        target.hp += actualHeal
        addLog(`${target.name} heals for ${actualHeal} HP`, 'heal')
      }
      return
    }

    if (action.action === 'special' && action.damage > 0) {
      const target = monsters.find((m) => m.id === action.targetId)
      if (target) {
        target.hp = Math.max(0, target.hp - action.damage)
        const isKill = target.hp <= 0
        addLog(`${target.name} takes ${action.damage} damage`, isKill ? 'kill' : 'damage')
        if (isKill) addLog(`${target.name} defeated!`, 'kill')
      }
      return
    }

    if (action.action === 'attack') {
      const targetMonster = monsters.find((m) => m.id === action.targetId)
      const targetHero = heroes.find((h) => h.id === action.targetId)

      if (targetMonster) {
        const targetDef = targetMonster.defending ? targetMonster.def * 2 : targetMonster.def
        const actualDamage = Math.max(1, action.damage - Math.floor(targetDef * 0.5))
        targetMonster.hp = Math.max(0, targetMonster.hp - actualDamage)
        const isKill = targetMonster.hp <= 0
        addLog(`${targetMonster.name} takes ${actualDamage} damage`, isKill ? 'kill' : 'damage')
        if (isKill) addLog(`${targetMonster.name} defeated!`, 'kill')
      }

      if (targetHero) {
        const targetDef = targetHero.defending ? targetHero.def * 2 : targetHero.def
        const actualDamage = Math.max(1, action.damage - Math.floor(targetDef * 0.5))
        targetHero.hp = Math.max(0, targetHero.hp - actualDamage)
        const isKill = targetHero.hp <= 0
        addLog(`${targetHero.name} takes ${actualDamage} damage`, isKill ? 'kill' : 'damage')
        if (isKill) addLog(`${targetHero.name} has fallen!`, 'kill')
      }
    }
  })
}

function processBuffs() {
  [...heroes, ...monsters].forEach((combatant) => {
    combatant.buffs = combatant.buffs.filter((buff) => {
      buff.duration--
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
  turnNumber++
  addLog(`Wave ${currentWave} complete!`, 'wave-end')
  notifyStateUpdate()

  const waveConfig = WAVE_CONFIGS.find((w) => w.waveNumber === currentWave)
  if (waveConfig) {
    addLog(`Rewards: ${waveConfig.xpReward} XP, ${waveConfig.goldReward} gold`, 'wave-end')
  }

  if (currentWave >= MAX_WAVE) {
    battlePhase = 'complete'
    battleResult = 'victory'
    addLog('VICTORY! All waves conquered!', 'wave-end')
    notifyStateUpdate()
    return
  }

  turnDelayMs = 1500

  const bossConfig = BOSS_CONFIGS[currentWave]
  if (bossConfig) {
    battlePhase = 'boss-intro'
    addLog(`BOSS WAVE ${currentWave} incoming...`, 'wave-start')
  } else {
    battlePhase = 'wave-outro'
    addLog('Prepare for the next wave...', 'wave-end')
  }

  scheduleNextTurn()
}

function handleWaveComplete() {
  if (currentWave >= MAX_WAVE) {
    battlePhase = 'complete'
    battleResult = 'victory'
    addLog('VICTORY! All waves conquered!', 'wave-end')
    notifyStateUpdate()
    return
  }

  battlePhase = 'wave-outro'
  scheduleNextTurn()
}

function endBattle(result: CombatResult) {
  battlePhase = 'complete'
  battleResult = result
  turnNumber++

  addLog(result === 'victory' ? 'Battle Victory!' : 'Battle Defeat!', result === 'victory' ? 'wave-end' : 'kill')
  notifyStateUpdate()
}

function addLog(text: string, type: CombatLogEntry['type']) {
  battleLog.push({ turn: turnNumber, text, type })
  if (sceneRef && logText) {
    updateLogDisplay(sceneRef)
  }
}

function updateBattleUI() {
  if (!sceneRef) return
  updateSprites(sceneRef)
  updateHpBars(sceneRef)
  updateLogDisplay(sceneRef)
}

function updateScene(this: Phaser.Scene, time: number, delta: number) {
  parallaxLayers.forEach((layer) => {
    layer.sprite.tilePositionX += layer.speed * (delta / 16)
  })
}