export const FRAME_SIZE = 32
export const SHEET_COLS = 4
export const SHEET_ROWS = ['idle', 'walk', 'attack', 'hit', 'death'] as const

export type AnimName = (typeof SHEET_ROWS)[number]

export interface SpritePalette {
  key: string
  body: string
  head: string
  legs: string
  weapon: string
  skin?: string
  detail?: string
  shield?: boolean
  weaponType?: 'sword' | 'staff' | 'bow' | 'dagger' | 'axe' | 'mace' | 'wand' | 'claws' | 'none'
  scale?: number
  isMonster?: boolean
}

export interface SpriteSpec {
  key: string
  palette: SpritePalette
}

function getPose(rowIdx: number, colIdx: number) {
  const c = colIdx % SHEET_COLS
  switch (rowIdx) {
    case 0: // idle
      return {
        x: 0,
        y: Math.round(Math.sin(c * Math.PI * 0.5)),
        weaponX: 4,
        weaponY: 0,
        weaponAngle: 0,
        legL: 0,
        legR: 0,
        alpha: 1,
        flash: false,
      }
    case 1: // walk
      return {
        x: c * 0.5 - 0.75,
        y: c % 2 === 0 ? 0 : -1,
        weaponX: 3 + (c % 2 === 0 ? -1 : 1),
        weaponY: c % 2 === 0 ? 0 : -1,
        weaponAngle: c % 2 === 0 ? -8 : 8,
        legL: c % 2 === 0 ? 0 : 1,
        legR: c % 2 === 0 ? 1 : 0,
        alpha: 1,
        flash: false,
      }
    case 2: // attack
      return {
        x: c * 1.5,
        y: 0,
        weaponX: 4 + c * 2,
        weaponY: -2 - c,
        weaponAngle: -25 + c * 20,
        legL: c > 1 ? -1 : 0,
        legR: c > 1 ? 1 : 0,
        alpha: 1,
        flash: false,
      }
    case 3: // hit
      return {
        x: -c,
        y: 0,
        weaponX: 3,
        weaponY: 0,
        weaponAngle: 15,
        legL: 0,
        legR: 0,
        alpha: 1,
        flash: c === 0,
      }
    case 4: // death
      return {
        x: -c,
        y: c * 1.5,
        weaponX: 6 + c,
        weaponY: c * 1.5,
        weaponAngle: 75,
        legL: c,
        legR: -c,
        alpha: Math.max(0.2, 1 - c * 0.2),
        flash: false,
      }
    default:
      return { x: 0, y: 0, weaponX: 4, weaponY: 0, weaponAngle: 0, legL: 0, legR: 0, alpha: 1, flash: false }
  }
}

function drawWeapon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  palette: SpritePalette,
  pose: ReturnType<typeof getPose>
) {
  const type = palette.weaponType ?? 'sword'
  const color = palette.weapon
  const wx = cx + pose.weaponX
  const wy = cy - 10 + pose.weaponY

  ctx.save()
  ctx.translate(wx, wy)
  ctx.rotate((pose.weaponAngle * Math.PI) / 180)

  switch (type) {
    case 'sword': {
      ctx.fillStyle = '#222'
      ctx.fillRect(-2, -1, 3, 3)
      ctx.fillStyle = color
      ctx.fillRect(0, -1, 9, 2)
      break
    }
    case 'dagger': {
      ctx.fillStyle = '#222'
      ctx.fillRect(-2, 0, 2, 2)
      ctx.fillStyle = color
      ctx.fillRect(0, 0, 5, 2)
      break
    }
    case 'axe': {
      ctx.fillStyle = '#3a2a1a'
      ctx.fillRect(-2, 0, 7, 2)
      ctx.fillStyle = color
      ctx.fillRect(4, -3, 5, 5)
      ctx.fillStyle = '#888'
      ctx.fillRect(6, -2, 2, 3)
      break
    }
    case 'mace': {
      ctx.fillStyle = '#3a2a1a'
      ctx.fillRect(-2, 0, 8, 2)
      ctx.fillStyle = color
      ctx.fillRect(6, -2, 4, 4)
      break
    }
    case 'staff': {
      ctx.fillStyle = '#3a2a1a'
      ctx.fillRect(0, -10, 2, 14)
      ctx.fillStyle = palette.detail ?? color
      ctx.fillRect(-1, -12, 4, 4)
      break
    }
    case 'wand': {
      ctx.fillStyle = '#3a2a1a'
      ctx.fillRect(-1, -6, 2, 8)
      ctx.fillStyle = palette.detail ?? color
      ctx.fillRect(-1, -8, 4, 3)
      break
    }
    case 'bow': {
      ctx.fillStyle = '#3a2a1a'
      ctx.fillRect(-1, -8, 2, 14)
      ctx.beginPath()
      ctx.strokeStyle = palette.detail ?? color
      ctx.lineWidth = 1
      ctx.arc(0, 0, 6, -Math.PI / 2, Math.PI / 2)
      ctx.stroke()
      break
    }
    case 'claws': {
      ctx.fillStyle = color
      ctx.fillRect(0, 0, 4, 1)
      ctx.fillRect(0, 2, 4, 1)
      ctx.fillRect(0, 4, 3, 1)
      break
    }
    case 'none':
    default:
      break
  }
  ctx.restore()
}

