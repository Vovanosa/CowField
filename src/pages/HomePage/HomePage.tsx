import { BookOpenText, Pencil, Play, SquarePen } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useRole } from '../../app/role'
import { getContentByKey, saveContentByKey } from '../../game/storage'
import styles from './HomePage.module.css'

export function HomePage() {
  const { isAdmin } = useRole()
  const [homeText, setHomeText] = useState('')
  const [draftText, setDraftText] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isActive = true

    async function loadContent() {
      try {
        const content = await getContentByKey('home')

        if (!isActive) {
          return
        }

        setHomeText(content.text)
        setDraftText(content.text)
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    void loadContent()

    return () => {
      isActive = false
    }
  }, [])

  async function handleSaveHomeText() {
    const content = await saveContentByKey('home', draftText)
    setHomeText(content.text)
    setDraftText(content.text)
    setIsEditing(false)
  }

  return (
    <div className={styles.homePage}>
      <section className={styles.homeHero}>
        <p className={styles.homeEyebrow}>Logic puzzle prototype</p>
        <h2>Place bulls without letting them touch.</h2>
        <p className={styles.homeDescription}>
          Each row, column, and color must hit the target count. Dot marks are
          just notes.
        </p>

        <div className={styles.homeMenu} aria-label="Home menu">
          <Link className="primary-button" to="/levels">
            <Play size={18} />
            Play
          </Link>
          {isAdmin ? (
            <Link className="secondary-button" to="/levels">
              <SquarePen size={18} />
              Create level
            </Link>
          ) : null}
          <Link className="secondary-button" to="/about">
            <BookOpenText size={18} />
            Learn the rules
          </Link>
        </div>
      </section>

      <div className={styles.homeNoteWrap}>
        <div className={styles.homeNoteIcon}>
          <BookOpenText size={18} />
        </div>
        <div className={`${styles.homeNotePanel} panel-surface`}>
          {isLoading ? (
            <p className={styles.homeNoteText}>Loading...</p>
          ) : isEditing ? (
            <div className={styles.homeNoteEditor}>
              <textarea
                value={draftText}
                onChange={(event) => setDraftText(event.target.value)}
                rows={3}
              />
              <div className={styles.homeNoteActions}>
                <button type="button" className="primary-button" onClick={() => void handleSaveHomeText()}>
                  Save text
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => {
                    setDraftText(homeText)
                    setIsEditing(false)
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.homeNoteRow}>
              <p className={styles.homeNoteText}>{homeText}</p>
              {isAdmin ? (
                <button
                  type="button"
                  className="icon-link home-note-edit"
                  aria-label="Edit home text"
                  onClick={() => {
                    setDraftText(homeText)
                    setIsEditing(true)
                  }}
                >
                  <Pencil size={16} />
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
