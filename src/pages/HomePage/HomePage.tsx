import { BookOpenText, Pencil, Play, SquarePen } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { useRole } from '../../app/role'
import { getContentByKey, saveContentByKey } from '../../game/storage'
import './HomePage.css'

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
    <div className="home-page">
      <section className="home-hero">
        <p className="home-eyebrow">Logic puzzle prototype</p>
        <h2>Place bulls without letting them touch.</h2>
        <p className="home-description">
          Each row, column, and color must hit the target count. Dot marks are
          just notes.
        </p>

        <div className="home-menu" aria-label="Home menu">
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

      <div className="home-note-wrap">
        <div className="home-note-icon">
          <BookOpenText size={18} />
        </div>
        <div className="home-note-panel">
          {isLoading ? (
            <p className="home-note-text">Loading...</p>
          ) : isEditing ? (
            <div className="home-note-editor">
              <textarea
                value={draftText}
                onChange={(event) => setDraftText(event.target.value)}
                rows={3}
              />
              <div className="home-note-actions">
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
            <div className="home-note-row">
              <p className="home-note-text">{homeText}</p>
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
