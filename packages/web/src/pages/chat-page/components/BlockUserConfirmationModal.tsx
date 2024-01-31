import { useCallback } from 'react'

import { User, chatActions, Name } from '@audius/common'
import { IconMessageBlock } from '@audius/harmony'
import {
  Button,
  ButtonType,
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
      <UserNameAndBadges user={user} />{' '}
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
        <ModalTitle title={messages.title} icon={<IconMessageBlock />} />
      </ModalHeader>
      <ModalContent className={styles.content}>
        <div>{messages.content(user, isReportAbuse)}</div>
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
          text={isReportAbuse ? messages.confirmReport : messages.confirmBlock}
          onClick={handleConfirmClicked}
        />
      </ModalFooter>
    </Modal>
  )
}
