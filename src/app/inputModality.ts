/**
 * Which input device the player is using *right now* — keyboard or pointer.
 *
 * Two things need this and neither can be done well without it:
 *
 * 1. **Where focus goes when a game page opens.** Focusing the board unconditionally seizes the
 *    arrow keys from a mouse player who is only trying to scroll, with no visible cursor to explain
 *    why. Focusing it only for someone who arrived *by keyboard* is invisible to everyone else and
 *    lands a keyboard player on the board already playing.
 * 2. **Whether the board's focus ring is drawn.** `:focus-visible` is a browser heuristic, and the
 *    case that matters most here — focus moved by script, which is what the roving `tabIndex` and
 *    the autofocus both do — is exactly the case it is not guaranteed to match. The modality is
 *    written to `<html data-input-modality>` so CSS can be explicit instead of hopeful.
 *
 * This is the same signal browsers use for `:focus-visible`; it is kept separately because we need
 * to *read* it in JavaScript, which the pseudo-class does not allow.
 */

export type InputModality = 'keyboard' | 'pointer'

let currentModality: InputModality = 'pointer'
let isTracking = false

/**
 * Keys that mean "I am driving with the keyboard". Deliberately not every key: a player typing
 * their email into a login form is using the keyboard, but nothing about that should change how the
 * page behaves, and `Tab` alone is too narrow — arrows and Space are how this game is played.
 */
function isNavigationKey(event: KeyboardEvent) {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return false
  }

  return (
    event.key === 'Tab' ||
    event.key === 'Enter' ||
    event.key === ' ' ||
    event.key === 'Spacebar' ||
    event.key.startsWith('Arrow') ||
    event.key === 'Home' ||
    event.key === 'End' ||
    event.key === 'PageUp' ||
    event.key === 'PageDown' ||
    event.code === 'KeyW' ||
    event.code === 'KeyA' ||
    event.code === 'KeyS' ||
    event.code === 'KeyD'
  )
}

function setModality(next: InputModality) {
  if (currentModality === next) {
    return
  }

  currentModality = next

  if (typeof document !== 'undefined') {
    document.documentElement.dataset.inputModality = next
  }
}

export function getInputModality(): InputModality {
  return currentModality
}

/**
 * Starts tracking, once. Listeners are on the capture phase so they see the event whatever a
 * handler downstream does with it, and `pointerdown` rather than `mousedown` so a touch counts too.
 */
export function startInputModalityTracking() {
  if (isTracking || typeof document === 'undefined') {
    return
  }

  isTracking = true
  document.documentElement.dataset.inputModality = currentModality

  document.addEventListener(
    'keydown',
    (event) => {
      if (isNavigationKey(event)) {
        setModality('keyboard')
      }
    },
    { capture: true },
  )

  document.addEventListener('pointerdown', () => setModality('pointer'), { capture: true })
}
