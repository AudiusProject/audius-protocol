import { useCallback } from 'react'

import { User } from '@audius/common/models'
import { chatActions } from '@audius/common/store'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
  IconMessageUnblock as IconUnblockMessages,
  Button,
  ModalContentText
} from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { UserNameAndBadges } from 'components/user-name-and-badges/UserNameAndBadges'

const { unblockUser } = chatActions

const messages = {
  title: 'Are you sure?',
  confirm: 'Confirm',
  cancel: 'Cancel',
  content: (user: User) => (
    <>
      Are you sure you want to unblock <UserNameAndBadges user={user} /> and
      allow them to send messages to your inbox?
    </>
  )
}

type UnblockUserConfirmationModalProps = {
  isVisible: boolean
  onClose: () => void
  user: User
}

export const UnblockUserConfirmationModal = ({
  isVisible,
  onClose,
  user
}: UnblockUserConfirmationModalProps) => {
  const dispatch = useDispatch()
  const handleConfirmClicked = useCallback(() => {
    dispatch(unblockUser({ userId: user.user_id }))
    onClose()
  }, [dispatch, onClose, user])

  return (
    <Modal isOpen={isVisible} onClose={onClose} size='small'>
      <ModalHeader>
        <ModalTitle title={messages.title} icon={<IconUnblockMessages />} />
      </ModalHeader>
      <ModalContent>
        <ModalContentText>{messages.content(user)}</ModalContentText>
      </ModalContent>
      <ModalFooter>
        <Button variant='secondary' onClick={onClose} fullWidth>
          {messages.cancel}
        </Button>
        <Button variant='primary' onClick={handleConfirmClicked} fullWidth>
          {messages.confirm}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
