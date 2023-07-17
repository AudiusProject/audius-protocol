import { useState, useCallback, useEffect } from 'react'

import {
  Button,
  ButtonProps,
  ButtonSize,
  ButtonType,
  IconFollow,
  IconFollowing,
  IconUnfollow
} from '@audius/stems'
import cn from 'classnames'

import styles from './FollowButton.module.css'

type FollowButtonSize = 'small' | 'medium' | 'full'

type FollowMessages = {
  follow: string
  following: string
  unfollow: string
}

export type FollowButtonProps = Omit<ButtonProps, 'size' | 'text'> & {
  following?: boolean
  messages?: FollowMessages
  onUnfollow?: () => void
  onFollow?: () => void
  stopPropagation?: boolean
  showIcon?: boolean
  size?: FollowButtonSize
  invertedColor?: boolean
}

const defaultMessages: FollowMessages = {
  follow: 'Follow',
  following: 'Following',
  unfollow: 'Unfollow'
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  color,
  className,
  following = false,
  onUnfollow,
  onFollow,
  isDisabled,
  messages = defaultMessages,
  stopPropagation,
  showIcon = true,
  size = 'medium',
  invertedColor = false,
  ...buttonProps
}) => {
  const [isHovering, setIsHovering] = useState(false)
  const [isHoveringClicked, setIsHoveringClicked] = useState(false)

  const onMouseEnter = useCallback(() => {
    setIsHovering(true)
  }, [setIsHovering])
  const onMouseLeave = useCallback(() => {
    setIsHovering(false)
  }, [setIsHovering])

  const style = {
    [styles.noIcon]: !showIcon,
    [styles.full]: size === 'full',
    [styles.medium]: size === 'medium',
    [styles.small]: size === 'small'
  }

  const onClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (following) {
        onUnfollow?.()
      } else {
        onFollow?.()
      }
      setIsHoveringClicked(true)
      if (stopPropagation) {
        e.stopPropagation()
        e.nativeEvent.stopImmediatePropagation()
      }
    },
    [following, onUnfollow, onFollow, setIsHoveringClicked, stopPropagation]
  )

  useEffect(() => {
    if (!isHovering && isHoveringClicked) setIsHoveringClicked(false)
  }, [isHovering, isHoveringClicked, setIsHoveringClicked])

  let buttonType
  if (color) {
    buttonType = ButtonType.PRIMARY
  } else {
    buttonType =
      !following && !isHovering && !isHoveringClicked && !invertedColor
        ? ButtonType.SECONDARY
        : ButtonType.PRIMARY_ALT
  }

  let icon
  let text
  if (!following && !isHoveringClicked) {
    icon = <IconFollow width={18} height={18} />
    text = messages.follow
  } else if (!following && isHoveringClicked) {
    icon = <IconFollowing width={18} height={18} />
    text = messages.following
  } else {
    icon = <IconUnfollow width={18} height={18} />
    text = messages.unfollow
  }

  if (!showIcon) icon = null

  return (
    <Button
      {...buttonProps}
      color={color}
      className={cn(styles.followButton, className, style)}
      textClassName={styles.followButtonText}
      iconClassName={styles.followButtonIcon}
      type={buttonType}
      onClick={onClick}
      disabled={isDisabled}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      leftIcon={icon}
      size={ButtonSize.SMALL}
      text={text}
    />
  )
}
