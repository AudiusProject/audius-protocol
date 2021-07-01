import React, { memo } from 'react'

import { Modal, Button, ButtonSize, ButtonType } from '@audius/stems'
import PropTypes from 'prop-types'

import styles from './DeleteConfirmationModal.module.css'

const DeleteConfirmationModal = props => {
  const header = `This ${props.entity} Will Disappear For Everyone`
  const description = `Are you sure you want to delete this ${props.entity.toLowerCase()}?`

  return (
    <Modal
      title={props.title}
      isOpen={props.visible}
      onClose={props.onCancel}
      bodyClassName={styles.modalBody}
      titleClassName={styles.modalTitle}
      headerContainerClassName={styles.modalHeader}
      showDismissButton
      showTitleHeader
    >
      <div className={styles.container}>
        <div className={styles.text}>
          <div className={styles.header}>{header}</div>
          <div className={styles.description}>{description}</div>
        </div>

        <div className={styles.buttons}>
          <Button
            className={styles.deleteButton}
            textClassName={styles.deleteButtonText}
            text={`DELETE ${props.entity}`}
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

DeleteConfirmationModal.propTypes = {
  title: PropTypes.string,
  visible: PropTypes.bool,
  entity: PropTypes.string,
  onDelete: PropTypes.func,
  onCancel: PropTypes.func
}

DeleteConfirmationModal.defaultProps = {
  visible: false
}

export default memo(DeleteConfirmationModal)
