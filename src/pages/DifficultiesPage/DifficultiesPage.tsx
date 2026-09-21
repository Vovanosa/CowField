import { useTranslation } from 'react-i18next'

import { Link } from '../../app/navigation'
import { brandedTitle, useDocumentMeta } from '../../app/useDocumentMeta'
import { PageHeader, Panel } from '../../components/ui'
import { getDifficultyLabel } from '../../game/getDifficultyLabel'
import type { Difficulty } from '../../game/types'
import styles from './DifficultiesPage.module.css'

/** Same shape as `difficultyChipClassNames` in `LevelsPage`: an explicit map, so adding a sixth
    difficulty fails the typecheck here instead of silently rendering an unstyled card. */
const cardClassNames: Record<Difficulty, string> = {
  light: `${styles.card} ${styles.cardLight}`,
  easy: `${styles.card} ${styles.cardEasy}`,
  medium: `${styles.card} ${styles.cardMedium}`,
  hard: `${styles.card} ${styles.cardHard}`,
  extreme: `${styles.card} ${styles.cardExtreme}`,
}

/**
 * What actually changes between board sizes. Public and indexable, added in P17.
 *
 * Its job is the long tail — "star battle 10x10", "star battle 2 stars", "15x15 star battle" — which
 * the landing page cannot serve without turning into a specification sheet. It is also the honest
 * place to put the extreme caveat: those boards are accepted with a handful of solutions rather than
 * exactly one, and a player who hits that deserves to have been told, not to think the game is
 * broken.
 *
 * The numbers here are the real ones. `shared/game/board.ts` decides grid size and bulls per group,
 * and `levels:fill` filled every difficulty to 200.
 */
export function DifficultiesPage() {
  const { t } = useTranslation()

  useDocumentMeta({
    title: brandedTitle(t('Star Battle board sizes and difficulty')),
    description: t(
      'What changes between a 6x6 one-bull Star Battle board and a 15x15 three-bull one, how many levels each size has, and which difficulty to start with.',
    ),
  })

  const difficulties: { id: Difficulty; spec: string; note: string }[] = [
    {
      id: 'light',
      spec: t('6x6 board, one bull per row, column and pen.'),
      note: t(
        'Where to start. Small enough to hold the whole board in your head while you work out what the dots do.',
      ),
    },
    {
      id: 'easy',
      spec: t('8x8 board, one bull per row, column and pen.'),
      note: t(
        'The same puzzle with more room to be wrong in. Rows stop being obvious and you start leaning on the pens.',
      ),
    },
    {
      id: 'medium',
      spec: t('10x10 board, one bull per row, column and pen.'),
      note: t(
        'The size most Star Battle puzzles come in. If you have played this elsewhere, start here and it will feel familiar.',
      ),
    },
    {
      id: 'hard',
      spec: t('10x10 board, two bulls per row, column and pen.'),
      note: t(
        'What most people mean by Two Not Touch. With two bulls per row, finding one bull no longer finishes the row.',
      ),
    },
    {
      id: 'extreme',
      spec: t('15x15 board, three bulls per row, column and pen.'),
      note: t(
        '225 cells, 15 pens, 45 bulls. Expect to sit with one of these. They are also the boards that can have more than one valid answer.',
      ),
    },
  ]

  return (
    <div className={`${styles.page} page-shell`}>
      <PageHeader
        titleAs="h1"
        backTo="/about"
        backLabel={t('Back to the rules')}
        title={t('Star Battle board sizes and difficulty')}
      />

      <Panel className={styles.panel}>
        <p className={styles.lead}>
          {t(
            'Five sizes, 200 levels each. Level 1 of light and level 173 of extreme are both one click away.',
          )}
        </p>

        <ul className={styles.cardList}>
          {difficulties.map((difficulty) => (
            <li key={difficulty.id} className={cardClassNames[difficulty.id]}>
              <div className={styles.cardHead}>
                <h2 className={styles.cardTitle}>{getDifficultyLabel(t, difficulty.id)}</h2>
                <span className={styles.cardCount}>{t('200 levels')}</span>
              </div>
              <p className={styles.cardSpec}>{difficulty.spec}</p>
              <p className={styles.cardNote}>{difficulty.note}</p>
            </li>
          ))}
        </ul>
      </Panel>

      <Panel className={styles.panel}>
        <h2 className={styles.sectionTitle}>{t('What changes when the star count goes up')}</h2>
        <p className={styles.body}>
          {t(
            "A 6x6 board and a 10x10 board ask for the same work, just more of it. One bull per row and two bulls per row ask different questions. With one, finding a row's bull retires the row. With two, it tells you almost nothing on its own, because the second is still out there and the no-touching rule is all that holds it. That is the step from medium to hard, and again from hard to extreme.",
          )}
        </p>
        {/*
          The extreme-uniqueness caveat used to be a paragraph here too. It was being made in three
          places — the landing page, this page and `/levels/extreme` — in the same shape each time,
          which is what a reader notices rather than the point itself. It lives on `/levels/extreme`
          now, where someone is about to play one; the card above still mentions it in a clause.
        */}
        <div className={styles.linkRow}>
          <Link className={styles.inlineLink} to="/">
            {t('Go and try one')}
          </Link>
          <Link className={styles.inlineLink} to="/how-to-solve">
            {t('Solving techniques')}
          </Link>
        </div>
      </Panel>
    </div>
  )
}
