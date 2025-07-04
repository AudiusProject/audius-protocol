import { useCallback } from 'react'

import { useUser } from '@audius/common/api'
import { SquareSizes, type ID } from '@audius/common/models'
import { formatCount, pluralize } from '@audius/common/utils'
import { pick } from 'lodash'
import type { GestureResponderEvent } from 'react-native'

import {
  Avatar,
  Divider,
  Flex,
  Paper,
  Text,
  type PaperProps
} from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'

import { useProfilePicture } from '../image/UserImage'
import { UserLink } from '../user-link'

const messages = {
  follower: 'Follower'
}

type UserCardProps = PaperProps & {
  userId: ID
  noNavigation?: boolean
}
export const UserCard = (props: UserCardProps) => {
  const { userId, onPress, noNavigation, ...other } = props

  const { data: partialUser } = useUser(userId, {
    select: (user) => pick(user, 'handle', 'follower_count')
  })
  const { handle, follower_count } = partialUser ?? {}
  const navigation = useNavigation()

  const handlePress = useCallback(
    (e: GestureResponderEvent) => {
      onPress?.(e)
      if (noNavigation) return

      navigation.push('Profile', { id: userId })
    },
    [onPress, noNavigation, navigation, userId]
  )

  const { source } = useProfilePicture({
    userId,
    size: SquareSizes.SIZE_480_BY_480
  })

  if (!handle || follower_count === undefined || source === undefined)
    return null

  return (
    <Paper border='default' onPress={handlePress} {...other}>
      <Avatar source={source} aria-hidden p='m' pb='s' />
      <Flex ph='l' pb='s' gap='xs' pointerEvents='none'>
        <UserLink
          userId={userId}
          textVariant='title'
          style={{ justifyContent: 'center' }}
        />
        <Text numberOfLines={1} textAlign='center'>
          @{handle}
        </Text>
      </Flex>
      <Divider />
      <Flex
        pv='s'
        backgroundColor='surface1'
        alignItems='center'
        borderBottomLeftRadius='m'
        borderBottomRightRadius='m'
      >
        {/* Ensures correct footer height */}
        <Text size='s' strength='strong' style={{ lineHeight: 16 }}>
          {formatCount(follower_count)}{' '}
          {pluralize(messages.follower, follower_count)}
        </Text>
      </Flex>
    </Paper>
  )
}
