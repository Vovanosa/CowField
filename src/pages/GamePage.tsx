import { RotateCcw, TimerReset, Trash2 } from 'lucide-react'
import { useParams } from 'react-router-dom'

import { PageIntro } from '../components/PageIntro'
import './GamePage.css'

const boardPreview = Array.from({ length: 100 }, (_, index) => index)

export function GamePage() {
  const { levelId = '1' } = useParams()

  return (
    <div className="game-page">
      <PageIntro
        eyebrow={`Level ${levelId}`}
        title="Board rendering comes next."
        description="This placeholder screen reserves the structure for the puzzle HUD, the board area, and the interaction controls we will wire into the rule engine."
      />

      <section className="game-layout">
        <div className="board-panel">
          <div className="board-panel-header">
            <div>
              <p className="board-panel-label">Remaining bulls</p>
              <strong className="board-panel-value">10</strong>
            </div>
            <div>
              <p className="board-panel-label">Time</p>
              <strong className="board-panel-value">00:00</strong>
            </div>
          </div>

          <div className="board-preview" aria-label="Puzzle board placeholder">
            {boardPreview.map((cell) => (
              <span key={cell} className="board-cell" />
            ))}
          </div>
        </div>

        <aside className="control-panel">
          <div className="control-group">
            <h2>Controls</h2>
            <p>
              Tap cycle will be <strong>dot</strong>, then <strong>bull</strong>,
              then <strong>empty</strong>.
            </p>
          </div>

          <div className="control-actions">
            <button type="button" className="secondary-button">
              <RotateCcw size={18} />
              Undo later
            </button>
            <button type="button" className="secondary-button">
              <TimerReset size={18} />
              Reset board
            </button>
            <button type="button" className="secondary-button">
              <Trash2 size={18} />
              Clear notes
            </button>
          </div>
        </aside>
      </section>
    </div>
  )
}
