import { useTranslation } from 'react-i18next'

import { brandedTitle, useDocumentMeta } from '../../app/useDocumentMeta'
import { PageHeader, Panel } from '../../components/ui'
import styles from './AboutProjectPage.module.css'

/** The author. Written out once, in one place, because it appears in prose and in the schema. */
const AUTHOR_NAME = 'Volodymyr Mykhailiuk'

/**
 * Published deliberately, at the author's request, so a reader has a way to make contact.
 *
 * Not in the JSON-LD below and not run through `t()`. An address in structured data is a second
 * copy for a harvester to find and buys a reader nothing the visible `mailto:` does not already
 * give them, and an address is not a translatable string.
 */
const AUTHOR_EMAIL = 'vovanosa06@gmail.com'

/** The same, for a reader who would rather send a message than an email. */
const AUTHOR_TELEGRAM = '@Enjoyer29'
const AUTHOR_TELEGRAM_URL = 'https://t.me/Enjoyer29'

/**
 * Who made this and why — the fifth public page, added 2026-09-21.
 *
 * **Not the same page as `/about`.** That one is the rules of Star Battle and exists to be found by
 * someone searching for the puzzle. This one is about the project, and the person it belongs to. A
 * reader arriving from a search wants the first; a reader who has played and wondered who wrote it
 * wants the second, and until now there was nowhere to send them.
 *
 * It is the only page on the site whose job is a **name**. Nobody searches for it, and that is
 * fine — it exists so that the name is attached to the work somewhere indexable, which is most of
 * what "something to show" means in practice.
 *
 * No session, no fetch, no storage — the same bar `/about` and `/how-to-solve` had to clear to sit
 * outside `RequireSession`.
 */
export function AboutProjectPage() {
  const { t } = useTranslation()

  useDocumentMeta({
    title: brandedTitle(t('About the project')),
    description: t(
      'CowField is a side project by Volodymyr Mykhailiuk, a Star Battle puzzle built solo to try out new tools and to have one finished thing worth showing.',
    ),
  })

  const sections = [
    {
      title: t('Why a puzzle game'),
      body: t(
        'A todo list would have been quicker. I play these puzzles, and the part I actually wanted to understand was how the boards get made. Whether a generator can be trusted to produce one with a single answer, and what checking that costs. Most of that question lives on the server, so building it was a way to get properly better at backend work. The front end got the rest of the attention, most of it spent calibrating things nobody is meant to notice.',
      ),
    },
    {
      title: t('Something finished, not a demo'),
      body: t(
        'I wanted one thing I could point at. A game a stranger can open and play without being told what it is, with everything a real product needs somewhere inside it, including the dull parts.',
      ),
    },
    {
      title: t('Built alone, on purpose'),
      body: t(
        'Working solo means every part is mine. The board rules, the generator and the solver, the API, the database schema, the layout, the copy, and both languages. There is nobody to hand the half I am worse at.',
      ),
    },
    {
      title: t('A place to try things'),
      body: t(
        'Small libraries I would otherwise never have a reason to install get tried out here, and a few of them I ended up writing myself once I had seen what they cost. The QR code in the share dialog is about 450 lines of Reed-Solomon and bit placement, with no dependency behind it.',
      ),
    },
    {
      title: t('Learning the newer tooling'),
      body: t(
        'The other thing I practise here is working well with the newer tools that sit alongside the editor. Getting something genuinely useful out of them is a skill of its own, and it only develops on a real project, where a bad decision has to be lived with for weeks.',
      ),
    },
    {
      title: t('What it is built with'),
      body: t(
        'React, TypeScript and Vite in the browser. Express, Prisma and Postgres behind it. The board rules, the generator and the solver sit in one shared folder that both sides import, so the browser and the server can never disagree about what a legal board is. The site runs on Vercel and the API on Render.',
      ),
    },
  ]

  return (
    <div className={`${styles.page} page-shell`}>
      {/*
        `AboutPage` with a named `author`, which is the whole reason this page is indexable. The
        prose says who built it; this says the same thing in the form a search engine reads, so the
        name and the work are attached to each other rather than sitting on the same page by
        coincidence.
      */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'AboutPage',
            name: t('About the project'),
            author: { '@type': 'Person', name: AUTHOR_NAME },
            about: {
              '@type': 'VideoGame',
              name: 'CowField',
              author: { '@type': 'Person', name: AUTHOR_NAME },
            },
          }),
        }}
      />

      <PageHeader
        titleAs="h1"
        backTo="/"
        backLabel={t('Back to home')}
        title={t('About the project')}
      />

      <Panel className={styles.panel}>
        <p className={styles.lead}>
          {t(
            'CowField is a personal project. I am Volodymyr Mykhailiuk, and I built it on my own, front to back.',
          )}
        </p>

        {sections.map((section) => (
          <section key={section.title} className={styles.section}>
            <h2 className={styles.sectionTitle}>{section.title}</h2>
            <p className={styles.body}>{section.body}</p>
          </section>
        ))}

        {/*
          The only section rendered by hand rather than through the list above, because it is the
          only one with a link in the middle of a sentence.

          Two links used to close this page, "Go and try one" and "Read the full rules". They have
          gone: the footer already carries every public page on every page, so they were the same
          destinations twice, and a page about the person should not end by hurrying the reader
          somewhere else. An address to write to is a better last thing.
        */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t('Getting in touch')}</h2>
          <p className={styles.body}>
            {t('If any of this is worth a message, mine is')}{' '}
            <a className={styles.inlineLink} href={`mailto:${AUTHOR_EMAIL}`}>
              {AUTHOR_EMAIL}
            </a>
            {t('. Work, questions about how something here is built, or a bug you hit on level 143.')}
          </p>
          <p className={styles.body}>
            {t('Or find me on Telegram as')}{' '}
            {/*
              `rel="me"` alongside the usual pair: it is the small convention that lets a profile
              link back and have the two count as the same person, which is the only reason a link
              like this earns its place on a page about who built something.
            */}
            <a
              className={styles.inlineLink}
              href={AUTHOR_TELEGRAM_URL}
              target="_blank"
              rel="me noopener noreferrer"
            >
              {AUTHOR_TELEGRAM}
            </a>
            .
          </p>
        </section>
      </Panel>
    </div>
  )
}
