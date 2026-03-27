import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { CowIcon } from '../../components/icons'
import { PageHeader, Panel } from '../../components/ui'
import styles from './AboutPage.module.css'

export function AboutPage() {
  const { t } = useTranslation()

  return (
    <div className={`${styles.simplePage} page-shell`}>
      <PageHeader
        backTo="/"
        backLabel={t('Back to home')}
        eyebrow={t('About')}
        title={t('About the game')}
        description={t('A quick guide for new players before the first level.')}
      />
      <Panel className={styles.aboutPanel}>
        <article className={styles.aboutArticle}>
          <p className={styles.lead}>
            {t(
              'Bullpen is a calm logic puzzle about placing bulls on a colored board. It is meant to feel thoughtful and relaxing: no rushing, no guessing, just slowly noticing where each bull can and cannot go.',
            )}
          </p>

          <div className={styles.legend} aria-label={t('How cell marks work')}>
            <span className={styles.legendIntro}>{t('Each cell changes like this:')}</span>
            <div className={styles.legendStep}>
              <span className={styles.legendCell} aria-hidden="true" />
              <span>{t('empty')}</span>
            </div>
            <ArrowRight className={styles.legendArrow} size={16} aria-hidden="true" />
            <div className={styles.legendStep}>
              <span className={styles.legendCell} aria-hidden="true">
                <span className={styles.legendDot} />
              </span>
              <span>{t('dot note')}</span>
            </div>
            <ArrowRight className={styles.legendArrow} size={16} aria-hidden="true" />
            <div className={styles.legendStep}>
              <span className={styles.legendCell} aria-hidden="true">
                <CowIcon className={styles.bullMarker} />
              </span>
              <span>{t('bull')}</span>
            </div>
          </div>

          <p>
            {t(
              'The purpose of the game is simple: place the correct number of bulls so the whole board works at once. Every row must contain the required number of bulls, every column must contain the required number of bulls, and every colored pen must also contain the required number of bulls.',
            )}
          </p>

          <p>
            {t(
              'There is one more important rule: bulls may not touch each other in any direction. That means not from the side, not from above or below, and not even diagonally at the corners. If two bulls are neighboring cells, the placement is wrong.',
            )}
          </p>

          <div className={styles.ruleStrip}>
            <span>{t('Light, easy, and medium use 1 bull per row, column, and pen.')}</span>
            <span>{t('Hard uses 2 bulls per row, column, and pen.')}</span>
            <span>{t('Dots are just notes and never count as bulls.')}</span>
            <span>{t('You win with correct bull placement only.')}</span>
          </div>

          <p>
            {t(
              'A good way to play is to use dots as reminders for yourself while you test ideas. You are free to place bulls even when they are wrong, and once you have placed the required number of bulls, the game can show which ones break the rules. You do not need to clean up every unused cell before finishing a level.',
            )}
          </p>

          <p>
            {t(
              'In Settings, you can make play more comfortable: turn on take your time to hide visible timers, use auto-place dots for extra note help, switch to dark mode, and enable sound effects or music with volume controls. If you are playing as a guest, take your time stays on automatically.',
            )}
          </p>

          <p className={styles.closing}>
            {t(
              'The fun of Bullpen is in that quiet moment when a crowded board starts making sense. Start small, trust the rules, and let the pattern appear one bull at a time.',
            )}
          </p>
        </article>
      </Panel>
    </div>
  )
}
