import { useCallback } from 'react'

import type { FollowSource, ID } from '@audius/common'
import { cacheUsersSelectors, usersSocialActions } from '@audius/common'
import type { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { IconUserFollow, IconUserFollowing } from '@audius/harmony-native'
import type { ButtonProps } from 'app/components/core'
import { Button } from 'app/components/core'
const { followUser, unfollowUser } = usersSocialActions
const { getUser } = cacheUsersSelectors

const messages = {
  follow: 'follow',
  following: 'following'
}

type FollowButtonsProps = Partial<ButtonProps> & {
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

  const variant = isFollowing ? 'primary' : 'primaryAlt'

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
    <Button
      style={style}
      title={isFollowing ? messages.following : messages.follow}
      haptics={!isFollowing}
      variant={variant}
      icon={noIcon ? undefined : Icon}
      iconPosition='left'
      size='small'
      onPress={handlePress}
      {...other}
    />
  )
}
