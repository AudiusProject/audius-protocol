import { ReactNode, useCallback } from 'react'

import {
  CHAT_BLOG_POST_URL,
  ChatPermissionAction,
  User,
  chatActions,
  chatSelectors,
  tippingActions
} from '@audius/common'
import {
  IconMessageLocked,
  IconTipping,
  ModalTitle,
  Modal,
  ModalHeader,
  Button,
  ModalContent,
  ModalFooter,
  ButtonType,
  IconUnblockMessages
} from '@audius/stems'
import { useDispatch } from 'react-redux'

import { UserNameAndBadges } from 'components/user-name-and-badges/UserNameAndBadges'
import { useSelector } from 'utils/reducer'

import styles from './InboxUnavailableModal.module.css'

const { unblockUser, createChat } = chatActions

const messages = {
  title: 'Inbox Unavailable',
  content: "You can't send messages to this person.",
  button: 'Learn More',
  tipContent: (displayName: ReactNode) => (
    <>
      {'You must send '}
      {displayName}
      {' a tip before you can send them messages.'}
    </>
  ),
  tipButton: 'Send $AUDIO',
  unblockContent: 'You cannot send messages to users you have blocked.',
  unblockButton: 'Unblock'
}

const actionToContent = (
  action: ChatPermissionAction,
  user: User,
  onClose: () => void
) => {
  switch (action) {
    case ChatPermissionAction.NONE:
      return {
        content: messages.content,
        buttonText: messages.button,
        buttonIcon: null
      }
    case ChatPermissionAction.TIP:
      return {
        content: messages.tipContent(
          <UserNameAndBadges user={user} onNavigateAway={onClose} />
        ),
        buttonText: messages.tipButton,
        buttonIcon: <IconTipping />
      }
    case ChatPermissionAction.UNBLOCK:
      return {
        content: messages.unblockContent,
        buttonText: messages.unblockButton,
        buttonIcon: <IconUnblockMessages />
      }
    default:
      return {
        content: messages.content,
        buttonText: messages.button,
        buttonIcon: null
      }
  }
}

const { beginTip } = tippingActions
const { getCanCreateChat } = chatSelectors

export const InboxUnavailableModal = ({
  isVisible,
  onDismiss,
  onClose,
  user
}: {
  isVisible: boolean
  onDismiss?: () => void
  onClose: () => void
  user: User
}) => {
  const dispatch = useDispatch()
  const { callToAction } = useSelector((state) =>
    getCanCreateChat(state, { userId: user.user_id })
  )
  const hasAction =
    callToAction === ChatPermissionAction.TIP ||
    callToAction === ChatPermissionAction.UNBLOCK

  const handleClick = useCallback(() => {
    if (callToAction === ChatPermissionAction.TIP) {
      dispatch(beginTip({ user, source: 'inboxUnavailableModal' }))
      onClose()
    } else if (callToAction === ChatPermissionAction.UNBLOCK) {
      dispatch(unblockUser({ userId: user.user_id }))
      dispatch(createChat({ userIds: [user.user_id] }))
      onClose()
    } else {
      window.open(CHAT_BLOG_POST_URL, '_blank')
      onClose()
    }
  }, [dispatch, onClose, user, callToAction])

  const handleDismiss = useCallback(() => {
    onDismiss?.()
    onClose()
  }, [onDismiss, onClose])

  const { content, buttonText, buttonIcon } = actionToContent(
    callToAction,
    user,
    onClose
  )

  return (
    <Modal
      bodyClassName={styles.modalBody}
      isOpen={isVisible}
      onClose={handleDismiss}
    >
      <ModalHeader>
        <ModalTitle
          icon={<IconMessageLocked className={styles.icon} />}
          title={messages.title}
        />
      </ModalHeader>
      <ModalContent className={styles.content}>{content}</ModalContent>
      <ModalFooter className={styles.footer}>
        <Button
          className={styles.button}
          type={hasAction ? ButtonType.PRIMARY_ALT : ButtonType.COMMON_ALT}
          text={buttonText}
          leftIcon={buttonIcon}
          onClick={handleClick}
        />
      </ModalFooter>
    </Modal>
  )
}
