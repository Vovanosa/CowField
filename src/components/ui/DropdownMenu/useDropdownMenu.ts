import { useEffect, type RefObject } from 'react'

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
}
