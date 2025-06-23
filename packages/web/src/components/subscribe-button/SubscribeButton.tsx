import { useState, useCallback, useEffect } from 'react'

import { useUser } from '@audius/common/api'
import { ID } from '@audius/common/models'
import { usersSocialActions as socialActions } from '@audius/common/store'
import {
  Button,
  IconNotificationOn as IconNotification,
  IconNotificationOff
} from '@audius/harmony'
import { useDispatch } from 'react-redux'

const { subscribeUser, unsubscribeUser } = socialActions

type SubscribeButtonProps = {
  userId: ID
}

const SubscribeButton = (props: SubscribeButtonProps) => {
  const { userId } = props
  const { data: isSubscribed } = useUser(userId, {
    select: (user) => user.does_current_user_subscribe
  })
  const dispatch = useDispatch()

  const [isHovering, setIsHovering] = useState(false)
  const [isHoveringClicked, setIsHoveringClicked] = useState(false)

  const onClick = useCallback(() => {
    if (userId) {
      if (isSubscribed) {
        dispatch(unsubscribeUser(userId))
      } else {
        dispatch(subscribeUser(userId))
      }
    }
    setIsHoveringClicked(true)
  }, [dispatch, userId, isSubscribed, setIsHoveringClicked])

  useEffect(() => {
    if (!isHovering && isHoveringClicked) setIsHoveringClicked(false)
  }, [isHovering, isHoveringClicked, setIsHoveringClicked])

  const showNotificationOff =
    (isHovering && isSubscribed && !isHoveringClicked) ||
    (isHovering && !isSubscribed && isHoveringClicked)

  return (
    <Button
      variant={isSubscribed ? 'primary' : 'secondary'}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      size='small'
      iconLeft={showNotificationOff ? IconNotificationOff : IconNotification}
      onClick={onClick}
    />
  )
}

export default SubscribeButton