function drawEntityPose(
  ctx: CanvasRenderingContext2D,
  palette: SpritePalette,
  pose: ReturnType<typeof getPose>
) {
  const skin = palette.skin ?? palette.head
  const centerX = 16 + pose.x
  const centerY = 26 + pose.y
  const scale = palette.scale ?? 1

  ctx.save()
  ctx.globalAlpha = pose.alpha

  if (scale !== 1) {
    ctx.translate(centerX, centerY)
    ctx.scale(scale, scale)
    ctx.translate(-centerX, -centerY)
  }

  if (pose.flash) {
    ctx.save()
    ctx.fillStyle = 'rgba(255,255,255,0.6)'
    ctx.fillRect(0, 0, FRAME_SIZE, FRAME_SIZE)
    ctx.restore()
  }

  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.beginPath()
  ctx.ellipse(centerX, 30, 6, 2, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = palette.head
  ctx.fillRect(centerX - 3, centerY - 16, 6, 5)

  ctx.fillStyle = skin
  ctx.fillRect(centerX - 2, centerY - 12, 4, 3)

  if (palette.isMonster) {
    ctx.fillStyle = '#ff3333'
    ctx.fillRect(centerX + 1, centerY - 14, 2, 1)
    ctx.fillStyle = palette.detail ?? palette.head
    ctx.fillRect(centerX - 3 + (scale > 1 ? 0 : 0), centerY - 19, 6, 2)
  }

  ctx.fillStyle = palette.body
  ctx.fillRect(centerX - 4, centerY - 11, 8, 10)

  ctx.fillStyle = palette.detail ?? palette.body
  ctx.fillRect(centerX - 3, centerY - 3, 6, 2)

  ctx.fillStyle = palette.legs
  ctx.fillRect(centerX - 4, centerY - 1, 3, 4 + pose.legL)
  ctx.fillRect(centerX + 1, centerY - 1, 3, 4 + pose.legR)

  if (palette.shield) {
    ctx.fillStyle = palette.detail ?? '#999'
    ctx.fillRect(centerX - 8, centerY - 9, 3, 7)
  }

  drawWeapon(ctx, centerX, centerY, palette, pose)
  ctx.restore()
}

export function generateEntitySheet(document: Document, spec: SpriteSpec): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = FRAME_SIZE * SHEET_COLS
  canvas.height = FRAME_SIZE * SHEET_ROWS.length
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get 2d context')

  ctx.imageSmoothingEnabled = false
  for (let row = 0; row < SHEET_ROWS.length; row++) {
    for (let col = 0; col < SHEET_COLS; col++) {
      const pose = getPose(row, col)
      ctx.save()
      ctx.translate(col * FRAME_SIZE, row * FRAME_SIZE)
      // clip not necessary; all drawing is local.
      drawEntityPose(ctx, spec.palette, pose)
      ctx.restore()
    }
  }
  return canvas
}

export function getAnimKey(key: string, anim: AnimName): string {
  return `${key}-${anim}`
}

