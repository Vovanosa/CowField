import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { brandedTitle, useDocumentMeta } from '../../app/useDocumentMeta'
import { PageHeader, Panel } from '../../components/ui'
import styles from './HowToSolvePage.module.css'

/**
 * Solving techniques. Public, indexable, and added in P17 for one reason: `/` and `/about` were the
 * only two pages on the site, and two pages cannot rank for a topic.
 *
 * **The techniques are real Star Battle technique, not CowField technique.** That is deliberate.
 * "How to solve star battle" is a question people type, and a page that only worked inside this one
 * app would deserve neither the visit nor the link. The only product-specific note is the last one,
 * where the illegal-placement highlight genuinely does change how you run a trial chain.
 *
 * No session, no fetch, no storage — the same bar `/about` had to clear to sit outside
 * `RequireSession`.
 */
export function HowToSolvePage() {
  const { t } = useTranslation()

  useDocumentMeta({
    title: brandedTitle(t('How to solve Star Battle puzzles')),
    description: t(
      'Six techniques for solving Star Battle and Two Not Touch puzzles: fencing off bulls, pens trapped in a row, counting pens against rows, and what to do when stuck.',
    ),
  })

  const techniques = [
    {
      title: t('Fence off every bull you place'),
      body: t(
        'The moment a bull goes down, the eight cells around it are dead. Dot them. This is the cheapest information on the board and it compounds, because those dots are what the next three techniques read. Turn on auto-place dots in Settings and the game does it for you.',
      ),
    },
    {
      title: t('A pen trapped in one row finishes that row'),
      body: t(
        'If a whole pen sits inside a single row, that pen has to spend its bulls in that row, and the row has no quota left for anyone else. Every other cell in the row is dead. The same works for columns, and it works with the pen only mostly contained too: what matters is where its empty cells are, not its full shape.',
      ),
    },
    {
      title: t('Count pens against rows'),
      body: t(
        'The strongest move in the game, and the one people miss. If three pens fit entirely inside three rows, those three rows are spoken for: every cell in them belonging to a fourth pen is dead. It reads backwards as well. If three rows only ever touch three pens, those pens are used up and cannot appear anywhere else on the board.',
      ),
    },
    {
      title: t('Watch where a pen has room left'),
      body: t(
        'A pen spread across five rows is not free if its remaining cells only sit in two of them. Needing two bulls in two rows claims both. On the two and three bull boards this is most of the work, because a pen with three bulls and barely enough room is almost solved already.',
      ),
    },
    {
      title: t('Start where the choices are fewest'),
      body: t(
        'Small pens, corners and edges. A three-cell pen on a one-bull board offers three options; a twenty-cell pen offers twenty. Corners have fewer neighbours to rule out, so a bull placed there costs the board less. Open in the cramped part and the loose part solves itself later.',
      ),
    },
    {
      title: t('When nothing moves, assume one and follow it'),
      body: t(
        'Take a pen with two options left, pick one, and push the consequences until something breaks. If it breaks, the cell you picked is dead and you have learned something real. Place actual bulls while you do this rather than working it out in your head: an illegal one lights up the instant it lands, so the board tells you where the chain failed.',
      ),
    },
  ]

  return (
    <div className={`${styles.page} page-shell`}>
      <PageHeader
        titleAs="h1"
        backTo="/about"
        backLabel={t('Back to the rules')}
        title={t('How to solve Star Battle puzzles')}
      />

      <Panel className={styles.panel}>
        <p className={styles.lead}>
          {t(
            'None of this is specific to CowField. It is how Star Battle works, so it carries over to any board you meet, under any of the names the puzzle goes by. Roughly in the order the moves tend to come up.',
          )}
        </p>

        {/* An ordered list, because the order is the claim: these are the moves in the order they
            become available, not six equivalent tips. */}
        <ol className={styles.techniqueList}>
          {techniques.map((technique, index) => (
            <li key={technique.title} className={styles.technique}>
              <span className={styles.techniqueNumber} aria-hidden="true">
                {index + 1}
              </span>
              <div className={styles.techniqueCopy}>
                <h2 className={styles.techniqueTitle}>{technique.title}</h2>
                <p className={styles.techniqueBody}>{technique.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className={styles.linkRow}>
          <Link className={styles.inlineLink} to="/">
            {t('Go and try one')}
          </Link>
          <Link className={styles.inlineLink} to="/difficulties">
            {t('Star Battle board sizes and difficulty')}
          </Link>
        </div>
      </Panel>
    </div>
  )
}
