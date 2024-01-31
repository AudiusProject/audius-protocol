import { useCallback } from 'react'

import type { ID } from '@audius/common/models'
import { useInboxUnavailableModal } from '@audius/common/store'

import { IconMessageLocked } from '@audius/harmony-native'
import { Button } from 'app/components/core'
import { makeStyles } from 'app/styles'

const messages = {
  inboxUnavailable: 'Inbox Unavailable'
}

const useStyles = makeStyles(({ palette, spacing }) => ({
  root: {
    paddingHorizontal: 0,
    height: spacing(7),
    width: spacing(7),
    marginRight: spacing(2),
    borderColor: palette.neutralLight4,
    opacity: 0.4
  }
}))

type MessageLockedButtonProps = {
  userId: ID
}

export const MessageLockedButton = (props: MessageLockedButtonProps) => {
  const styles = useStyles()
  const { userId } = props
  const { onOpen: openInboxUnavailableDrawer } = useInboxUnavailableModal()

  const handlePress = useCallback(() => {
    openInboxUnavailableDrawer({ userId })
  }, [userId, openInboxUnavailableDrawer])

  return (
    <Button
      style={styles.root}
      noText
      title={messages.inboxUnavailable}
      icon={IconMessageLocked}
      variant={'common'}
      size='small'
      onPress={handlePress}
    />
  )
}
