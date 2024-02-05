import { useCallback } from 'react'

import { chatActions } from '@audius/common/store'
import { IconTrash } from '@audius/harmony'
import {
  Button,
  ButtonType,
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
  title: 'Delete Conversation',
  content: `Are you sure you want to delete this conversation?

  Other people in the conversation will still be able to see it. This can’t be undone.`,
  confirm: 'Delete Conversation',
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
        <ModalTitle title={messages.title} icon={<IconTrash />} />
      </ModalHeader>
      <ModalContent className={styles.content}>{messages.content}</ModalContent>
      <ModalFooter className={styles.footer}>
        <Button
          className={styles.button}
          textClassName={styles.buttonText}
          type={ButtonType.COMMON_ALT}
          text={messages.cancel}
          onClick={onClose}
        />
        <Button
          className={styles.button}
          type={ButtonType.DESTRUCTIVE}
          text={messages.confirm}
          onClick={handleConfirmClicked}
        />
      </ModalFooter>
    </Modal>
  )
}
