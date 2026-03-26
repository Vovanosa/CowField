import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { PageIntro } from '../../components/PageIntro'
import styles from './AboutPage.module.css'

function BullMarker() {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden="true"
      className={styles.bullMarker}
      focusable="false"
    >
      <path
        d="M8 10 5.5 5.8l5 2.4L12.6 7h6.8l2.1 1.2 5-2.4L24 10v8.2A4.8 4.8 0 0 1 19.2 23H12.8A4.8 4.8 0 0 1 8 18.2Z"
        fill="var(--color-cow-fill)"
        stroke="var(--color-cow-stroke)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12.2" cy="15.2" r="1" fill="var(--color-cow-stroke)" />
      <circle cx="19.8" cy="15.2" r="1" fill="var(--color-cow-stroke)" />
      <path
        d="M12.2 18.4h7.6a2.8 2.8 0 0 1-2.8 3h-2a2.8 2.8 0 0 1-2.8-3Z"
        fill="var(--color-cow-accent)"
        stroke="var(--color-cow-stroke)"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <circle cx="14.4" cy="19.7" r="0.6" fill="var(--color-cow-stroke)" />
      <circle cx="17.6" cy="19.7" r="0.6" fill="var(--color-cow-stroke)" />
    </svg>
  )
}

export function AboutPage() {
  const { t } = useTranslation()

  return (
    <div className={`${styles.simplePage} page-shell`}>
      <div className={styles.pageIntroRow}>
        <Link className="round-icon-link" to="/" aria-label={t('Back to home')}>
          <ArrowLeft size={16} />
        </Link>
        <PageIntro
          eyebrow={t('About')}
          title={t('About the game')}
          description={t('A quick guide for new players before the first level.')}
        />
      </div>
      <section className={`${styles.aboutPanel} panel-surface`}>
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
                <BullMarker />
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
      </section>
    </div>
  )
}
