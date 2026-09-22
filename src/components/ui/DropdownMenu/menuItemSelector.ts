/**
 * Everything inside a dropdown that can take focus, in the order the arrows should walk it.
 *
 * **Anchors as well as buttons**, and that is not defensive breadth: the language menus render their
 * items as real links on purpose, so they can be middle-clicked and copied. A selector that only
 * knew about buttons found nothing there — the menu opened with focus left on the trigger, and the
 * arrows had nothing to move.
 *
 * One constant because two places need the same answer: `DropdownMenu` walks these with the arrow
 * keys, and `useDropdownMenu` focuses the first of them when a menu is opened from the keyboard.
 */
export const MENU_ITEM_SELECTOR = 'button:not([disabled]), a[href]'
