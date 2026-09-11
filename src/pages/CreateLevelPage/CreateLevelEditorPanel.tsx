import { BadgeCheck, RefreshCw, Save, SquarePen, Trash2 } from 'lucide-react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'

import { getCowMarkerPercent } from '../../components/GameBoard/GameBoard.helpers'
import { releaseImplicitPointerCapture } from '../../components/GameBoard/GameBoard.keyboard'
import { CowIcon } from '../../components/icons'
import { ToolChip } from '../../components/ToolChip'
import { Button, Panel } from '../../components/ui'
import { getColorForId } from '../../game/levels'
import type { LevelDraft } from '../../game/types'
import styles from './CreateLevelPage.module.css'

/** What a cow fills in the editor on a 6x6 board — bigger than in play, because it is the tool. */
const EDITOR_COW_BASE_PERCENT = 68

type ActiveTool = number | 'cow'

type CreateLevelEditorPanelProps = {
  routeLevelNumber?: number
  draft: LevelDraft
  activeTool: ActiveTool
  requiredCowCount: number
  colorOptions: number[]
  isDeleting: boolean
  isGenerating: boolean
  isValidating: boolean
  onGenerate: () => void
  onValidate: () => void
  onSave: () => void
  onClearBoard: () => void
  onRequestDelete: () => void
  onSetActiveTool: (tool: ActiveTool) => void
  onCellPointerDown: (event: ReactPointerEvent<HTMLButtonElement>, cellIndex: number) => void
  onCellPointerEnter: (cellIndex: number) => void
  onCellPointerUp: () => void
  t: (key: string, options?: Record<string, unknown>) => string
}

export function CreateLevelEditorPanel({
  routeLevelNumber,
  draft,
  activeTool,
  requiredCowCount,
  colorOptions,
  isDeleting,
  isGenerating,
  isValidating,
  onGenerate,
  onValidate,
  onSave,
  onClearBoard,
  onRequestDelete,
  onSetActiveTool,
  onCellPointerDown,
  onCellPointerEnter,
  onCellPointerUp,
  t,
}: CreateLevelEditorPanelProps) {
  const isBusy = isGenerating || isValidating

  return (
    <section className={[styles.layout, styles.layoutSingle].join(' ')}>
      <Panel className={styles.editorPanel}>
        <div className={styles.editorHeading}>
          <SquarePen size={18} />
          <h2>{t('Create/Edit Level')}</h2>
        </div>

        <div className={styles.editorSection}>
          <div className={styles.editorActions}>
            {/*
              Generate and Validate both run the same backtracking search in a worker, and Save runs
              Validate first — so all three are busy whenever either flag is set. Before the worker
              existed the tab was frozen instead, which disabled them by force.
            */}
            <div className={styles.editorActionsGroup}>
              <Button
                onClick={onGenerate}
                disabled={isBusy}
                leadingIcon={<RefreshCw size={18} />}
              >
                {isGenerating ? t('Generating...') : t('Generate')}
              </Button>
              <Button
                onClick={onValidate}
                disabled={isBusy}
                leadingIcon={<BadgeCheck size={18} />}
              >
                {isValidating ? t('Validating...') : t('Validate level')}
              </Button>
              <Button
                variant="primary"
                onClick={onSave}
                disabled={isBusy}
                leadingIcon={<Save size={18} />}
              >
                {t('Save level')}
              </Button>
            </div>

            <div className={[styles.editorActionsGroup, styles.editorActionsGroupRight].join(' ')}>
              <Button onClick={onClearBoard} disabled={isBusy}>
                {t('Clear board')}
              </Button>
              {routeLevelNumber ? (
                <Button
                  variant="danger"
                  onClick={onRequestDelete}
                  disabled={isDeleting}
                  leadingIcon={<Trash2 size={18} />}
                >
                  {t('Delete level')}
                </Button>
              ) : null}
            </div>
          </div>

          <p className={styles.sectionCopy}>
            {t('Pick a color, then click cells to assign them to that region. Every cell must belong to some color before the level can be saved, and cows should be placed inside each color. This board needs exactly {{gridSize}} connected colors and {{requiredCowCount}} cows to be on the board.', {
              gridSize: draft.gridSize,
              requiredCowCount,
            })}
          </p>

          <div className={styles.penPalette} aria-label={t('Color palette')}>
            <ToolChip active={activeTool === 0} onClick={() => onSetActiveTool(0)}>
              {t('Erase')}
            </ToolChip>
            <ToolChip active={activeTool === 'cow'} onClick={() => onSetActiveTool('cow')}>
              {t('Cow')}
            </ToolChip>
            {colorOptions.map((colorId) => (
              <ToolChip
                key={colorId}
                active={activeTool === colorId}
                style={{ backgroundColor: getColorForId(colorId) }}
                onClick={() => onSetActiveTool(colorId)}
              >
                {t('Color {{colorId}}', { colorId })}
              </ToolChip>
            ))}
          </div>

          <div className={styles.editorBoard} role="group" aria-label={t('Level color editor')}>
            <div
              className={styles.editorBoardGrid}
              style={
                {
                  gridTemplateColumns: `repeat(${draft.gridSize}, minmax(0, 1fr))`,
                  // Same reasoning as the play board: a fixed fraction of a 15x15 cell is a speck.
                  '--editor-cow-size': `${getCowMarkerPercent(draft.gridSize, EDITOR_COW_BASE_PERCENT)}%`,
                } as CSSProperties
              }
            >
              {draft.pensByCell.map((colorId, cellIndex) => {
                const row = Math.floor(cellIndex / draft.gridSize) + 1
                const column = (cellIndex % draft.gridSize) + 1
                const pen = colorId === 0 ? t('No pen') : t('Pen {{pen}}', { pen: colorId })
                const bull = draft.cowsByCell[cellIndex] ? `. ${t('bull')}` : ''

                return (
                <button
                  key={cellIndex}
                  type="button"
                  className={[
                    styles.editorCell,
                    colorId === 0 ? styles.editorCellEmpty : '',
                  ].filter(Boolean).join(' ')}
                  style={{ backgroundColor: getColorForId(colorId) }}
                  // The pen number is rendered as text in the cell, but the bull is an
                  // `aria-hidden` icon and an unpainted cell shows nothing at all.
                  aria-label={`${t('Row {{row}}, column {{column}}', { row, column })}. ${pen}${bull}`}
                  onPointerDown={(event) => {
                    releaseImplicitPointerCapture(event)
                    onCellPointerDown(event, cellIndex)
                  }}
                  onPointerEnter={() => onCellPointerEnter(cellIndex)}
                  onPointerUp={onCellPointerUp}
                  onDragStart={(event) => event.preventDefault()}
                >
                  {colorId === 0 ? '' : <span className={styles.editorCellLabel}>{colorId}</span>}
                  {draft.cowsByCell[cellIndex] ? <CowIcon className={styles.cowMarker} /> : null}
                </button>
                )
              })}
            </div>
          </div>
        </div>
      </Panel>
    </section>
  )
}
