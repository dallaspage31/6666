export type SfxName =
  | 'attack'
  | 'hit'
  | 'heal'
  | 'crit'
  | 'ultimate'
  | 'level-up'
  | 'wave-start'
  | 'victory'
  | 'defeat'

let audioContext: AudioContext | null = null
let muted = false
let volume = 0.7

function getContext(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null
  audioContext ??= new AudioContext()
  if (audioContext.state === 'suspended') void audioContext.resume()
  return audioContext
}

export function setSfxMuted(value: boolean): void {
  muted = value
}

export function setSfxVolume(value: number): void {
  volume = Math.max(0, Math.min(1, value))
}

export function getSfxVolume(): number {
  return volume
}

export function isSfxMuted(): boolean {
  return muted
}

export function playSfx(name: SfxName): void {
  if (muted) return
  const context = getContext()
  if (!context) return
  const now = context.currentTime
  const settings: Record<SfxName, { frequency: number; duration: number; type: OscillatorType; gain: number; slide?: number }> = {
    attack: { frequency: 180, duration: 0.08, type: 'square', gain: 0.04, slide: 90 },
    hit: { frequency: 90, duration: 0.12, type: 'sawtooth', gain: 0.05, slide: -35 },
    heal: { frequency: 440, duration: 0.2, type: 'sine', gain: 0.04, slide: 220 },
    crit: { frequency: 260, duration: 0.18, type: 'square', gain: 0.06, slide: 520 },
    ultimate: { frequency: 110, duration: 0.4, type: 'sawtooth', gain: 0.07, slide: 440 },
    'level-up': { frequency: 330, duration: 0.35, type: 'sine', gain: 0.05, slide: 660 },
    'wave-start': { frequency: 150, duration: 0.25, type: 'triangle', gain: 0.05, slide: 300 },
    victory: { frequency: 392, duration: 0.5, type: 'triangle', gain: 0.06, slide: 784 },
    defeat: { frequency: 120, duration: 0.5, type: 'sawtooth', gain: 0.05, slide: 50 },
  }
  const sound = settings[name]
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = sound.type
  oscillator.frequency.setValueAtTime(sound.frequency, now)
  if (sound.slide) oscillator.frequency.linearRampToValueAtTime(sound.slide, now + sound.duration)
  gain.gain.setValueAtTime(sound.gain * volume, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + sound.duration)
  oscillator.connect(gain).connect(context.destination)
  oscillator.start(now)
  oscillator.stop(now + sound.duration)
}
