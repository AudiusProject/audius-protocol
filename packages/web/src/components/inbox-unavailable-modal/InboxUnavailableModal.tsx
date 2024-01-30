import { ReactNode, useCallback } from 'react'

import {
  CHAT_BLOG_POST_URL,
  ChatPermissionAction,
  accountSelectors,
  cacheUsersSelectors,
  chatActions,
  chatSelectors,
  makeChatId,
  tippingActions,
  useInboxUnavailableModal
} from '@audius/common'
import { User } from '@audius/common/models'
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
import { Action } from '@reduxjs/toolkit'
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
  unblockButton: 'Unblock',
  defaultUsername: 'this user'
}

const actionToContent = ({
  action,
  user,
  onClose
}: {
  action: ChatPermissionAction
  user?: User | null
  onClose: () => void
}) => {
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
          user ? (
            <UserNameAndBadges user={user} onNavigateAway={onClose} />
          ) : (
            messages.defaultUsername
          )
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

export const InboxUnavailableModal = () => {
  const { isOpen, onClose, onClosed, data } = useInboxUnavailableModal()
  const { userId, presetMessage, onSuccessAction, onCancelAction } = data
  const user = useSelector((state) =>
    cacheUsersSelectors.getUser(state, { id: userId })
  )
  const dispatch = useDispatch()
  const currentUserId = useSelector(accountSelectors.getUserId)
  const { callToAction } = useSelector((state) =>
    getCanCreateChat(state, { userId })
  )
  const hasAction =
    callToAction === ChatPermissionAction.TIP ||
    callToAction === ChatPermissionAction.UNBLOCK

  const handleClick = useCallback(() => {
    if (!userId) {
      console.error(
        'Unexpected undefined user for InboxUnavailableModal click handler'
      )
      return
    }
    if (callToAction === ChatPermissionAction.TIP && currentUserId) {
      const chatId = makeChatId([currentUserId, userId])
      const tipSuccessActions: Action[] = [
        chatActions.goToChat({
          chatId,
          presetMessage
        })
      ]
      if (onSuccessAction) {
        tipSuccessActions.push(onSuccessAction)
      }
      dispatch(
        beginTip({
          user,
          source: 'inboxUnavailableModal',
          onSuccessActions: tipSuccessActions,
          onSuccessConfirmedActions: [
            chatActions.createChat({
              userIds: [userId],
              skipNavigation: true
            })
          ]
        })
      )
    } else if (callToAction === ChatPermissionAction.UNBLOCK) {
      dispatch(unblockUser({ userId }))
      dispatch(createChat({ userIds: [userId], presetMessage }))
      if (onSuccessAction) {
        dispatch(onSuccessAction)
      }
    } else {
      window.open(CHAT_BLOG_POST_URL, '_blank')
    }
    onClose()
  }, [
    user,
    userId,
    callToAction,
    currentUserId,
    onClose,
    presetMessage,
    onSuccessAction,
    dispatch
  ])

  const handleCancel = useCallback(() => {
    if (onCancelAction) {
      dispatch(onCancelAction)
    }
    onClose()
  }, [dispatch, onCancelAction, onClose])

  const { content, buttonText, buttonIcon } = actionToContent({
    action: callToAction,
    user,
    onClose
  })

  return (
    <Modal
      bodyClassName={styles.modalBody}
      isOpen={isOpen}
      onClose={onClose}
      onClosed={onClosed}
    >
      <ModalHeader onClose={handleCancel}>
        <ModalTitle icon={<IconMessageLocked />} title={messages.title} />
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
