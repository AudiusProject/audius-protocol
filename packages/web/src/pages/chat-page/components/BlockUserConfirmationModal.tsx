import { useCallback } from 'react'

import { Name, User } from '@audius/common/models'
import { chatActions } from '@audius/common/store'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalFooter,
  IconMessageSlash,
  IconInfo,
  Button,
  Hint
} from '@audius/harmony'
import { useDispatch } from 'react-redux'

import { UserLink } from 'components/link/UserLink'
import { track, make } from 'services/analytics'

import styles from './BlockUserConfirmationModal.module.css'

const { blockUser } = chatActions

const messages = {
  title: 'Are you sure?',
  confirmBlock: 'Block User',
  confirmReport: 'Report & Block',
  cancel: 'Cancel',
  content: (user: User, isReport?: boolean) => (
    <>
      Are you sure you want to {isReport ? 'report' : 'block'}{' '}
      <UserLink userId={user.user_id} size='l' />{' '}
      {isReport
        ? 'for abuse? They will be blocked from sending you new messages.'
        : 'from sending messages to your inbox?'}
    </>
  ),
  callout:
    'This will not affect their ability to view your profile or interact with your content.'
}

type BlockUserConfirmationModalProps = {
  isVisible: boolean
  onClose: () => void
  user: User
  isReportAbuse?: boolean
}

export const BlockUserConfirmationModal = ({
  isVisible,
  onClose,
  user,
  isReportAbuse
}: BlockUserConfirmationModalProps) => {
  const dispatch = useDispatch()
  const handleConfirmClicked = useCallback(() => {
    dispatch(blockUser({ userId: user.user_id }))
    if (isReportAbuse) {
      track(
        make({
          eventName: Name.CHAT_REPORT_USER,
          reportedUserId: user.user_id
        })
      )
    }
    onClose()
  }, [dispatch, isReportAbuse, onClose, user.user_id])

  return (
    <Modal bodyClassName={styles.root} isOpen={isVisible} onClose={onClose}>
      <ModalHeader>
        <ModalTitle title={messages.title} icon={<IconMessageSlash />} />
      </ModalHeader>
      <ModalContent className={styles.content}>
        <div>{messages.content(user, isReportAbuse)}</div>
        <Hint icon={IconInfo}>{messages.callout}</Hint>
      </ModalContent>
      <ModalFooter className={styles.footer}>
        <Button variant='secondary' onClick={onClose} fullWidth>
          {messages.cancel}
        </Button>
        <Button variant='destructive' onClick={handleConfirmClicked} fullWidth>
          {isReportAbuse ? messages.confirmReport : messages.confirmBlock}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
