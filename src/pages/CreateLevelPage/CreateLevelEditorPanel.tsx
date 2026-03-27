import { BadgeCheck, RefreshCw, Save, SquarePen, Trash2 } from 'lucide-react'
import type { PointerEvent as ReactPointerEvent } from 'react'

import { CowIcon } from '../../components/icons'
import { ToolChip } from '../../components/ToolChip'
import { Button, Panel } from '../../components/ui'
import { getColorForId } from '../../game/levels'
import type { LevelDraft } from '../../game/types'
import styles from './CreateLevelPage.module.css'

type ActiveTool = number | 'cow'

type CreateLevelEditorPanelProps = {
  routeLevelNumber?: number
  draft: LevelDraft
  activeTool: ActiveTool
  requiredCowCount: number
  colorOptions: number[]
  isDeleting: boolean
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
  return (
    <section className={[styles.layout, styles.layoutSingle].join(' ')}>
      <Panel className={styles.editorPanel}>
        <div className={styles.editorHeading}>
          <SquarePen size={18} />
          <h2>{t('Create/Edit Level')}</h2>
        </div>

        <div className={styles.editorSection}>
          <div className={styles.editorActions}>
            <div className={styles.editorActionsGroup}>
              <Button onClick={onGenerate} leadingIcon={<RefreshCw size={18} />}>
                {t('Generate')}
              </Button>
              <Button onClick={onValidate} leadingIcon={<BadgeCheck size={18} />}>
                {t('Validate level')}
              </Button>
              <Button variant="primary" onClick={onSave} leadingIcon={<Save size={18} />}>
                {t('Save level')}
              </Button>
            </div>

            <div className={[styles.editorActionsGroup, styles.editorActionsGroupRight].join(' ')}>
              <Button onClick={onClearBoard}>{t('Clear board')}</Button>
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

          <div className={styles.editorBoard} aria-label={t('Level color editor')}>
            <div
              className={styles.editorBoardGrid}
              style={{
                gridTemplateColumns: `repeat(${draft.gridSize}, minmax(0, 1fr))`,
              }}
            >
              {draft.pensByCell.map((colorId, cellIndex) => (
                <button
                  key={cellIndex}
                  type="button"
                  className={[
                    styles.editorCell,
                    colorId === 0 ? styles.editorCellEmpty : '',
                  ].filter(Boolean).join(' ')}
                  style={{ backgroundColor: getColorForId(colorId) }}
                  onPointerDown={(event) => onCellPointerDown(event, cellIndex)}
                  onPointerEnter={() => onCellPointerEnter(cellIndex)}
                  onPointerUp={onCellPointerUp}
                  onDragStart={(event) => event.preventDefault()}
                >
                  {colorId === 0 ? '' : <span className={styles.editorCellLabel}>{colorId}</span>}
                  {draft.cowsByCell[cellIndex] ? <CowIcon className={styles.cowMarker} /> : null}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Panel>
    </section>
  )
}
