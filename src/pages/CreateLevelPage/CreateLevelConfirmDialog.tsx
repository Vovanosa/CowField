import { Dialog } from '../../components/Dialog'
import { Button } from '../../components/ui'

type CreateLevelConfirmDialogProps = {
  title: string
  description: string
  confirmLabel: string
  onCancel: () => void
  onConfirm: () => void
  t: (key: string, options?: Record<string, unknown>) => string
}

/**
 * Confirmation for the editor actions that throw away unsaved work — clearing the board,
 * regenerating over a draft, or navigating away from one. The editor has no undo, so these are
 * one-way doors.
 */
export function CreateLevelConfirmDialog({
  title,
  description,
  confirmLabel,
  onCancel,
  onConfirm,
  t,
}: CreateLevelConfirmDialogProps) {
  return (
    <Dialog
      role="alertdialog"
      title={title}
      labelledById="confirm-discard-title"
      describedById="confirm-discard-description"
      description={description}
      actions={
        <>
          <Button onClick={onCancel}>{t('Cancel')}</Button>
          <Button variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  )
}
