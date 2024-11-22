import { useState, useCallback, MouseEventHandler } from 'react'

import { ID, User } from '@audius/common/models'
import { ChatPermissionAction } from '@audius/common/store'
import { CHAT_BLOG_POST_URL } from '@audius/common/utils'
import { Flex, Text } from '@audius/harmony'

import { UserLink, TextLink } from 'components/link'

import { UnblockUserConfirmationModal } from './UnblockUserConfirmationModal'

const messages = {
  follow: (userId: ID) => (
    <>
      You must follow <UserLink variant='visible' userId={userId} /> before you
      can send them messages.
    </>
  ),
  tip: (userId: ID) => (
    <>
      You must send <UserLink variant='visible' userId={userId} /> a tip before
      you can send them them messages.
    </>
  ),
  unblock: 'You cannot send messages to users you have blocked.',
  default: (userId: ID) => (
    <Text>
      You can&apos;t send messages to{' '}
      <UserLink variant='visible' userId={userId} />
    </Text>
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
  const { user_id: userId } = user

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

  let content
  switch (action) {
    case ChatPermissionAction.FOLLOW:
      content = messages.follow(userId)
      break
    case ChatPermissionAction.TIP:
      content = messages.tip(userId)
      break
    case ChatPermissionAction.UNBLOCK:
      content = (
        <>
          {messages.unblock}{' '}
          <TextLink onClick={handleUnblockClicked}>
            {messages.unblockUser}
          </TextLink>
          <UnblockUserConfirmationModal
            user={user}
            isVisible={isUnblockUserConfirmationModalVisible}
            onClose={handleCloseUnblockUserConfirmationModal}
          />
        </>
      )
      break
    default:
      content = (
        <Flex gap='xs' alignItems='center'>
          {messages.default(userId)}
          <TextLink
            textVariant='body'
            variant='visible'
            href={CHAT_BLOG_POST_URL}
            isExternal
          >
            {messages.learnMore}
          </TextLink>
        </Flex>
      )
      break
  }

  return (
    <Flex p='s' alignItems='center' alignSelf='center'>
      {content}
    </Flex>
  )
}
