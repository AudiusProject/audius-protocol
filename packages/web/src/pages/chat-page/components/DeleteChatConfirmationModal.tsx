import { useCallback } from 'react'

import { chatActions } from '@audius/common/store'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
  IconTrash,
  Button,
  ModalContentText
} from '@audius/harmony'
import { useDispatch } from 'react-redux'

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
    <Modal size='small' isOpen={isVisible} onClose={onClose}>
      <ModalHeader>
        <ModalTitle title={messages.title} icon={<IconTrash />} />
      </ModalHeader>
      <ModalContent>
        <ModalContentText>{messages.content}</ModalContentText>
      </ModalContent>
      <ModalFooter>
        <Button variant='secondary' onClick={onClose} fullWidth>
          {messages.cancel}
        </Button>
        <Button variant='destructive' onClick={handleConfirmClicked} fullWidth>
          {messages.confirm}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
