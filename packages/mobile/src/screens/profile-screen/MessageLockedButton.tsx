import { useCallback } from 'react'

import type { ID } from '@audius/common/models'
import { useInboxUnavailableModal } from '@audius/common/store'

import { IconMessageLocked, Button } from '@audius/harmony-native'

const messages = {
  inboxUnavailable: 'Inbox Unavailable'
}

type MessageLockedButtonProps = {
  userId: ID
}

export const MessageLockedButton = (props: MessageLockedButtonProps) => {
  const { userId } = props
  const { onOpen: openInboxUnavailableDrawer } = useInboxUnavailableModal()

  const handlePress = useCallback(() => {
    openInboxUnavailableDrawer({ userId })
  }, [userId, openInboxUnavailableDrawer])

  return (
    <Button
      iconRight={IconMessageLocked}
      variant='secondary'
      size='small'
      style={{ opacity: 0.4 }}
      onPress={handlePress}
      accessibilityLabel={messages.inboxUnavailable}
    />
  )
}
