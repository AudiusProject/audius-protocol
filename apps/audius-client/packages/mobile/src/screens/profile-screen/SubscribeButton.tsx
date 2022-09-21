import { useCallback } from 'react'

import type { User } from '@audius/common'
import { profilePageSelectors, profilePageActions } from '@audius/common'
import { useDispatch, useSelector } from 'react-redux'

import IconNotification from 'app/assets/images/iconNotification.svg'
import { Button } from 'app/components/core'
import { makeStyles } from 'app/styles'

const { setNotificationSubscription } = profilePageActions
const { getIsSubscribed } = profilePageSelectors

const messages = {
  subscribe: 'subscribe',
  subscribed: 'subscribed'
}

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    paddingHorizontal: 0,
    height: spacing(8),
    width: spacing(8),
    marginRight: spacing(2)
  }
}))

type SubscribeButtonProps = {
  profile: User
}

export const SubscribeButton = (props: SubscribeButtonProps) => {
  const styles = useStyles()
  const { profile } = props
  const isSubscribed = useSelector((state) =>
    getIsSubscribed(state, profile.handle)
  )
  const { user_id } = profile
  const dispatch = useDispatch()

  const handlePress = useCallback(() => {
    dispatch(setNotificationSubscription(user_id, !isSubscribed, true))
  }, [dispatch, user_id, isSubscribed])

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
