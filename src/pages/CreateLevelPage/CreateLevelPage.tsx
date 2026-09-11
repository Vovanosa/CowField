import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'

import { useNavigate } from '../../app/navigation'
import { brandedTitle, useDocumentMeta } from '../../app/useDocumentMeta'
import { useRole } from '../../app/role'
import { EmptyState } from '../../components/EmptyState'
import { Button, Panel, StatusMessage, Toast } from '../../components/ui'
import { getDifficultyLabel } from '../../game/getDifficultyLabel'
import { isDifficulty } from '../../game/levels/constants'
import type { Difficulty } from '../../game/types'
import { CreateLevelConfirmDialog } from './CreateLevelConfirmDialog'
import { CreateLevelDeleteDialog } from './CreateLevelDeleteDialog'
import { CreateLevelEditorPanel } from './CreateLevelEditorPanel'
import { CreateLevelHeader } from './CreateLevelHeader'
import { useLevelEditor } from './useLevelEditor'
import styles from './CreateLevelPage.module.css'

type CreateLevelPageViewProps = {
  difficulty: Difficulty
  levelNumber?: number
}

function CreateLevelPageView({
  difficulty,
  levelNumber: routeLevelNumber,
}: CreateLevelPageViewProps) {
  const { t } = useTranslation()
  useDocumentMeta({ title: brandedTitle(t('Edit level')), robots: 'noindex' })
  const { isAdmin } = useRole()
  const navigate = useNavigate()
  const {
    draft,
    loadError,
    toast,
    activeTool,
    isLoading,
    isDeleting,
    isGenerating,
    isValidating,
    deleteDialog,
    colorOptions,
    requiredCowCount,
    pendingDiscard,
    handleCancelDiscard,
    handleConfirmDiscard,
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

  if (isLoading && !draft) {
    return (
      <div className={styles.page}>
        <CreateLevelHeader backTo={`/levels/${difficulty}`} backLabel={t('Back to levels')} />
        <Panel className={styles.loadingPanel}>
          <div className={styles.loadingToolbar}>
            <span className={styles.loadingAction} />
            <span className={styles.loadingAction} />
            <span className={styles.loadingAction} />
          </div>
          <div className={styles.loadingEditorLayout}>
            <div className={styles.loadingBoard} />
            <div className={styles.loadingSidebar} />
          </div>
        </Panel>
      </div>
    )
  }

  if (!draft) {
    return (
      <div className={styles.page}>
        <EmptyState message={loadError} />
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

      {pendingDiscard ? (
        <CreateLevelConfirmDialog
          title={t('Discard unsaved changes?')}
          description={
            pendingDiscard === 'navigate'
              ? t('This level has unsaved changes. Leaving now discards them.')
              : t('This level has unsaved changes. This action replaces the board and discards them.')
          }
          confirmLabel={pendingDiscard === 'navigate' ? t('Leave and discard') : t('Discard')}
          onCancel={handleCancelDiscard}
          onConfirm={handleConfirmDiscard}
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
        isGenerating={isGenerating}
        isValidating={isValidating}
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
