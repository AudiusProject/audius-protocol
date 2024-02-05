import { useState, useCallback, useEffect } from 'react'

import cn from 'classnames'

import IconNotification from 'assets/img/iconNotification.svg'
import IconNotificationOff from 'assets/img/iconNotificationOff.svg'
import { useIsMobile } from 'hooks/useIsMobile'
import { isMatrix } from 'utils/theme/theme'

import styles from './SubscribeButton.module.css'

type SubscribeButtonProps = {
  className?: string
  isSubscribed: boolean
  isFollowing: boolean
  onToggleSubscribe: () => void
}

const SubscribeButton = ({
  className,
  isFollowing,
  isSubscribed,
  onToggleSubscribe
}: SubscribeButtonProps) => {
  const [isHovering, setIsHovering] = useState(false)
  const [isHoveringClicked, setIsHoveringClicked] = useState(false)
  const isMobile = useIsMobile()
  const onClick = useCallback(() => {
    onToggleSubscribe()
    setIsHoveringClicked(true)
  }, [onToggleSubscribe, setIsHoveringClicked])

  useEffect(() => {
    if (!isHovering && isHoveringClicked) setIsHoveringClicked(false)
  }, [isHovering, isHoveringClicked, setIsHoveringClicked])

  return (
    <div
      className={cn(styles.container, {
        [className as string]: !!className,
        [styles.notFollowing]: !isFollowing,
        [styles.isSubscribed]: isSubscribed,
        [styles.isMobile]: isMobile,
        [styles.isMatrix]: isMatrix()
      })}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={onClick}
    >
      {(isHovering && isSubscribed && !isHoveringClicked) ||
      (isHovering && !isSubscribed && isHoveringClicked) ? (
        <IconNotificationOff className={styles.icon} />
      ) : (
        <IconNotification className={styles.icon} />
      )}
    </div>
  )
}

export default SubscribeButton
