export type ArrowDirection = 'up' | 'down' | 'left' | 'right'

/**
 * Arrow keys by the character they produce, `WASD` by the key's **physical position**.
 *
 * That split is the whole reason this game has no letter shortcuts. `event.key` reports the
 * character the layout produces — on a Ukrainian layout the physical W key returns `ц`, so a
 * mnemonic read from `key` dies the moment someone switches layout. `event.code` reports the
 * position, which is what a hand resting on `WASD` actually means, and is identical everywhere.
 *
 * Lives here rather than beside the board because four surfaces navigate with the same four keys:
 * the board, the level grid, the difficulty chips and the dropdown menus. One answer to "which way
 * is this key pointing", and `WASD` cannot work in one of them and not the others.
 */
export function toArrowDirection(key: string, code: string): ArrowDirection | null {
  switch (key) {
    case 'ArrowUp':
      return 'up'
    case 'ArrowDown':
      return 'down'
    case 'ArrowLeft':
      return 'left'
    case 'ArrowRight':
      return 'right'
    default:
      break
  }

  switch (code) {
    case 'KeyW':
      return 'up'
    case 'KeyS':
      return 'down'
    case 'KeyA':
      return 'left'
    case 'KeyD':
      return 'right'
    default:
      return null
  }
}

/** Only the fields the direction helpers read, so they stay testable without a DOM event. */
export type ArrowKeyInput = {
  key: string
  code: string
  shiftKey: boolean
  ctrlKey: boolean
  metaKey: boolean
  altKey: boolean
}

/**
 * Whether this key press is a plain arrow move — no `Ctrl`, `Meta` or `Alt`.
 *
 * Without the guard, `Ctrl` + `A` walks the cursor left instead of selecting, and `Ctrl` + `S`
 * moves down instead of reaching the browser. `Shift` is *not* excluded: on the board it means
 * "jump to the edge", so each caller decides what it means for them.
 */
export function isPlainArrowInput(input: ArrowKeyInput) {
  return !input.ctrlKey && !input.metaKey && !input.altKey
}
