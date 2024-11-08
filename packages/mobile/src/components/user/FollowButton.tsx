import { useCallback } from 'react'

import type { FollowSource, ID } from '@audius/common/models'
import { cacheUsersSelectors, usersSocialActions } from '@audius/common/store'
import type { GestureResponderEvent } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { FollowButton as HarmonyFollowButton } from '@audius/harmony-native'
import type { FollowButtonProps as HarmonyFollowButtonProps } from '@audius/harmony-native'

const { followUser, unfollowUser } = usersSocialActions
const { getUser } = cacheUsersSelectors

type FollowButtonsProps = Partial<HarmonyFollowButtonProps> & {
  userId: ID
  followSource: FollowSource
}

export const FollowButton = (props: FollowButtonsProps) => {
  const { userId, onPress, followSource, ...other } = props

  const isFollowing = useSelector(
    (state) => getUser(state, { id: userId })?.does_current_user_follow
  )

  const dispatch = useDispatch()

  const handlePress = useCallback(
    (event: GestureResponderEvent) => {
      onPress?.(event)
      setTimeout(() => {
        if (isFollowing) {
          dispatch(unfollowUser(userId, followSource))
        } else {
          dispatch(followUser(userId, followSource))
        }
      }, 1)
    },
    [onPress, dispatch, isFollowing, userId, followSource]
  )

  return (
    <HarmonyFollowButton
      isFollowing={isFollowing}
      onPress={handlePress}
      {...other}
    />
  )
}
