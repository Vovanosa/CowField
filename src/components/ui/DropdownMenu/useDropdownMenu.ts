import { useEffect, type RefObject } from 'react'

import { getInputModality } from '../../../app/inputModality'
import { MENU_ITEM_SELECTOR } from './menuItemSelector'

type UseDropdownMenuArgs<T extends HTMLElement> = {
  containerRef: RefObject<T | null>
  isOpen: boolean
  onClose: () => void
}

export function useDropdownMenu<T extends HTMLElement = HTMLDivElement>({
  containerRef,
  isOpen,
  onClose,
}: UseDropdownMenuArgs<T>) {
  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handlePointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        onClose()
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [containerRef, isOpen, onClose])

  /**
   * Opened with the keyboard, so land on the first item.
   *
   * `DropdownMenu` moves focus between items with the arrows, and arrows can only move focus that is
   * already inside the menu — without this, opening one with Enter left focus on the trigger and the
   * arrows did nothing, which is the same trap the board was in.
   *
   * Asks the modality rather than doing it always: a menu opened by mouse that steals focus is a
   * menu that scrolls the page when the player next presses an arrow.
   */
  useEffect(() => {
    if (!isOpen || getInputModality() !== 'keyboard') {
      return
    }

    const menu = containerRef.current?.querySelector('[role="menu"], [role="listbox"]')

    menu?.querySelector<HTMLElement>(MENU_ITEM_SELECTOR)?.focus()
  }, [containerRef, isOpen])
}
