import { useState, useCallback, ChangeEvent } from 'react'

import { useTheme, type CSSObject } from '@emotion/react'

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

/**
 * Special button for following or unfollowing a user.
 */
export const FollowButton = (props: FollowButtonProps) => {
  const {
    variant = 'default',
    following = false,
    onUnfollow,
    onFollow,
    size = 'default',
    ...inputProps
  } = props
  const [value, setValueState] = useControlled({
    componentName: 'FollowButton',
    controlledProp: following,
    defaultValue: undefined,
    stateName: 'following'
  })

  // Track hover manually to swap text and icon
  const [isHovering, setIsHovering] = useState(false)
  const handleMouseEnter = useCallback(() => {
    setIsHovering(true)
  }, [setIsHovering])
  const handleMouseLeave = useCallback(() => {
    setIsHovering(false)
  }, [setIsHovering])

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (value) {
        onUnfollow?.()
      } else {
        onFollow?.()
      }
      setValueState(!value)
    },
    [value, setValueState, onFollow, onUnfollow]
  )

  let Icon: IconComponent | null = IconUserFollow
  let text = messages.follow
  if (value && !isHovering) {
    Icon = IconUserFollowing
    text = messages.following
  } else if (value && isHovering) {
    Icon = IconUserUnfollow
    text = messages.unfollow
  }

  const { color, cornerRadius } = useTheme()
  const textColor =
    value || isHovering ? color.static.white : color.primary.primary
  const css: CSSObject = {
    userSelect: 'none',
    border: `1px solid ${color.primary.primary}`,
    borderRadius: variant === 'pill' ? cornerRadius['2xl'] : cornerRadius.s,
    background:
      value || isHovering ? color.primary.primary : color.static.white,
    ':active': {
      background: color.primary.p500,
      border: `1px solid ${color.primary.p500}`
    }
  }

  return (
    <>
      <label onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <input
          type='checkbox'
          css={{
            position: 'absolute',
            opacity: 0,
            cursor: 'pointer',
            height: 0,
            width: 0
          }}
          onChange={handleChange}
          {...inputProps}
        />
        <Flex
          w={size === 'small' ? 128 : 152}
          h={size === 'small' ? 28 : 32}
          direction='row'
          alignItems='center'
          justifyContent='center'
          gap='xs'
          pv='s'
          css={css}
        >
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
      </label>
    </>
  )
}
