import { Button, ButtonType, IconCheck } from '@audius/stems'

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
          text={deleteText}
          type={disabled ? ButtonType.DISABLED : ButtonType.SECONDARY}
          disabled={disabled}
          onClick={onDelete}
          className={styles.deleteButton}
          textClassName={styles.deleteButtonText}
          buttonType='button'
        />
      </div>
      <div>
        <Button
          text={cancelText}
          type={disabled ? ButtonType.DISABLED : ButtonType.SECONDARY}
          disabled={disabled}
          onClick={onCancel}
          className={styles.cancelButton}
          textClassName={styles.cancelButtonText}
          buttonType='button'
        />
        <Button
          text={saveText}
          type={disabled ? ButtonType.DISABLED : ButtonType.PRIMARY}
          disabled={disabled}
          onClick={onSave}
          className={styles.saveChangesButton}
          buttonType={isForm ? 'submit' : 'button'}
        />
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
        text={saveText}
        type={disabled ? ButtonType.DISABLED : ButtonType.PRIMARY}
        disabled={disabled}
        onClick={onSave}
        buttonType={isForm ? 'submit' : 'button'}
        rightIcon={<IconCheck />}
      />
    </div>
  )
}
