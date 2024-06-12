import { useCallback } from 'react'

import type { FollowSource, ID } from '@audius/common/models'
import { cacheUsersSelectors, usersSocialActions } from '@audius/common/store'
import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import {
  FollowButton as HarmonyFollowButton,
  IconUserFollow,
  IconUserFollowing
} from '@audius/harmony-native'
import type { FollowButtonProps as HarmonyFollowButtonProps } from '@audius/harmony-native'

const { followUser, unfollowUser } = usersSocialActions
const { getUser } = cacheUsersSelectors

type FollowButtonsProps = Partial<HarmonyFollowButtonProps> & {
  userId: ID
  noIcon?: boolean
  style?: StyleProp<ViewStyle>
  followSource: FollowSource
}

export const FollowButton = (props: FollowButtonsProps) => {
  const { userId, noIcon, style, onPress, followSource, ...other } = props

  const isFollowing = useSelector(
    (state) => getUser(state, { id: userId })?.does_current_user_follow
  )
  const dispatch = useDispatch()

  const Icon = isFollowing ? IconUserFollowing : IconUserFollow

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      onPress?.(event)
      if (isFollowing) {
        dispatch(unfollowUser(userId, followSource))
      } else {
        dispatch(followUser(userId, followSource))
      }
    },
    [onPress, dispatch, isFollowing, userId, followSource]
  )

  return (
    <HarmonyFollowButton
      variant='pill'
      isFollowing={isFollowing}
      style={style}
      haptics={!isFollowing}
      iconLeft={noIcon ? undefined : Icon}
      onPress={handlePress}
      {...other}
    />
  )
}
