import { useCallback } from 'react'

import { User } from '@audius/common/models'
import { chatActions } from '@audius/common/store'
import { IconMessageUnblock as IconUnblockMessages } from '@audius/harmony'
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

import { UserNameAndBadges } from 'components/user-name-and-badges/UserNameAndBadges'

import styles from './UnblockUserConfirmationModal.module.css'

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
    <Modal bodyClassName={styles.root} isOpen={isVisible} onClose={onClose}>
      <ModalHeader>
        <ModalTitle title={messages.title} icon={<IconUnblockMessages />} />
      </ModalHeader>
      <ModalContent className={styles.content}>
        {messages.content(user)}
      </ModalContent>
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
