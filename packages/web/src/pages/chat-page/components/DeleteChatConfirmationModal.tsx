import { useCallback } from 'react'

import { chatActions } from '@audius/common'
import {
  Button,
  ButtonType,
  IconTrash,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle
} from '@audius/stems'
import { useDispatch } from 'react-redux'

import styles from './DeleteChatConfirmationModal.module.css'

const { deleteChat } = chatActions

const messages = {
  title: 'Are you sure?',
  content: 'Are you sure you want to delete this chat?',
  confirm: 'Confirm',
  cancel: 'Cancel'
}

type ConfirmationModalProps = {
  isVisible: boolean
  onClose: () => void
  chatId?: string
}

export const DeleteChatConfirmationModal = ({
  isVisible,
  onClose,
  chatId
}: ConfirmationModalProps) => {
  const dispatch = useDispatch()
  const handleConfirmClicked = useCallback(() => {
    if (chatId) {
      dispatch(deleteChat({ chatId }))
    }
    onClose()
  }, [dispatch, onClose, chatId])
  return (
    <Modal bodyClassName={styles.root} isOpen={isVisible} onClose={onClose}>
      <ModalHeader>
        <ModalTitle
          title={messages.title}
          icon={<IconTrash />}
          iconClassName={styles.icon}
        />
      </ModalHeader>
      <ModalContent className={styles.content}>{messages.content}</ModalContent>
      <ModalFooter className={styles.footer}>
        <Button
          className={styles.button}
          type={ButtonType.COMMON_ALT}
          text={messages.cancel}
          onClick={onClose}
        />
        <Button
          className={styles.button}
          type={ButtonType.PRIMARY_ALT}
          text={messages.confirm}
          onClick={handleConfirmClicked}
        />
      </ModalFooter>
    </Modal>
  )
}
