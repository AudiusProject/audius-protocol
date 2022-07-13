import { memo } from 'react'

import { Modal, Button, ButtonSize, ButtonType } from '@audius/stems'

import { Nullable } from 'common/utils/typeUtils'

import styles from './DeleteConfirmationModal.module.css'

type DeleteConfirmationModalProps = {
  title: string
  customHeader?: Nullable<string>
  customDescription?: Nullable<string>
  visible: boolean
  entity: string
  onDelete: () => void
  onCancel: () => void
}

const DeleteConfirmationModal = (props: DeleteConfirmationModalProps) => {
  const header =
    props.customHeader == null
      ? `This ${props.entity} Will Disappear For Everyone`
      : props.customHeader
  const description =
    props.customDescription == null
      ? `Are you sure you want to delete this ${props.entity.toLowerCase()}?`
      : props.customDescription

  return (
    <Modal
      title={props.title}
      isOpen={props.visible}
      onClose={props.onCancel}
      bodyClassName={styles.modalBody}
      titleClassName={styles.modalTitle}
      headerContainerClassName={styles.modalHeader}
      showDismissButton
      showTitleHeader>
      <div className={styles.container}>
        <div className={styles.text}>
          <div className={styles.header}>{header}</div>
          <div className={styles.description}>{description}</div>
        </div>

        <div className={styles.buttons}>
          <Button
            className={styles.deleteButton}
            textClassName={styles.deleteButtonText}
            text={`Delete ${props.entity}`}
            size={ButtonSize.MEDIUM}
            type={ButtonType.COMMON}
            onClick={props.onDelete}
          />
          <Button
            className={styles.nevermindButton}
            text='Nevermind'
            size={ButtonSize.MEDIUM}
            type={ButtonType.PRIMARY_ALT}
            onClick={props.onCancel}
          />
        </div>
      </div>
    </Modal>
  )
}

export default memo(DeleteConfirmationModal)
