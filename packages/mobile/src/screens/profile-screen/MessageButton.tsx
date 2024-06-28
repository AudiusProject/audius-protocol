import { useCallback } from 'react'

import type { User } from '@audius/common/models'
import { Name } from '@audius/common/models'
import { chatActions } from '@audius/common/store'
import { useDispatch } from 'react-redux'

import { IconMessage, Button } from '@audius/harmony-native'
import { make, track } from 'app/services/analytics'

const { createChat } = chatActions

const messages = {
  message: 'Message'
}

type MessageButtonProps = {
  profile: Pick<User, 'user_id'>
}

export const MessageButton = (props: MessageButtonProps) => {
  const { profile } = props
  const { user_id } = profile
  const dispatch = useDispatch()

  const handlePress = useCallback(() => {
    dispatch(createChat({ userIds: [user_id] }))
    track(make({ eventName: Name.CHAT_ENTRY_POINT, source: 'profile' }))
  }, [dispatch, user_id])

  return (
    <Button
      iconRight={IconMessage}
      variant='secondary'
      size='small'
      onPress={handlePress}
      accessibilityLabel={messages.message}
    />
  )
}
