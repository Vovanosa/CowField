import { Pencil } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useRole } from '../../app/role'
import {
  getContentByKey,
  saveContentByKey,
  type AppContentKey,
} from '../../game/storage'
import './EditableContentPanel.css'

type EditableContentPanelProps = {
  contentKey: AppContentKey
  variant?: 'panel' | 'inline'
}

export function EditableContentPanel({
  contentKey,
  variant = 'panel',
}: EditableContentPanelProps) {
  const { isAdmin } = useRole()
  const [text, setText] = useState('')
  const [draftText, setDraftText] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [statusMessage, setStatusMessage] = useState('')

  useEffect(() => {
    let isActive = true

    async function loadContent() {
      try {
        const content = await getContentByKey(contentKey)

        if (!isActive) {
          return
        }

        setText(content.text)
        setDraftText(content.text)
        setStatusMessage('')
      } catch (error) {
        if (!isActive) {
          return
        }

        setStatusMessage(
          error instanceof Error ? error.message : 'Failed to load content.',
        )
      } finally {
        if (isActive) {
          setIsLoading(false)
        }
      }
    }

    setIsLoading(true)
    void loadContent()

    return () => {
      isActive = false
    }
  }, [contentKey])

  async function handleSave() {
    try {
      const content = await saveContentByKey(contentKey, draftText)
      setText(content.text)
      setDraftText(content.text)
      setIsEditing(false)
      setStatusMessage('')
    } catch (error) {
      setStatusMessage(
        error instanceof Error ? error.message : 'Failed to save content.',
      )
    }
  }

  if (isLoading) {
    return (
      <section
        className={
          variant === 'inline'
            ? 'simple-panel simple-panel-inline'
            : 'simple-panel panel-surface'
        }
      >
        <p>Loading...</p>
      </section>
    )
  }

  return (
    <section
      className={
        variant === 'inline'
          ? 'simple-panel simple-panel-inline'
          : 'simple-panel panel-surface'
      }
    >
      {isEditing ? (
        <div className="about-editor">
          <textarea
            value={draftText}
            onChange={(event) => setDraftText(event.target.value)}
            rows={7}
          />
          <div className="about-editor-actions">
            <button type="button" className="primary-button" onClick={handleSave}>
              Save text
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setDraftText(text)
                setIsEditing(false)
                setStatusMessage('')
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="simple-panel-row">
          <p>{text}</p>
          {isAdmin ? (
            <button
              type="button"
              className="icon-link about-edit-button"
              aria-label="Edit text"
              onClick={() => {
                setDraftText(text)
                setIsEditing(true)
              }}
            >
              <Pencil size={16} />
            </button>
          ) : null}
        </div>
      )}

      {statusMessage ? <p className="content-status-message">{statusMessage}</p> : null}
    </section>
  )
}
