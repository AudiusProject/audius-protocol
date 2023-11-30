import { useState, useCallback, useEffect } from 'react'

import { useTheme, type CSSObject } from '@emotion/react'
import styled from '@emotion/styled'

import type { IconComponent } from 'components/icon'
import { Flex } from 'components/layout/Flex'
import { Text } from 'components/text/Text'
import { useControlled } from 'hooks/useControlled'
import { IconUserFollowing, IconUserFollow, IconUserUnfollow } from 'icons'

import type { FollowButtonProps } from './types'

const messages = {
  follow: 'Follow',
  following: 'Following',
  unfollow: 'Unfollow'
}

const InputRoot = styled.input({
  cursor: 'inherit',
  position: 'absolute',
  opacity: 0,
  width: '100%',
  height: '100%',
  top: 0,
  left: 0,
  margin: 0,
  padding: 0,
  zIndex: 1
})

/**
 * Special button for following or unfollowing a user.
 */
export const FollowButton = (props: FollowButtonProps) => {
  const {
    variant = 'default',
    isFollowing = false,
    onUnfollow,
    onFollow,
    size = 'default',
    ...other
  } = props
  const { type } = other
  const [value, setValueState] = useControlled({
    componentName: 'FollowButton',
    controlledProp: isFollowing,
    defaultValue: undefined,
    stateName: 'following'
  })

  // Track hover manually to swap text and icon
  const [isHovering, setIsHovering] = useState(false)
  const [isPressing, setIsPressing] = useState(false)

  const handleMouseEnter = useCallback(() => {
    setIsHovering(true)
  }, [])

  const handleMouseDown = useCallback(() => {
    setIsPressing(true)
  }, [])

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false)
  }, [])

  const handleMouseUp = useCallback(() => {
    setIsPressing(false)
  }, [])

  const handlePressIn = useCallback(() => {
    setIsHovering(true)
    setIsPressing(true)
  }, [])

  const handlePressOut = useCallback(() => {
    setIsHovering(false)
    setIsPressing(false)
  }, [])

  useEffect(() => {}, [value])

  const handleClick = useCallback(() => {
    if (value) {
      onUnfollow?.()
    } else {
      onFollow?.()
    }
    setValueState(!value)
  }, [value, setValueState, onUnfollow, onFollow])

  const checkedValue = value
  let Icon: IconComponent | null = IconUserFollow
  let text = messages.follow
  if (checkedValue && !isHovering) {
    Icon = IconUserFollowing
    text = messages.following
  } else if (checkedValue && isHovering && !isPressing) {
    Icon = IconUserUnfollow
    text = messages.unfollow
  }

  const { color, cornerRadius } = useTheme()
  const textColor =
    checkedValue || isHovering || isPressing
      ? color.static.white
      : color.primary.primary
  const rootCss: CSSObject = {
    minWidth: size === 'small' ? 128 : 152,
    width: '100%',
    userSelect: 'none',
    borderRadius: variant === 'pill' ? cornerRadius['2xl'] : cornerRadius.s,
    background: isPressing
      ? color.primary.p500
      : checkedValue || isHovering
      ? color.primary.primary
      : color.static.white,
    border: `1px solid ${
      isPressing ? color.primary.p500 : color.primary.primary
    }`
  }

  // Handles case where user mouses down, moves cursor, and mouses up
  useEffect(() => {
    if (isPressing) {
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
    return undefined
  }, [isPressing, handleMouseUp])

  const content = (
    <Flex
      h={size === 'small' ? 28 : 32}
      direction='row'
      alignItems='center'
      justifyContent='center'
      gap='xs'
      pv='s'
    >
      {/* TODO: use theme icon colors (confirm w/design) */}
      <Icon height={18} width={18} css={{ path: { fill: textColor } }} />
      <Text
        variant='label'
        size={size === 'small' ? 's' : 'l'}
        strength='default'
        css={{ color: textColor }}
      >
        {text}
      </Text>
    </Flex>
  )

  const rootProps = {
    css: rootCss,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
    onTouchStart: handlePressIn,
    onTouchEnd: handlePressOut
  }

  switch (type) {
    case 'checkbox': {
      const { checked: checkedIgnored, ...rest } = other
      return (
        <div {...rootProps}>
          {content}
          <InputRoot {...rest} checked={isFollowing} />
        </div>
      )
    }
    case 'button':
    default: {
      return (
        <button {...rootProps} {...other} onClick={handleClick}>
          {content}
        </button>
      )
    }
  }
}
