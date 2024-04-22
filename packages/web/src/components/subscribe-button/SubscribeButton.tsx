import { useState, useCallback, useEffect } from 'react'

import {
  Button,
  IconNotificationOn as IconNotification,
  IconNotificationOff
} from '@audius/harmony'

type SubscribeButtonProps = {
  isSubscribed: boolean
  isFollowing: boolean
  onToggleSubscribe: () => void
}

const SubscribeButton = (props: SubscribeButtonProps) => {
  const { isFollowing, isSubscribed, onToggleSubscribe } = props
  const [isHovering, setIsHovering] = useState(false)
  const [isHoveringClicked, setIsHoveringClicked] = useState(false)
  const onClick = useCallback(() => {
    onToggleSubscribe()
    setIsHoveringClicked(true)
  }, [onToggleSubscribe, setIsHoveringClicked])

  useEffect(() => {
    if (!isHovering && isHoveringClicked) setIsHoveringClicked(false)
  }, [isHovering, isHoveringClicked, setIsHoveringClicked])

  if (!isFollowing) return null

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
