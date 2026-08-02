import Phaser from 'phaser'
import {
  FRAME_SIZE,
  SHEET_ROWS,
  generateEntitySheet,
  generateEffectSheet,
  generateBackground,
  generateBarTexture,
  HERO_SPECS,
  MONSTER_SPECS,
  PET_SPECS,
  type EffectName,
  type AnimName,
  type SpriteSpec,
} from './sprite-gen'

export type { EffectName } from './sprite-gen'

export const EFFECTS: EffectName[] = ['slash', 'fireball', 'arrow', 'heal', 'hit', 'buff', 'levelup', 'projectile']

export const BACKGROUNDS = ['bg-sky', 'bg-mountains', 'bg-ground'] as const

export const UI_TEXTURES = ['ui-hp-bg', 'ui-hp-fill', 'ui-xp-bg', 'ui-xp-fill'] as const

export function preloadGameAssets(scene: Phaser.Scene): void {
  HERO_SPECS.forEach((spec) => addEntitySheet(scene, spec))
  MONSTER_SPECS.forEach((spec) => addEntitySheet(scene, spec))
  PET_SPECS.forEach((spec) => addEntitySheet(scene, spec))

  EFFECTS.forEach((effect) => {
    const canvas = generateEffectSheet(document, effect)
    const key = `fx-${effect}`
    scene.textures.addSpriteSheet(key, canvas as unknown as HTMLImageElement, {
      frameWidth: FRAME_SIZE,
      frameHeight: FRAME_SIZE,
    })
    scene.anims.create({
      key,
      frames: scene.anims.generateFrameNumbers(key, { start: 0, end: 3 }),
      frameRate: 12,
      repeat: -1,
    })
  })

  const sky = generateBackground(document, 'sky')
  scene.textures.addCanvas('bg-sky', sky)

  const mountains = generateBackground(document, 'mountains')
  scene.textures.addCanvas('bg-mountains', mountains)

  const ground = generateBackground(document, 'ground')
  scene.textures.addCanvas('bg-ground', ground)

  const hpBg = generateBarTexture(document, 'green', true)
  scene.textures.addCanvas('ui-hp-bg', hpBg)

  const hpFill = generateBarTexture(document, 'green', false)
  scene.textures.addCanvas('ui-hp-fill', hpFill)
}

function addEntitySheet(scene: Phaser.Scene, spec: SpriteSpec): void {
  const canvas = generateEntitySheet(document, spec)
  scene.textures.addSpriteSheet(spec.key, canvas as unknown as HTMLImageElement, {
    frameWidth: FRAME_SIZE,
    frameHeight: FRAME_SIZE,
  })

  SHEET_ROWS.forEach((row, rowIndex) => {
    const animKey = `${spec.key}-${row}`
    scene.anims.create({
      key: animKey,
      frames: scene.anims.generateFrameNumbers(spec.key, {
        start: rowIndex * 4,
        end: rowIndex * 4 + 3,
      }),
      frameRate: row === 'attack' || row === 'hit' || row === 'death' ? 10 : 7,
      repeat: row === 'attack' || row === 'hit' || row === 'death' ? 0 : -1,
    })
  })
}

export function playEntityAnim(
  sprite: Phaser.GameObjects.Sprite,
  textureKey: string,
  anim: AnimName,
  ignoreIfPlaying = false
): void {
  const key = `${textureKey}-${anim}`
  if (ignoreIfPlaying && sprite.anims.currentAnim?.key === key) return
  sprite.anims.play(key, true)
}

export function getHeroTextureKey(name: string): string {
  const map: Record<string, string> = {
    Ironclad: 'hero-Knight',
    Blazefang: 'hero-Assassin',
    Windsong: 'hero-Priest',
    Frostweaver: 'hero-Mage',
  }
  return map[name] ?? 'hero-Knight'
}

export function getPetTextureKey(index: number): string {
  const keys = ['pet-dragon', 'pet-fox', 'pet-wolf']
  return keys[index % keys.length]
}

export function getMonsterTextureKey(monsterId: string): string {
  return `monster-${monsterId}`
}

export function getEffectKey(effect: EffectName): string {
  return `fx-${effect}`
}
