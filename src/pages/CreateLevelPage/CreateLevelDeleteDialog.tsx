import { Trash2 } from 'lucide-react'

import { Dialog } from '../../components/Dialog'
import { Button } from '../../components/ui'

type CreateLevelDeleteDialogProps = {
  title: string
  description: string
  isDeleting: boolean
  onCancel: () => void
  onDelete: () => void
  t: (key: string, options?: Record<string, unknown>) => string
}

export function CreateLevelDeleteDialog({
  title,
  description,
  isDeleting,
  onCancel,
  onDelete,
  t,
}: CreateLevelDeleteDialogProps) {
  return (
    <Dialog
      role="alertdialog"
      title={title}
      labelledById="delete-level-title"
      describedById="delete-level-description"
      description={description}
      actions={
        <>
          <Button onClick={onCancel} disabled={isDeleting}>
            {t('Cancel')}
          </Button>
          <Button
            variant="danger"
            onClick={onDelete}
            disabled={isDeleting}
            leadingIcon={<Trash2 size={18} />}
          >
            {isDeleting ? t('Deleting...') : t('Delete level')}
          </Button>
        </>
      }
    />
  )
}
