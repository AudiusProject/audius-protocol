import { useCallback } from 'react'

import type { User } from '@audius/common'
import { profilePageSelectors, profilePageActions } from '@audius/common'
import { useDispatch, useSelector } from 'react-redux'

import { IconNotification } from '@audius/harmony-native'
import { Button } from 'app/components/core'
import { makeStyles } from 'app/styles'

const { setNotificationSubscription } = profilePageActions
const { getIsSubscribed } = profilePageSelectors

const messages = {
  subscribe: 'subscribe',
  subscribed: 'subscribed'
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

type SubscribeButtonProps = {
  profile: Pick<User, 'handle' | 'user_id'>
}

export const SubscribeButton = (props: SubscribeButtonProps) => {
  const styles = useStyles()
  const { profile } = props
  const { handle, user_id } = profile
  const isSubscribed = useSelector((state) => getIsSubscribed(state, handle))
  const dispatch = useDispatch()

  const handlePress = useCallback(() => {
    dispatch(setNotificationSubscription(user_id, !isSubscribed, true, handle))
  }, [dispatch, user_id, isSubscribed, handle])

  return (
    <Button
      style={styles.root}
      title={isSubscribed ? messages.subscribed : messages.subscribe}
      haptics={!isSubscribed}
      noText
      icon={IconNotification}
      variant={isSubscribed ? 'primary' : 'common'}
      size='small'
      onPress={handlePress}
    />
  )
}
