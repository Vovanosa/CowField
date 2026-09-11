import { ArrowRight, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Link } from '../../app/navigation'
import { brandedTitle, useDocumentMeta } from '../../app/useDocumentMeta'
import { CowIcon } from '../../components/icons'
import { PageHeader, Panel } from '../../components/ui'
import styles from './AboutPage.module.css'

export function AboutPage() {
  const { t } = useTranslation()
  // Public and indexable: this is the rules page, and the best keyword surface on the site.
  useDocumentMeta({
    title: brandedTitle(t('How to play Star Battle')),
    description: t(
      'The rules of Star Battle, also called Two Not Touch: the same number of bulls in every row, column and region, and no two touching. Plus what the dots do.',
    ),
  })

  /*
    One array, rendered as the page and serialised as `FAQPage` structured data below.

    Written once on purpose. Two copies of an FAQ drift, and structured data that disagrees with the
    page it describes is worse than none at all — Google treats the mismatch as a reason to ignore
    the markup. Question-shaped headings with short answers are also the shape that gets lifted into
    an answer box, which is the only realistic way a site this small appears above the established
    Star Battle players.
  */
  const faq = [
    {
      question: t('What is Star Battle?'),
      answer: t(
        'A logic puzzle on a grid split into coloured regions. You place a fixed number of stars in every row, every column and every region, and no two stars may touch, including diagonally. In CowField the stars are bulls and the regions are pens.',
      ),
    },
    {
      question: t('Is Two Not Touch the same puzzle?'),
      answer: t(
        'Yes. Two Not Touch is the name usually given to the two-star version on a 10x10 board, which is what hard is here. Same rules, different name.',
      ),
    },
    {
      question: t('Do I need an account?'),
      answer: t(
        'No. The guest button drops you straight onto a board and keeps your progress in your browser. An account only matters if you want that progress on a second device.',
      ),
    },
    {
      question: t('Is it free?'),
      answer: t('Yes, all 1,000 levels. No ads, and nothing to buy.'),
    },
    {
      question: t('Does every puzzle have one solution?'),
      answer: t(
        'Light, easy, medium and hard do, so every one of them can be reasoned out without guessing. Extreme boards can have more than one valid answer. Whichever you find, if it follows the rules it wins.',
      ),
    },
    {
      question: t('Can I play on a phone?'),
      answer: t(
        'Yes. The small boards fit a phone screen comfortably. For 10x10 and 15x15 turn the phone sideways, or use a tablet, since 225 cells need the room.',
      ),
    },
  ]

  return (
    <div className={`${styles.simplePage} page-shell`}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faq.map((entry) => ({
              '@type': 'Question',
              name: entry.question,
              acceptedAnswer: { '@type': 'Answer', text: entry.answer },
            })),
          }),
        }}
      />

      <PageHeader
        titleAs="h1"
        backTo="/"
        backLabel={t('Back to home')}
        title={t('How to play Star Battle')}
      />
      <Panel className={styles.aboutPanel}>
        <article className={styles.aboutArticle}>
          <p className={styles.lead}>
            {t(
              'CowField is a Star Battle puzzle. If you have seen the same game called Two Not Touch, that is this. The stars are bulls here and the regions are pens, but nothing about the rules changes.',
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
              'Every board has a number attached to it, depending on its size: one, two or three. Each row has to end up holding exactly that many bulls. So does each column, and so does each coloured pen. Get all three to agree at once and the level is done.',
            )}
          </p>

          <p>
            {t(
              'The second rule is the one that turns it into a puzzle. No two bulls may sit in neighbouring cells. Side by side, one above the other, or touching at a single corner, all of it is out. Every bull needs an empty ring around it.',
            )}
          </p>

          <div className={styles.ruleStrip}>
            <span>{t('Light, easy and medium: one bull per row, column and pen.')}</span>
            <span>{t('Hard: two. Extreme: three, on a 15x15 board.')}</span>
            <span>{t('Dots are notes. They never count as bulls.')}</span>
            <span>{t('You win on bull placement alone.')}</span>
          </div>

          <p>
            {t(
              'Dots are how most people actually solve these. Mark the cells you have ruled out and the board narrows itself. You can also just place a bull you are unsure about: if it breaks a rule it lights up, and you can take it straight back. Leftover dots do not matter at the end, so there is no tidying up to do.',
            )}
          </p>

          <p>
            {t(
              'Settings has a few things worth finding. Take your time hides the timers. Auto-place dots rings each bull for you, which saves a lot of clicking on the big boards. There is a dark theme, and sound and music have their own volumes. Guests get take your time switched on and locked.',
            )}
          </p>

          <div className={styles.linkRow}>
            <Link className={styles.inlineLink} to="/how-to-solve">
              {t('Solving techniques')}
            </Link>
            <Link className={styles.inlineLink} to="/difficulties">
              {t('Star Battle board sizes and difficulty')}
            </Link>
          </div>
        </article>
      </Panel>

      <Panel className={styles.aboutPanel}>
        <h2 className={styles.faqHeading}>{t('Common questions')}</h2>
        {/*
          `<details>` rather than a React open/closed state, and that choice is the whole reason
          collapsing these costs nothing in search.

          **The answers are in the HTML either way.** A closed `<details>` still has its content in
          the DOM — the browser hides it, it is never absent — so a crawler reads all six answers on
          the first pass, exactly as it did when they were a `<dl>`. What would have broken that is
          the obvious React version, `{isOpen && <p>…</p>}`, which does not render the answer at
          all until someone clicks. The `FAQPage` structured data above is built from the same
          array and does not depend on visibility at any point.

          It is also free accessibility: `<summary>` is focusable, toggles on Enter and Space, and
          reports its expanded state to a screen reader with no `aria-expanded` to keep in sync.
        */}
        <div className={styles.faqList}>
          {faq.map((entry) => (
            <details key={entry.question} className={styles.faqEntry}>
              <summary className={styles.faqQuestion}>
                <span>{entry.question}</span>
                <ChevronDown className={styles.faqChevron} size={18} aria-hidden="true" />
              </summary>
              <p className={styles.faqAnswer}>{entry.answer}</p>
            </details>
          ))}
        </div>
        {/*
          The one first-person line on the site. It is here rather than in the hero because the hero
          has a job to do, and because a person who has read this far is the one it is for.

          It is also the single strongest signal that a human wrote this page: nothing generated
          volunteers a motive or admits to what it left out.
        */}
        <p className={styles.signature}>
          {t(
            'I built CowField because I wanted a puzzle I could think through at my own pace. Nothing to keep up with, nothing waiting for me if I put it down for a month.',
          )}
        </p>
      </Panel>
    </div>
  )
}
