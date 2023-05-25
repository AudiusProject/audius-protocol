import { useCallback } from 'react'

import { User, chatActions } from '@audius/common'
import {
  Button,
  ButtonType,
  IconBlockMessages,
  IconInfo,
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle
} from '@audius/stems'
import { useDispatch } from 'react-redux'

import { HelpCallout } from 'components/help-callout/HelpCallout'
import { UserNameAndBadges } from 'components/user-name-and-badges/UserNameAndBadges'

import styles from './BlockUserConfirmationModal.module.css'

const { blockUser } = chatActions

const messages = {
  title: 'Are you sure?',
  confirm: 'Block User',
  cancel: 'Cancel',
  content: (user: User) => (
    <>
      Are you sure you want to block <UserNameAndBadges user={user} /> from
      sending messages to your inbox?
    </>
  ),
  callout:
    'This will not affect their ability to view your profile or interact with your content.'
}

type BlockUserConfirmationModalProps = {
  isVisible: boolean
  onClose: () => void
  user: User
}

export const BlockUserConfirmationModal = ({
  isVisible,
  onClose,
  user
}: BlockUserConfirmationModalProps) => {
  const dispatch = useDispatch()
  const handleConfirmClicked = useCallback(() => {
    dispatch(blockUser({ userId: user.user_id }))
    onClose()
  }, [dispatch, onClose, user])

  return (
    <Modal bodyClassName={styles.root} isOpen={isVisible} onClose={onClose}>
      <ModalHeader>
        <ModalTitle
          title={messages.title}
          icon={<IconBlockMessages />}
          iconClassName={styles.icon}
        />
      </ModalHeader>
      <ModalContent className={styles.content}>
        <div>{messages.content(user)}</div>
        <HelpCallout icon={<IconInfo />} content={messages.callout} />
      </ModalContent>
      <ModalFooter className={styles.footer}>
        <Button
          className={styles.button}
          type={ButtonType.PRIMARY}
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
