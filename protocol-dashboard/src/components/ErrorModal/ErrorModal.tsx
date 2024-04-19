import React from 'react'

import { ButtonType } from '@audius/stems'
import SimpleBar from 'simplebar-react'

import Button from 'components/Button'
import Modal from 'components/Modal'

import styles from './ErrorModal.module.css'

const messages = {
  title: 'An Error Has Occured',
  defaultHeader:
    'There was an error in executing the transaction. Please try again.',
  header:
    'Actions cannot be taken until pending transactions are completed. Please try again.',
  okay: 'OKAY'
}

type OwnProps = {
  isOpen: boolean
  onClose: () => void
  message: string
  header?: string
}

type ErrorModalProps = OwnProps

const ErrorModal: React.FC<ErrorModalProps> = ({
  isOpen,
  onClose,
  message,
  header = messages.defaultHeader
}: ErrorModalProps) => {
  return (
    <Modal
      title={messages.title}
      className={styles.container}
      wrapperClassName={styles.wrapperClassName}
      isOpen={isOpen}
      onClose={onClose}
      isCloseable={true}
      dismissOnClickOutside={false}
    >
      <div className={styles.header}>{header}</div>

      <SimpleBar className={styles.scrollableMessage}>{message}</SimpleBar>
      <Button
        text={messages.okay}
        type={ButtonType.PRIMARY}
        onClick={onClose}
      />
    </Modal>
  )
}

export default ErrorModal
