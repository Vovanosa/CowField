import { useTranslation } from 'react-i18next'

import { Dialog } from '../Dialog'
import { Button } from '../ui'
import styles from './KeyboardShortcutsDialog.module.css'

type KeyboardShortcutsDialogProps = {
  onClose: () => void
}

/**
 * What the keyboard does **while playing a level**. Nothing else.
 *
 * Choosing a difficulty or a level with the arrow keys works too, and is deliberately not listed:
 * arrows moving through a list of things is what arrows do everywhere, and a help sheet earns its
 * length by covering what a player could not have guessed.
 *
 * **The key legends are not translated, and the descriptions are.** `Shift`, `Esc` and `Backspace`
 * are what is printed on the key in front of the player, in every locale this site ships; the
 * arrows are drawn as arrows for the same reason. Translating a legend would describe a keyboard
 * nobody has.
 */
export function KeyboardShortcutsDialog({ onClose }: KeyboardShortcutsDialogProps) {
  const { t } = useTranslation()

  const shortcuts: Array<{ keys: string[]; description: string }> = [
    { keys: ['↑', '↓', '←', '→'], description: t('Move between cells') },
    { keys: ['W', 'A', 'S', 'D'], description: t('Move between cells, same as the arrows') },
    { keys: ['Shift', '+', '→'], description: t('Jump to the edge of the board') },
    { keys: ['Space'], description: t('Dot, then bull, then empty') },
    { keys: ['Shift', '+', 'Space'], description: t('Place or remove a bull') },
    { keys: ['Space', '+', '→'], description: t('Hold Space and move to draw dots') },
    { keys: ['Backspace'], description: t('Clear the cell') },
    { keys: ['Ctrl', '+', 'Z'], description: t('Undo') },
    { keys: ['Ctrl', '+', 'Shift', '+', 'Backspace'], description: t('Restart the level') },
    { keys: ['Esc'], description: t('Leave the board') },
    { keys: ['?'], description: t('Open or close this list') },
  ]

  return (
    <Dialog
      title={t('Keyboard shortcuts')}
      labelledById="keyboard-shortcuts-title"
      describedById="keyboard-shortcuts-hint"
      onClose={onClose}
      className={styles.dialog}
      actions={
        <Button variant="primary" onClick={onClose}>
          {t('Close')}
        </Button>
      }
      description={
        <>
          <dl className={styles.list}>
            {shortcuts.map((shortcut) => (
              <div className={styles.row} key={shortcut.keys.join('-')}>
                <dt className={styles.keys}>
                  {shortcut.keys.map((key, position) =>
                    key === '+' ? (
                      // Position is part of the key because a chord can hold two separators.
                      <span className={styles.plus} key={`${key}-${position}`} aria-hidden="true">
                        +
                      </span>
                    ) : (
                      <kbd className={styles.key} key={`${key}-${position}`}>
                        {key}
                      </kbd>
                    ),
                  )}
                </dt>
                <dd className={styles.description}>{shortcut.description}</dd>
              </div>
            ))}
          </dl>
          <p className={styles.hint}>{t('Press ? while playing to open or close this list.')}</p>
        </>
      }
    />
  )
}
