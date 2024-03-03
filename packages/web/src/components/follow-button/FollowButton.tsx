import { useState, useCallback, useEffect, forwardRef, MouseEvent } from 'react'

import {
  Button,
  ButtonProps,
  ButtonVariant,
  IconUserFollow,
  IconUserFollowing,
  IconUserUnfollow
} from '@audius/harmony'

type FollowMessages = {
  follow: string
  following: string
  unfollow: string
}

export type FollowButtonProps = Omit<ButtonProps, 'children'> & {
  following?: boolean
  messages?: FollowMessages
  onUnfollow?: () => void
  onFollow?: () => void
  stopPropagation?: boolean
  showIcon?: boolean
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
      following = false,
      onUnfollow,
      onFollow,
      disabled,
      messages = defaultMessages,
      stopPropagation,
      showIcon = true,
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

    let buttonVariant: ButtonVariant
    if (color) {
      buttonVariant = 'primary'
    } else {
      buttonVariant = !isFollowing && !invertedColor ? 'secondary' : 'primary'
    }

    let icon
    let text

    if (!following && !isHoveringClicked) {
      icon = IconUserFollow
      text = messages.follow
    } else if (isFollowing && !isHovering) {
      icon = IconUserFollowing
      text = messages.following
    } else if (isFollowing && isHovering) {
      icon = IconUserUnfollow
      text = messages.unfollow
    }

    if (!showIcon) icon = undefined

    return (
      <Button
        ref={ref}
        {...buttonProps}
        color={color}
        variant={buttonVariant}
        onClick={handleClick}
        disabled={disabled}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        iconLeft={icon}
      >
        {text}
      </Button>
    )
  }
)