export const HERO_SPECS: SpriteSpec[] = [
  {
    key: 'hero-Knight',
    palette: {
      key: 'Knight',
      body: '#8899a6',
      head: '#e0c39e',
      legs: '#556677',
      weapon: '#d0d0d0',
      skin: '#e0c39e',
      detail: '#9aaab8',
      shield: true,
      weaponType: 'sword',
    },
  },
  {
    key: 'hero-Assassin',
    palette: {
      key: 'Assassin',
      body: '#442244',
      head: '#d0b090',
      legs: '#221122',
      weapon: '#888888',
      skin: '#d0b090',
      detail: '#ff44aa',
      shield: false,
      weaponType: 'dagger',
    },
  },
  {
    key: 'hero-Priest',
    palette: {
      key: 'Priest',
      body: '#e0e0e0',
      head: '#d8c09a',
      legs: '#a09080',
      weapon: '#ffd700',
      skin: '#d8c09a',
      detail: '#ffffff',
      shield: true,
      weaponType: 'mace',
    },
  },
  {
    key: 'hero-Mage',
    palette: {
      key: 'Mage',
      body: '#4a4a8a',
      head: '#c0a98e',
      legs: '#303060',
      weapon: '#88ccff',
      skin: '#c0a98e',
      detail: '#aa55ff',
      shield: false,
      weaponType: 'staff',
    },
  },
  {
    key: 'hero-Archer',
    palette: {
      key: 'Archer',
      body: '#3a7a3a',
      head: '#d2ba91',
      legs: '#264a26',
      weapon: '#8b5a2b',
      skin: '#d2ba91',
      detail: '#5aff8a',
      shield: false,
      weaponType: 'bow',
    },
  },
]

export const MONSTER_SPECS: SpriteSpec[] = [
  {
    key: 'monster-grunt',
    palette: {
      key: 'grunt',
      body: '#558844',
      head: '#77aa66',
      legs: '#335522',
      weapon: '#888888',
      skin: '#77aa66',
      detail: '#aa3333',
      shield: false,
      weaponType: 'dagger',
      isMonster: true,
    },
  },
  {
    key: 'monster-scout',
    palette: {
      key: 'scout',
      body: '#8b5a2b',
      head: '#a07040',
      legs: '#5a3a1b',
      weapon: '#d0b090',
      skin: '#a07040',
      detail: '#ffcc66',
      shield: false,
      weaponType: 'claws',
      isMonster: true,
    },
  },
  {
    key: 'monster-archer',
    palette: {
      key: 'archer',
      body: '#dddddd',
      head: '#bbbbbb',
      legs: '#999999',
      weapon: '#8b5a2b',
      skin: '#bbbbbb',
      detail: '#333333',
      shield: false,
      weaponType: 'bow',
      isMonster: true,
    },
  },
  {
    key: 'monster-mage',
    palette: {
      key: 'mage',
      body: '#301030',
      head: '#806080',
      legs: '#100510',
      weapon: '#aa55ff',
      skin: '#806080',
      detail: '#ff55ff',
      shield: false,
      weaponType: 'wand',
      isMonster: true,
    },
  },
  {
    key: 'monster-shield',
    palette: {
      key: 'shield',
      body: '#aa4444',
      head: '#d0b090',
      legs: '#772222',
      weapon: '#888888',
      skin: '#d0b090',
      detail: '#cccccc',
      shield: true,
      weaponType: 'sword',
      isMonster: true,
    },
  },
  {
    key: 'monster-brute',
    palette: {
      key: 'brute',
      body: '#668844',
      head: '#88aa66',
      legs: '#446622',
      weapon: '#8b5a2b',
      skin: '#88aa66',
      detail: '#cc7744',
      shield: false,
      weaponType: 'mace',
      isMonster: true,
      scale: 1.25,
    },
  },
  {
    key: 'monster-healer',
    palette: {
      key: 'healer',
      body: '#77ccaa',
      head: '#ddddaa',
      legs: '#448877',
      weapon: '#ffd700',
      skin: '#ddddaa',
      detail: '#ffffff',
      shield: false,
      weaponType: 'staff',
      isMonster: true,
    },
  },
  {
    key: 'monster-shadow',
    palette: {
      key: 'shadow',
      body: '#111111',
      head: '#222222',
      legs: '#000000',
      weapon: '#551155',
      skin: '#222222',
      detail: '#ff00ff',
      shield: false,
      weaponType: 'dagger',
      isMonster: true,
    },
  },
  {
    key: 'monster-boss-warden',
    palette: {
      key: 'boss-warden',
      body: '#4a5568',
      head: '#d0b090',
      legs: '#2a3548',
      weapon: '#c0c0c0',
      skin: '#d0b090',
      detail: '#ffd700',
      shield: true,
      weaponType: 'axe',
      isMonster: true,
      scale: 1.35,
    },
  },
  {
    key: 'monster-boss-tyrant',
    palette: {
      key: 'boss-tyrant',
      body: '#4a1010',
      head: '#884444',
      legs: '#300505',
      weapon: '#ff4444',
      skin: '#884444',
      detail: '#ffaa00',
      shield: false,
      weaponType: 'mace',
      isMonster: true,
      scale: 1.4,
    },
  },
]

