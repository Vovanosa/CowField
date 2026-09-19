import styles from './DropdownMenu.module.css'

/**
 * The dropdown item's classes, for the rare item that cannot be a `<button>`.
 *
 * `DropdownMenuItem` covers every item that *does* something, and it is the one to reach for. An
 * item that **goes somewhere** has to be an `<a>`: `LanguageSwitcher`'s two language options are
 * links so the URL is real — copyable, middle-clickable, and visible to a crawler that never opens
 * the menu. They reach the item styling through here rather than by duplicating it or by making
 * `DropdownMenuItem` polymorphic for a single caller.
 *
 * It lives in its own file because `react-refresh/only-export-components` does not allow a component
 * file to export anything else, which is the same reason `useDropdownMenu` sits beside it.
 */
export function dropdownMenuItemClassName(active = false, className?: string) {
  return [styles.item, active ? styles.itemActive : '', className ?? ''].filter(Boolean).join(' ')
}
