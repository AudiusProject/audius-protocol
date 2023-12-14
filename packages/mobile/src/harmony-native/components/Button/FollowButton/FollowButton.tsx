import { useCallback, useEffect, useMemo, useState } from 'react'

import { css } from '@emotion/native'
import { Pressable } from 'react-native'

import {
  IconUserFollowing,
  IconUserFollow,
  useTheme
} from '@audius/harmony-native'

import { Flex } from '../../layout'

import type { FollowButtonProps } from './types'

export const FollowButton = (props: FollowButtonProps) => {
  const {
    variant = 'default',
    isFollowing = false,
    onUnfollow,
    onFollow,
    size = 'default',
    ...other
  } = props
  const { disabled } = other
  const [following, setFollowing] = useState(isFollowing)
  const { color, cornerRadius } = useTheme()

  useEffect(() => {
    setFollowing(isFollowing)
  }, [isFollowing])

  const Icon = useMemo(() => {
    return following ? IconUserFollowing : IconUserFollow
  }, [following])

  const handlePress = useCallback(() => {
    if (following) {
      onUnfollow?.()
    } else {
      onFollow?.()
    }
    setFollowing(!following)
  }, [following, onUnfollow, onFollow])

  return (
    <Pressable onPress={handlePress} {...other}>
      <Flex
        h={size === 'small' ? 28 : 32}
        direction='row'
        alignItems='center'
        justifyContent='center'
        gap='xs'
        pv='s'
        style={css({
          opacity: disabled ? 0.45 : 1,
          borderRadius:
            variant === 'pill' ? cornerRadius['2xl'] : cornerRadius.s,
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: color.primary.primary,
          backgroundColor: following
            ? color.primary.primary
            : color.background.white
        })}
      >
        <Icon
          height={18}
          width={18}
          fill={following ? color.text.staticWhite : color.primary.primary}
        />
      </Flex>
    </Pressable>
  )
}
