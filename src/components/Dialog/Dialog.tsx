import { useEffect, useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'

import { Panel } from '../ui'
import styles from './Dialog.module.css'

type DialogProps = {
  title: string
  description?: ReactNode
  actions: ReactNode
  labelledById: string
  describedById?: string
  /**
   * Dismiss. Wired to Escape **and** a click on the backdrop, so every dialog gets both for free —
   * the two editor dialogs previously had neither, and were only closable by hitting Cancel.
   *
   * Omit it for a dialog that genuinely must not be dismissed without a decision. Nothing does
   * today: even the delete confirmation should cancel on Escape, which is what a player expects.
   */
  onClose?: () => void
  onBackdropPointerDown?: (event: ReactPointerEvent<HTMLDivElement>) => void
  role?: 'dialog' | 'alertdialog'
  className?: string
  descriptionClassName?: string
  actionsClassName?: string
}

/** Everything that can hold focus inside the panel, in DOM order. */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

export function Dialog({
  title,
  description,
  actions,
  labelledById,
  describedById,
  onClose,
  onBackdropPointerDown,
  role = 'dialog',
  className,
  descriptionClassName,
  actionsClassName,
}: DialogProps) {
  // On the backdrop rather than the panel: `Panel` types its props with `ComponentPropsWithoutRef`,
  // so it takes no ref. The backdrop contains nothing but the panel, so every query below finds the
  // same elements either way.
  const backdropRef = useRef<HTMLDivElement | null>(null)
  /**
   * Held in a ref so the effect below can run **once**, on open.
   *
   * Callers pass an inline function, so `onClose` is a new identity on every parent render. With it
   * in the dependency array the whole effect would tear down and set up again on each one — which
   * means re-running "move focus to the first action". A player halfway through tabbing to *Next
   * Level* would be yanked back to *Back* by an unrelated state change.
   */
  const onCloseRef = useRef(onClose)
  const dialogClassName = className ? `${styles.dialog} ${className}` : styles.dialog
  const resolvedActionsClassName = actionsClassName
    ? `${styles.actions} ${actionsClassName}`
    : styles.actions

  // Synced in an effect rather than during render: writing a ref while rendering is not safe under
  // concurrent React, and the compiler's lint rule says so. The initial value is already the
  // mount-time `onClose`, so the handler below is correct from the first keystroke.
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  /**
   * Move focus in, keep it in, and put it back.
   *
   * `aria-modal="true"` was already being set, which *tells* a screen reader the rest of the page is
   * inert — but nothing made it true. Focus stayed on whatever the player had clicked, Tab walked
   * straight out into the page behind, and a keyboard or screen-reader user could be reading the
   * board while a modal claimed to own the screen. The attribute was a promise the component did
   * not keep.
   */
  useEffect(() => {
    const backdrop = backdropRef.current

    if (!backdrop) {
      return
    }

    const previouslyFocused = document.activeElement as HTMLElement | null

    function getFocusable() {
      return Array.from(
        backdrop?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [],
      ).filter((element) => element.offsetParent !== null || element === document.activeElement)
    }

    // The first action, not the panel: a dialog that opens with focus on its confirm button reads
    // its own title first and leaves the player one key from the thing they came to do.
    const panel = backdrop.querySelector<HTMLElement>('[role="dialog"], [role="alertdialog"]')
    const initial = getFocusable()[0] ?? panel
    initial?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && onCloseRef.current) {
        event.preventDefault()
        onCloseRef.current()
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const focusable = getFocusable()

      if (focusable.length === 0) {
        event.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      // Wrap at both ends. Without this the browser's own order takes over at the edges and lands
      // on the page behind, which is the part `aria-modal` says does not exist.
      if (event.shiftKey && (active === first || !backdrop?.contains(active))) {
        event.preventDefault()
        last.focus()
        return
      }

      if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true)
      // Back where they were, so dismissing a dialog does not dump focus at the top of the page.
      previouslyFocused?.focus?.()
    }
    // Open once, trap once, restore once — see `onCloseRef` for why nothing belongs in here.
  }, [])

  function handleBackdropPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (onBackdropPointerDown) {
      onBackdropPointerDown(event)
      return
    }

    // Only the backdrop itself — a pointerdown that bubbled up from inside the panel is not a
    // dismissal.
    if (onCloseRef.current && event.target === event.currentTarget) {
      onCloseRef.current()
    }
  }

  return (
    <div ref={backdropRef} className={styles.backdrop} onPointerDown={handleBackdropPointerDown}>
      <Panel
        as="section"
        className={dialogClassName}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledById}
        aria-describedby={describedById}
        tabIndex={-1}
      >
        <h2 id={labelledById}>{title}</h2>
        {description ? (
          <div id={describedById} className={descriptionClassName}>
            {description}
          </div>
        ) : null}
        <div className={resolvedActionsClassName}>{actions}</div>
      </Panel>
    </div>
  )
}
