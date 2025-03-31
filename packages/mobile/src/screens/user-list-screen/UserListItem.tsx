import { useCallback } from 'react'

import { useUser } from '@audius/common/api'
import type { ID } from '@audius/common/models'
import { FollowSource } from '@audius/common/models'
import { accountSelectors } from '@audius/common/store'
import { formatCount } from '@audius/common/utils'
import { pick } from 'lodash'
import { Pressable, Animated } from 'react-native'
import { useSelector } from 'react-redux'

import { Text, IconUser, Flex } from '@audius/harmony-native'
import { ProfilePicture } from 'app/components/core'
import { FollowButton, FollowsYouBadge } from 'app/components/user'
import { UserLink } from 'app/components/user-link'
import { useNavigation } from 'app/hooks/useNavigation'
import { useColorAnimation } from 'app/hooks/usePressColorAnimation'
import { makeStyles } from 'app/styles'
import { useThemeColors } from 'app/utils/theme'

import { SupporterInfo } from './SupporterInfo'
import { SupportingInfo } from './SupportingInfo'

const getUserId = accountSelectors.getUserId

const messages = {
  followers: (followerCount: number) =>
    followerCount === 1 ? 'Follower' : 'Followers'
}

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    padding: spacing(4),
    gap: spacing(4)
  }
}))

type UserListItemProps = {
  tag: string
  userId: ID
}

export const UserListItem = (props: UserListItemProps) => {
  const { tag, userId } = props
  const { data: user } = useUser(userId, {
    select: (user) => pick(user, ['handle', 'follower_count'])
  })
  const { handle, follower_count = 0 } = user ?? {}
  const currentUserId = useSelector(getUserId)
  const styles = useStyles()
  const navigation = useNavigation()
  const { white, neutralLight10 } = useThemeColors()
  const { color, handlePressIn, handlePressOut } = useColorAnimation(
    white,
    neutralLight10
  )

  const handlePress = useCallback(() => {
    navigation.push('Profile', { handle })
  }, [navigation, handle])

  return (
    <Animated.View style={{ backgroundColor: color }}>
      <Pressable
        style={styles.root}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Flex row gap='s'>
          <ProfilePicture userId={userId} size='large' />
          <Flex gap='s'>
            <Flex>
              <UserLink userId={userId} strength='strong' />
              <Text size='s'>@{handle}</Text>
            </Flex>
            <Flex row justifyContent='space-between' alignItems='center'>
              <Flex row gap='xs' alignItems='center'>
                <IconUser color='subdued' size='s' />
                <Text size='s' color='subdued'>
                  <Text strength='strong' color='inherit'>
                    {formatCount(follower_count)}
                  </Text>{' '}
                  {messages.followers(follower_count)}
                </Text>
              </Flex>
              <FollowsYouBadge userId={userId} />
            </Flex>
            {tag === 'SUPPORTING' ? <SupportingInfo userId={userId} /> : null}
            {tag === 'TOP SUPPORTERS' ? (
              <SupporterInfo userId={userId} />
            ) : null}
          </Flex>
        </Flex>
        {currentUserId !== userId ? (
          <FollowButton
            variant='pill'
            userId={userId}
            followSource={FollowSource.USER_LIST}
          />
        ) : null}
      </Pressable>
    </Animated.View>
  )
}
