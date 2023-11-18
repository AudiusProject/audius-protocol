import { useState, useCallback, ChangeEvent } from 'react'

import { useTheme, type CSSObject } from '@emotion/react'
import styled from '@emotion/styled'

import type { IconComponent } from 'components/icon'
import { Flex } from 'components/layout/Flex'
import { Text } from 'components/text/Text'
import { useControlled } from 'hooks/useControlled'
import { IconUserFollowing, IconUserFollow, IconUserUnfollow } from 'icons'

import type { CheckboxProps, FollowButtonProps } from './types'

const messages = {
  follow: 'Follow',
  following: 'Following',
  unfollow: 'Unfollow'
}

const inputStyles: CSSObject = {
  position: 'absolute',
  opacity: 0,
  cursor: 'pointer',
  height: 0,
  width: 0
}

const InputRoot = styled.input(inputStyles)
const ButtonRoot = styled.button(inputStyles)

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
    onChange,
    type = 'button',
    checked,
    ...inputProps
  } = props
  const [value, setValueState] = useControlled({
    componentName: 'FollowButton',
    controlledProp: isFollowing,
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

  const handleValueChange = useCallback(() => {
    if (value) {
      onUnfollow?.()
    } else {
      onFollow?.()
    }
    setValueState(!value)
  }, [value, setValueState, onUnfollow, onFollow])

  const handleClick = () => {
    handleValueChange()
  }
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange?.(e)
    handleValueChange()
  }

  const checkedValue = value || checked
  let Icon: IconComponent | null = IconUserFollow
  let text = messages.follow
  if (checkedValue && !isHovering) {
    Icon = IconUserFollowing
    text = messages.following
  } else if (checkedValue && isHovering) {
    Icon = IconUserUnfollow
    text = messages.unfollow
  }

  const { color, cornerRadius } = useTheme()
  const textColor =
    checkedValue || isHovering ? color.static.white : color.primary.primary
  const css: CSSObject = {
    minWidth: size === 'small' ? 128 : 152,
    userSelect: 'none',
    border: `1px solid ${color.primary.primary}`,
    borderRadius: variant === 'pill' ? cornerRadius['2xl'] : cornerRadius.s,
    background:
      checkedValue || isHovering ? color.primary.primary : color.static.white,
    ':active': {
      background: color.primary.p500,
      border: `1px solid ${color.primary.p500}`
    }
  }

  return (
    <label onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {type === 'button' ? (
        <ButtonRoot onClick={handleClick} />
      ) : (
        <InputRoot
          type='checkbox'
          onChange={handleChange}
          {...(inputProps as Partial<CheckboxProps>)}
        />
      )}
      <Flex
        h={size === 'small' ? 28 : 32}
        direction='row'
        alignItems='center'
        justifyContent='center'
        gap='xs'
        pv='s'
        css={css}
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
    </label>
  )
}
