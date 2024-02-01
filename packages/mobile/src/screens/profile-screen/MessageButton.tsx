import { useCallback } from 'react'

import type { User } from '@audius/common/models'
import { Name } from '@audius/common/models'
import { chatActions } from '@audius/common/store'
import { useDispatch } from 'react-redux'

import { IconMessage } from '@audius/harmony-native'
import { Button } from 'app/components/core'
import { make, track } from 'app/services/analytics'
import { makeStyles } from 'app/styles'

const { createChat } = chatActions

const messages = {
  message: 'Message'
}

const useStyles = makeStyles(({ palette, spacing }) => ({
  root: {
    paddingHorizontal: 0,
    height: spacing(7),
    width: spacing(7),
    marginRight: spacing(2),
    borderColor: palette.neutralLight4
  }
}))

type MessageButtonProps = {
  profile: Pick<User, 'user_id'>
}

export const MessageButton = (props: MessageButtonProps) => {
  const styles = useStyles()
  const { profile } = props
  const { user_id } = profile
  const dispatch = useDispatch()

  const handlePress = useCallback(() => {
    dispatch(createChat({ userIds: [user_id] }))
    track(make({ eventName: Name.CHAT_ENTRY_POINT, source: 'profile' }))
  }, [dispatch, user_id])

  return (
    <Button
      style={styles.root}
      noText
      title={messages.message}
      icon={IconMessage}
      variant={'common'}
      size='small'
      onPress={handlePress}
    />
  )
}
