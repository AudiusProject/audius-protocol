import { useCallback } from 'react'

import type { ID } from '@audius/common/models'
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
  userId: ID
}

export const MessageButton = (props: MessageButtonProps) => {
  const { userId } = props
  const dispatch = useDispatch()

  const handlePress = useCallback(() => {
    dispatch(createChat({ userIds: [userId] }))
    track(make({ eventName: Name.CHAT_ENTRY_POINT, source: 'profile' }))
  }, [dispatch, userId])

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
