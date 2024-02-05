import { useState, useCallback, useEffect, forwardRef, MouseEvent } from 'react'

import {
  IconUserFollow as IconFollow,
  IconUserFollowing as IconFollowing,
  IconUserUnfollow as IconUnfollow
} from '@audius/harmony'
import { Button, ButtonProps, ButtonSize, ButtonType } from '@audius/stems'
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

export const FollowButton = forwardRef<HTMLButtonElement, FollowButtonProps>(
  function FollowButton(props, ref) {
    const {
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
    } = props
    const [isHovering, setIsHovering] = useState(false)
    const [isHoveringClicked, setIsHoveringClicked] = useState(false)

    const handleMouseEnter = useCallback(() => {
      setIsHovering(true)
    }, [setIsHovering])

    const handleMouseLeave = useCallback(() => {
      setIsHovering(false)
    }, [setIsHovering])

    const style = {
      [styles.noIcon]: !showIcon,
      [styles.full]: size === 'full',
      [styles.medium]: size === 'medium',
      [styles.small]: size === 'small'
    }

    const handleClick = useCallback(
      (e: MouseEvent<HTMLButtonElement>) => {
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

    const isFollowing = following || (!following && isHoveringClicked)

    let buttonType
    if (color) {
      buttonType = ButtonType.PRIMARY
    } else {
      buttonType =
        !isFollowing && !invertedColor
          ? ButtonType.SECONDARY
          : ButtonType.PRIMARY_ALT
    }

    let icon
    let text

    if (!following && !isHoveringClicked) {
      icon = <IconFollow width={18} height={18} />
      text = messages.follow
    } else if (isFollowing && !isHovering) {
      icon = <IconFollowing width={18} height={18} />
      text = messages.following
    } else if (isFollowing && isHovering) {
      icon = <IconUnfollow width={18} height={18} />
      text = messages.unfollow
    }

    if (!showIcon) icon = null

    return (
      <Button
        ref={ref}
        {...buttonProps}
        color={color}
        className={cn(styles.followButton, className, style)}
        textClassName={styles.followButtonText}
        iconClassName={styles.followButtonIcon}
        type={buttonType}
        onClick={handleClick}
        disabled={isDisabled}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        leftIcon={icon}
        size={ButtonSize.SMALL}
        text={text}
      />
    )
  }
)
