import { useCallback } from 'react'

import { useUser } from '@audius/common/api'
import type { ID } from '@audius/common/models'
import { usersSocialActions as socialActions } from '@audius/common/store'
import { useDispatch } from 'react-redux'

import { IconNotificationOn, Button } from '@audius/harmony-native'

const { subscribeUser, unsubscribeUser } = socialActions

const messages = {
  subscribe: 'subscribe',
  subscribed: 'subscribed'
}

type SubscribeButtonProps = {
  userId: ID
}

export const SubscribeButton = (props: SubscribeButtonProps) => {
  const { userId } = props
  const { data: isSubscribed } = useUser(userId, {
    select: (user) => user.does_current_user_subscribe
  })
  const dispatch = useDispatch()

  const handlePress = useCallback(() => {
    if (userId) {
      if (isSubscribed) {
        dispatch(unsubscribeUser(userId))
      } else {
        dispatch(subscribeUser(userId))
      }
    }
  }, [dispatch, userId, isSubscribed])

  return (
    <Button
      key={`subscribe-${isSubscribed ? 'primary' : 'secondary'}`}
      haptics={!isSubscribed}
      iconRight={IconNotificationOn}
      variant={isSubscribed ? 'primary' : 'secondary'}
      size='small'
      onPress={handlePress}
      accessibilityLabel={
        isSubscribed ? messages.subscribed : messages.subscribe
      }
    />
  )
}
