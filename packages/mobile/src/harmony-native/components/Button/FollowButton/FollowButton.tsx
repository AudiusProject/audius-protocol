import type { ChangeEvent } from 'react'
import { useCallback, useEffect, useState } from 'react'

import { css } from '@emotion/native'
import type { GestureResponderEvent } from 'react-native'
import { Pressable } from 'react-native'

import {
  IconUserFollowing,
  IconUserFollow,
  useTheme
} from '@audius/harmony-native'

import * as haptics from '../../../../haptics'
import { Text } from '../../Text/Text'
import { Flex } from '../../layout'

import type { FollowButtonProps } from './types'

const messages = {
  follow: 'Follow',
  following: 'Following'
}

export const FollowButton = (props: FollowButtonProps) => {
  const {
    variant = 'default',
    isFollowing = false,
    onUnfollow,
    onFollow,
    size = 'default',
    value,
    onChange,
    ...other
  } = props
  const { disabled, onPress } = other
  const [following, setFollowing] = useState(isFollowing)
  const { color, cornerRadius } = useTheme()
  const isInput = !!onChange

  useEffect(() => {
    setFollowing(isFollowing)
  }, [isFollowing])

  const Icon = following ? IconUserFollowing : IconUserFollow

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      if (following) {
        onUnfollow?.()
      } else {
        haptics.medium()
        onFollow?.()
      }
      onChange?.({
        target: { value, checked: !following, type: 'checkbox' }
      } as ChangeEvent<HTMLInputElement>)
      setFollowing(!following)
      onPress?.(event)
    },
    [following, onChange, value, onUnfollow, onFollow, onPress]
  )

  const inputProps = isInput
    ? {
        testID: `follow-${value}`,
        accessibilityRole: 'checkbox' as const,
        accessibilityState: { checked: following, value },
        accessibilityLiveRegion: 'polite' as const
      }
    : null

  return (
    <Pressable onPress={handlePress} {...inputProps}>
      <Flex
        h={size === 'small' ? 28 : 32}
        direction='row'
        alignItems='center'
        justifyContent='center'
        gap='xs'
        ph='l'
        border='default'
        style={css({
          opacity: disabled ? 0.45 : 1,
          borderRadius:
            variant === 'pill' ? cornerRadius['2xl'] : cornerRadius.s,
          borderColor: color.primary.primary,
          backgroundColor: following
            ? color.primary.primary
            : color.background.white
        })}
      >
        <Icon
          height={18}
          width={18}
          fill={following ? color.icon.staticWhite : color.primary.primary}
        />

        <Text
          variant='label'
          size={size === 'small' ? 's' : 'l'}
          strength='default'
          style={{
            color: following ? color.icon.staticWhite : color.primary.primary
          }}
        >
          {following ? messages.following : messages.follow}
        </Text>
      </Flex>
    </Pressable>
  )
}