export const PET_SPECS: SpriteSpec[] = [
  {
    key: 'pet-dragon',
    palette: {
      key: 'dragon',
      body: '#4488cc',
      head: '#66aaff',
      legs: '#224477',
      weapon: '#ff9955',
      skin: '#66aaff',
      detail: '#ccff55',
      isMonster: false,
      weaponType: 'none',
      scale: 0.7,
    },
  },
  {
    key: 'pet-fox',
    palette: {
      key: 'fox',
      body: '#ff9955',
      head: '#ffcc88',
      legs: '#cc6633',
      weapon: '#ffffff',
      skin: '#ffcc88',
      detail: '#ffffff',
      isMonster: false,
      weaponType: 'none',
      scale: 0.65,
    },
  },
  {
    key: 'pet-wolf',
    palette: {
      key: 'wolf',
      body: '#778899',
      head: '#aabbcc',
      legs: '#556677',
      weapon: '#ffffff',
      skin: '#aabbcc',
      detail: '#ffffff',
      isMonster: false,
      weaponType: 'none',
      scale: 0.7,
    },
  },
]

export type EffectName = 'slash' | 'fireball' | 'arrow' | 'heal' | 'hit' | 'buff' | 'levelup' | 'projectile'

export function generateEffectSheet(document: Document, effect: EffectName): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = FRAME_SIZE * SHEET_COLS
  canvas.height = FRAME_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get 2d context')
  ctx.imageSmoothingEnabled = false

  for (let col = 0; col < SHEET_COLS; col++) {
    ctx.save()
    ctx.translate(col * FRAME_SIZE, 0)
    switch (effect) {
      case 'slash': {
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(4 + col * 2, 26)
        ctx.lineTo(22 + col * 2, 6)
        ctx.stroke()
        ctx.strokeStyle = '#ddddff'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(6 + col * 2, 28)
        ctx.lineTo(24 + col * 2, 8)
        ctx.stroke()
        break
      }
      case 'fireball': {
        const r = 6 + col * 2
        ctx.fillStyle = '#ff6600'
        ctx.beginPath()
        ctx.arc(16, 16, r, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#ffcc00'
        ctx.beginPath()
        ctx.arc(16 - col, 16 - col, r * 0.5, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#ff3300'
        for (let i = 0; i < 3; i++) {
          const angle = col + i * 2
          ctx.beginPath()
          ctx.arc(16 + Math.cos(angle) * r * 0.6, 16 + Math.sin(angle) * r * 0.6, 2, 0, Math.PI * 2)
          ctx.fill()
        }
        break
      }
      case 'arrow':
      case 'projectile': {
        const shift = col * 5
        ctx.fillStyle = effect === 'projectile' ? '#88ccff' : '#d0b090'
        ctx.fillRect(4 + shift, 14, 18, 2)
        ctx.fillStyle = '#fff'
        ctx.beginPath()
        ctx.moveTo(22 + shift, 12)
        ctx.lineTo(28 + shift, 15)
        ctx.lineTo(22 + shift, 18)
        ctx.fill()
        if (effect === 'projectile') {
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.arc(16 + shift, 15, 3, 0, Math.PI * 2)
          ctx.fill()
        }
        break
      }
      case 'heal': {
        const pulse = 1 + col * 0.15
        ctx.fillStyle = `rgba(50,255,120,${0.5 + col * 0.1})`
        ctx.beginPath()
        ctx.arc(16, 16, 8 * pulse, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#ccffee'
        const t = 5 * pulse
        ctx.fillRect(16 - t, 16 - 2, t * 2, 4)
        ctx.fillRect(16 - 2, 16 - t, 4, t * 2)
        break
      }
      case 'hit': {
        const s = 4 + col * 3
        ctx.fillStyle = '#ffff00'
        ctx.beginPath()
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4 + col * 0.2
          const r = i % 2 === 0 ? s : s * 0.5
          ctx.lineTo(16 + Math.cos(a) * r, 16 + Math.sin(a) * r)
        }
        ctx.closePath()
        ctx.fill()
        ctx.fillStyle = '#ff4444'
        ctx.beginPath()
        ctx.arc(16, 16, s * 0.4, 0, Math.PI * 2)
        ctx.fill()
        break
      }
      case 'buff': {
        const h = 10 + col * 3
        ctx.fillStyle = '#44aaff'
        ctx.beginPath()
        ctx.moveTo(10, 26)
        ctx.lineTo(16, 26 - h)
        ctx.lineTo(22, 26)
        ctx.fill()
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(15, 26 - h - 3, 2, 3)
        break
      }
      case 'levelup': {
        const rot = col * 0.5
        ctx.fillStyle = '#ffd700'
        ctx.beginPath()
        for (let i = 0; i < 5; i++) {
          let a = (i * Math.PI * 2) / 5 - Math.PI / 2 + rot
          const r = 10
          ctx.lineTo(16 + Math.cos(a) * r, 16 + Math.sin(a) * r)
          a += Math.PI / 5
          ctx.lineTo(16 + Math.cos(a) * (r * 0.4), 16 + Math.sin(a) * (r * 0.4))
        }
        ctx.closePath()
        ctx.fill()
        break
      }
    }
    ctx.restore()
  }
  return canvas
}

export function generateBackground(
  document: Document,
  kind: 'sky' | 'mountains' | 'ground'
): HTMLCanvasElement {
  const width = 512
  const height = kind === 'ground' ? 128 : 256
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get 2d context')

  if (kind === 'sky') {
    const grad = ctx.createLinearGradient(0, 0, 0, height)
    grad.addColorStop(0, '#050510')
    grad.addColorStop(0.5, '#10102a')
    grad.addColorStop(1, '#1a1a3e')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = '#ffffff'
    for (let i = 0; i < 40; i++) {
      const x = (i * 137) % width
      const y = (i * 53) % (height / 2)
      const r = (i % 3 === 0) ? 2 : 1
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }
    // distant nebula
    for (let i = 0; i < 3; i++) {
      const g = ctx.createRadialGradient(i * 180 + 60, 80, 0, i * 180 + 60, 80, 120)
      g.addColorStop(0, 'rgba(80,40,120,0.15)')
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, width, height)
    }
  } else if (kind === 'mountains') {
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = '#0f0f25'
    ctx.beginPath()
    ctx.moveTo(0, height)
    for (let x = 0; x <= width; x += 32) {
      const y = height - 60 - Math.sin(x * 0.02) * 20 - Math.cos(x * 0.05) * 15
      ctx.lineTo(x, y)
    }
    ctx.lineTo(width, height)
    ctx.fill()

    ctx.fillStyle = '#141430'
    ctx.beginPath()
    ctx.moveTo(0, height)
    for (let x = 0; x <= width; x += 24) {
      const y = height - 30 - Math.sin(x * 0.03 + 1) * 12 - Math.cos(x * 0.07) * 8
      ctx.lineTo(x, y)
    }
    ctx.lineTo(width, height)
    ctx.fill()
  } else if (kind === 'ground') {
    const grad = ctx.createLinearGradient(0, 0, 0, height)
    grad.addColorStop(0, '#1a1a2e')
    grad.addColorStop(1, '#0a0a15')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = '#252540'
    for (let x = 0; x < width; x += 48) {
      ctx.beginPath()
      ctx.ellipse(x + 24, 20 + Math.sin(x) * 4, 8, 3, 0, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#151525'
    for (let x = 0; x < width; x += 96) {
      ctx.fillRect(x, 60, 6, 4)
      ctx.fillRect(x + 30, 80, 8, 3)
    }
  }
  return canvas
}

export function generateBarTexture(
  document: Document,
  color: 'green' | 'red' | 'yellow',
  background: boolean
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 8
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Could not get 2d context')

  const colors = {
    green: background ? '#223322' : '#44aa44',
    red: background ? '#332222' : '#aa4444',
    yellow: background ? '#333322' : '#aaaa44',
  }

  ctx.fillStyle = colors[color]
  ctx.fillRect(0, 0, 64, 8)
  if (!background) {
    ctx.fillStyle = 'rgba(255,255,255,0.2)'
    ctx.fillRect(0, 0, 64, 2)
  } else {
    ctx.strokeStyle = 'rgba(255,255,255,0.15)'
    ctx.strokeRect(0.5, 0.5, 63, 7)
  }
  return canvas
}
