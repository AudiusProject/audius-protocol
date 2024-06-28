import { useCallback } from 'react'

import type { User } from '@audius/common/models'
import { profilePageActions, profilePageSelectors } from '@audius/common/store'
import { useDispatch, useSelector } from 'react-redux'

import { IconNotificationOn, Button } from '@audius/harmony-native'

const { setNotificationSubscription } = profilePageActions
const { getIsSubscribed } = profilePageSelectors

const messages = {
  subscribe: 'subscribe',
  subscribed: 'subscribed'
}

type SubscribeButtonProps = {
  profile: Pick<User, 'handle' | 'user_id'>
}

export const SubscribeButton = (props: SubscribeButtonProps) => {
  const { profile } = props
  const { handle, user_id } = profile
  const isSubscribed = useSelector((state) => getIsSubscribed(state, handle))
  const dispatch = useDispatch()

  const handlePress = useCallback(() => {
    dispatch(setNotificationSubscription(user_id, !isSubscribed, true, handle))
  }, [dispatch, user_id, isSubscribed, handle])

  return (
    <Button
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
