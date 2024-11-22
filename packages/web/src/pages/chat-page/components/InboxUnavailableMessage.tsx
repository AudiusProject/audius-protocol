import { useState, useCallback, MouseEventHandler } from 'react'

import { User } from '@audius/common/models'
import { ChatPermissionAction } from '@audius/common/store'
import { CHAT_BLOG_POST_URL } from '@audius/common/utils'

import { UserLink } from 'components/link'

import styles from './InboxUnavailableMessage.module.css'
import { UnblockUserConfirmationModal } from './UnblockUserConfirmationModal'

const messages = {
  follow: (user: User) => (
    <>
      You must follow <UserLink userId={user.user_id} /> before you can send
      them messages.
    </>
  ),
  tip: (user: User) => (
    <>
      You must send <UserLink userId={user.user_id} /> a tip before you can send
      them messages.
    </>
  ),
  unblock: 'You cannot send messages to users you have blocked.',
  default: (user: User) => (
    <>
      You can&apos;t send messages to <UserLink userId={user.user_id} />
    </>
  ),
  learnMore: 'Learn More.',
  unblockUser: 'Unblock User.'
}

export const InboxUnavailableMessage = ({
  user,
  action
}: {
  user: User
  action: ChatPermissionAction
}) => {
  const [
    isUnblockUserConfirmationModalVisible,
    setIsUnblockUserConfirmationModalVisible
  ] = useState(false)

  const handleUnblockClicked: MouseEventHandler = useCallback(
    (e) => {
      e.preventDefault()
      setIsUnblockUserConfirmationModalVisible(true)
    },
    [setIsUnblockUserConfirmationModalVisible]
  )

  const handleCloseUnblockUserConfirmationModal = useCallback(() => {
    setIsUnblockUserConfirmationModalVisible(false)
  }, [setIsUnblockUserConfirmationModalVisible])

  switch (action) {
    case ChatPermissionAction.FOLLOW:
      return <div className={styles.root}>{messages.follow(user)}</div>
    case ChatPermissionAction.TIP:
      return <div className={styles.root}>{messages.tip(user)}</div>
    case ChatPermissionAction.UNBLOCK:
      return (
        <div className={styles.root}>
          {messages.unblock}{' '}
          <a href='#' onClick={handleUnblockClicked}>
            {messages.unblockUser}
          </a>
          <UnblockUserConfirmationModal
            user={user}
            isVisible={isUnblockUserConfirmationModalVisible}
            onClose={handleCloseUnblockUserConfirmationModal}
          />
        </div>
      )
    default:
      return (
        <div className={styles.root}>
          {messages.default(user)}{' '}
          <a href={CHAT_BLOG_POST_URL} target='_blank' rel='noreferrer'>
            {messages.learnMore}
          </a>
        </div>
      )
  }
}
