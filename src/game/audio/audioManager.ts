import type { PlayerSettings } from '../types'

type SoundEffectName =
  | 'placeBull'
  | 'placeDot'
  | 'clearCell'
  | 'undo'
  | 'restart'
  | 'levelComplete'
  | 'uiClick'

type MusicTrackName = 'gameLoop'

type AudioAssetConfig = {
  src: string
  minIntervalMs?: number
}

const SOUND_EFFECTS: Record<SoundEffectName, AudioAssetConfig> = {
  placeBull: { src: '/audio/sfx/place-bull.mp3', minIntervalMs: 70 },
  placeDot: { src: '/audio/sfx/place-dot.mp3', minIntervalMs: 50 },
  clearCell: { src: '/audio/sfx/clear-cell.mp3', minIntervalMs: 50 },
  undo: { src: '/audio/sfx/undo.mp3', minIntervalMs: 120 },
  restart: { src: '/audio/sfx/restart.mp3', minIntervalMs: 180 },
  levelComplete: { src: '/audio/sfx/level-complete.mp3', minIntervalMs: 500 },
  uiClick: { src: '/audio/sfx/ui-click.mp3', minIntervalMs: 80 },
}

const MUSIC_TRACKS: Record<MusicTrackName, string> = {
  gameLoop: '/audio/music/game-loop.mp3',
}

const MUSIC_FADE_DURATION_MS = 320

let currentSettings: PlayerSettings | null = null
let unlockListenersBound = false
let isAudioUnlocked = false
let currentMusicTrack: MusicTrackName | null = null
let musicElement: HTMLAudioElement | null = null
let musicFadeFrameId: number | null = null
const soundEffectTemplates = new Map<SoundEffectName, HTMLAudioElement>()
const lastPlayedAtByEffect = new Map<SoundEffectName, number>()

function getSafeVolume(value: number | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0.5
  }

  return Math.min(1, Math.max(0, value / 100))
}

function swallowPlaybackError(error: unknown) {
  if (import.meta.env.DEV) {
    console.debug('Audio playback skipped.', error)
  }
}

function updateMusicVolume() {
  if (!musicElement) {
    return
  }

  musicElement.volume = getSafeVolume(currentSettings?.musicVolume)
}

function clearMusicFade() {
  if (musicFadeFrameId === null || typeof window === 'undefined') {
    return
  }

  window.cancelAnimationFrame(musicFadeFrameId)
  musicFadeFrameId = null
}

function fadeMusicVolume(
  nextMusicElement: HTMLAudioElement,
  fromVolume: number,
  toVolume: number,
  onComplete?: () => void,
) {
  if (typeof window === 'undefined') {
    nextMusicElement.volume = toVolume
    onComplete?.()
    return
  }

  clearMusicFade()

  const startedAt = performance.now()

  function tick(now: number) {
    const elapsed = now - startedAt
    const progress = Math.min(elapsed / MUSIC_FADE_DURATION_MS, 1)
    nextMusicElement.volume = fromVolume + (toVolume - fromVolume) * progress

    if (progress >= 1) {
      musicFadeFrameId = null
      onComplete?.()
      return
    }

    musicFadeFrameId = window.requestAnimationFrame(tick)
  }

  nextMusicElement.volume = fromVolume
  musicFadeFrameId = window.requestAnimationFrame(tick)
}

function pauseMusicWithFade() {
  if (!musicElement) {
    return
  }

  const activeMusicElement = musicElement
  const currentVolume = activeMusicElement.volume

  if (currentVolume <= 0.001) {
    activeMusicElement.pause()
    activeMusicElement.currentTime = 0
    return
  }

  fadeMusicVolume(activeMusicElement, currentVolume, 0, () => {
    activeMusicElement.pause()
    activeMusicElement.currentTime = 0
  })
}

function bindUnlockListeners() {
  if (unlockListenersBound || typeof window === 'undefined') {
    return
  }

  unlockListenersBound = true

  const unlockAudio = () => {
    isAudioUnlocked = true
  }

  window.addEventListener('pointerdown', unlockAudio, { passive: true })
  window.addEventListener('keydown', unlockAudio, { passive: true })
}

function getSoundEffectTemplate(name: SoundEffectName) {
  const existingTemplate = soundEffectTemplates.get(name)

  if (existingTemplate) {
    return existingTemplate
  }

  const template = new Audio(SOUND_EFFECTS[name].src)
  template.preload = 'auto'
  soundEffectTemplates.set(name, template)
  return template
}

function ensureMusicElement(track: MusicTrackName) {
  const expectedSrc = MUSIC_TRACKS[track]

  if (musicElement && currentMusicTrack === track) {
    return musicElement
  }

  if (musicElement) {
    musicElement.pause()
    musicElement = null
  }

  const nextMusicElement = new Audio(expectedSrc)
  nextMusicElement.loop = true
  nextMusicElement.preload = 'auto'
  nextMusicElement.addEventListener('error', swallowPlaybackError)
  musicElement = nextMusicElement
  currentMusicTrack = track
  updateMusicVolume()

  return nextMusicElement
}

export function initializeAudio() {
  bindUnlockListeners()
}

export function syncAudioSettings(settings: PlayerSettings) {
  currentSettings = settings

  if (!settings.musicEnabled) {
    pauseMusicWithFade()
    return
  }

  updateMusicVolume()
}

export function playSoundEffect(name: SoundEffectName) {
  if (
    typeof window === 'undefined' ||
    !isAudioUnlocked ||
    !currentSettings?.soundEffectsEnabled
  ) {
    return
  }

  const config = SOUND_EFFECTS[name]
  const now = performance.now()
  const lastPlayedAt = lastPlayedAtByEffect.get(name) ?? -Infinity

  if (config.minIntervalMs && now - lastPlayedAt < config.minIntervalMs) {
    return
  }

  lastPlayedAtByEffect.set(name, now)

  try {
    const effect = getSoundEffectTemplate(name).cloneNode(true) as HTMLAudioElement
    effect.volume = getSafeVolume(currentSettings.soundEffectsVolume)
    void effect.play().catch(swallowPlaybackError)
  } catch (error) {
    swallowPlaybackError(error)
  }
}

export function startMusic(track: MusicTrackName) {
  if (
    typeof window === 'undefined' ||
    !isAudioUnlocked ||
    !currentSettings?.musicEnabled
  ) {
    return
  }

  try {
    const nextMusicElement = ensureMusicElement(track)
    const targetVolume = getSafeVolume(currentSettings.musicVolume)

    if (!nextMusicElement.paused) {
      fadeMusicVolume(nextMusicElement, nextMusicElement.volume, targetVolume)
      return
    }

    nextMusicElement.volume = 0
    void nextMusicElement.play().then(() => {
      fadeMusicVolume(nextMusicElement, 0, targetVolume)
    }).catch(swallowPlaybackError)
  } catch (error) {
    swallowPlaybackError(error)
  }
}

export function stopMusic() {
  pauseMusicWithFade()
}
