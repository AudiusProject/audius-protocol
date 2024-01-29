import { Button, IconCheck } from '@audius/harmony'

import styles from './FormActions.module.css'

const messages = {
  deleteButtonTextDefault: 'Delete',
  cancelButtonTextDefault: 'Cancel',
  saveButtonTextDefault: 'Submit'
}

type EditActionsProps = {
  onDelete?: () => void
  onCancel?: () => void
  onSave?: () => void
  disabled?: boolean
  deleteText?: string
  cancelText?: string
  saveText?: string
  isForm?: boolean
}

export const EditActions = ({
  onDelete,
  onCancel,
  onSave,
  disabled = false,
  deleteText = messages.deleteButtonTextDefault,
  cancelText = messages.cancelButtonTextDefault,
  saveText = messages.saveButtonTextDefault,
  isForm = false
}: EditActionsProps) => {
  return (
    <div className={styles.editActionsContainer}>
      <div>
        <Button
          variant='destructive'
          disabled={disabled}
          onClick={onDelete}
          className={styles.deleteButton}
          type='button'
        >
          {deleteText}
        </Button>
      </div>
      <div className={styles.buttonsRight}>
        <Button
          variant='secondary'
          disabled={disabled}
          onClick={onCancel}
          type='button'
        >
          {cancelText}
        </Button>
        <Button
          variant='primary'
          disabled={disabled}
          onClick={onSave}
          type={isForm ? 'submit' : 'button'}
        >
          {saveText}
        </Button>
      </div>
    </div>
  )
}

type CreateActionsProps = {
  disabled?: boolean
  onSave?: () => void
  saveText?: string
  isForm?: boolean
}

export const CreateActions = ({
  disabled = false,
  onSave,
  saveText = messages.saveButtonTextDefault,
  isForm = false
}: CreateActionsProps) => {
  return (
    <div className={styles.createActionsContainer}>
      <Button
        variant='primary'
        disabled={disabled}
        onClick={onSave}
        type={isForm ? 'submit' : 'button'}
        iconRight={IconCheck}
      >
        {saveText}
      </Button>
    </div>
  )
}
