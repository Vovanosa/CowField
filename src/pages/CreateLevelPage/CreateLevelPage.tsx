import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'

import { useRole } from '../../app/role'
import { EmptyState } from '../../components/EmptyState'
import { Button, StatusMessage, Toast } from '../../components/ui'
import { getDifficultyLabel } from '../../game/getDifficultyLabel'
import type { Difficulty } from '../../game/types'
import { CreateLevelDeleteDialog } from './CreateLevelDeleteDialog'
import { CreateLevelEditorPanel } from './CreateLevelEditorPanel'
import { CreateLevelHeader } from './CreateLevelHeader'
import { useLevelEditor } from './useLevelEditor'
import styles from './CreateLevelPage.module.css'

function isDifficulty(value: string | undefined): value is Difficulty {
  return value === 'light' || value === 'easy' || value === 'medium' || value === 'hard'
}

type CreateLevelPageViewProps = {
  difficulty: Difficulty
  levelNumber?: number
}

function CreateLevelPageView({
  difficulty,
  levelNumber: routeLevelNumber,
}: CreateLevelPageViewProps) {
  const { t } = useTranslation()
  const { isAdmin } = useRole()
  const navigate = useNavigate()
  const {
    draft,
    loadError,
    toast,
    activeTool,
    isLoading,
    isDeleting,
    deleteDialog,
    colorOptions,
    requiredCowCount,
    setActiveTool,
    setDeleteDialog,
    handleCellPointerDown,
    handleCellPointerEnter,
    handleCellPointerUp,
    handleSave,
    handleDelete,
    handleClearBoard,
    handleValidate,
    handleGenerate,
  } = useLevelEditor({
    difficulty,
    routeLevelNumber,
    t,
  })

  if (!draft) {
    return (
      <div className={styles.page}>
        <EmptyState message={isLoading ? t('Loading level...') : loadError} />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className={styles.page}>
        <EmptyState
          message={t('Admin role is required to create or edit levels.')}
          actions={
            <Button to="/levels">{t('Back to levels')}</Button>
          }
        />
      </div>
    )
  }

  const currentDraft = draft

  return (
    <div className={styles.page}>
      {toast ? (
        <Toast
          title={toast.title}
          details={toast.details}
          variant={toast.variant}
          placement="bottom-center"
        />
      ) : null}

      {deleteDialog ? (
        <CreateLevelDeleteDialog
          title={t('Delete level?')}
          description={t('Delete {{difficulty}} level {{levelNumber}}? This removes the project level file.', {
            difficulty: getDifficultyLabel(t, difficulty),
            levelNumber: deleteDialog.levelNumber,
          })}
          isDeleting={isDeleting}
          onCancel={() => setDeleteDialog(null)}
          onDelete={() => void handleDelete((deletedDifficulty) => navigate(`/levels/${deletedDifficulty}`))}
          t={t}
        />
      ) : null}

      <CreateLevelHeader backTo={`/levels/${difficulty}`} backLabel={t('Back to levels')} />

      <CreateLevelEditorPanel
        routeLevelNumber={routeLevelNumber}
        draft={currentDraft}
        activeTool={activeTool}
        requiredCowCount={requiredCowCount}
        colorOptions={colorOptions}
        isDeleting={isDeleting}
        onGenerate={handleGenerate}
        onValidate={handleValidate}
        onSave={handleSave}
        onClearBoard={handleClearBoard}
        onRequestDelete={() =>
          setDeleteDialog({
            difficulty,
            levelNumber: routeLevelNumber!,
          })
        }
        onSetActiveTool={setActiveTool}
        onCellPointerDown={handleCellPointerDown}
        onCellPointerEnter={handleCellPointerEnter}
        onCellPointerUp={handleCellPointerUp}
        t={t}
      />
    </div>
  )
}

export function CreateLevelPage() {
  const { difficulty, levelNumber } = useParams()
  const { t } = useTranslation()

  if (!isDifficulty(difficulty)) {
    return (
      <div className={styles.page}>
        <StatusMessage message={t('Unknown difficulty.')} compact />
      </div>
    )
  }

  return (
    <CreateLevelPageView
      key={`${difficulty}-${levelNumber ?? 'create'}`}
      difficulty={difficulty}
      levelNumber={levelNumber ? Number(levelNumber) : undefined}
    />
  )
}
