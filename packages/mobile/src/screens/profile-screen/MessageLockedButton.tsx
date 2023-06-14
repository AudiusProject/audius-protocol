import { useCallback } from 'react'

import type { User } from '@audius/common'
import { useDispatch } from 'react-redux'

import IconMessageLocked from 'app/assets/images/iconMessageLocked.svg'
import { Button } from 'app/components/core'
import { setVisibility } from 'app/store/drawers/slice'
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
  profile: Pick<User, 'user_id'>
}

export const MessageLockedButton = (props: MessageLockedButtonProps) => {
  const styles = useStyles()
  const { profile } = props
  const { user_id: userId } = profile
  const dispatch = useDispatch()

  const handlePress = useCallback(() => {
    dispatch(
      setVisibility({
        drawer: 'InboxUnavailable',
        visible: true,
        data: { userId, shouldOpenChat: true }
      })
    )
  }, [dispatch, userId])

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
