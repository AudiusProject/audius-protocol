import { useCallback, MouseEvent } from 'react'

import { useUser } from '@audius/common/api'
import { ID, SquareSizes } from '@audius/common/models'
import { formatCount, route } from '@audius/common/utils'
import { Box, Skeleton, Text } from '@audius/harmony'
import { pick } from 'lodash'
import { useLinkClickHandler } from 'react-router-dom-v5-compat'

import { Avatar } from 'components/avatar'
import { Card, CardProps, CardFooter, CardContent } from 'components/card'
import { UserLink } from 'components/link'
const { profilePage } = route

const messages = {
  followers: (count: number) => (count === 1 ? 'Follower' : 'Followers')
}

const avatarSizeMap = {
  xs: SquareSizes.SIZE_150_BY_150,
  s: SquareSizes.SIZE_150_BY_150,
  m: SquareSizes.SIZE_480_BY_480,
  l: SquareSizes.SIZE_480_BY_480
}

export type UserCardProps = Omit<CardProps, 'id'> & {
  id: ID
  loading?: boolean
  onUserLinkClick?: (e: MouseEvent<HTMLAnchorElement>) => void
}

export const UserCard = (props: UserCardProps) => {
  const { id, loading, size, onClick, onUserLinkClick, ...other } = props

  const { data: user } = useUser(id, {
    select: (user) => pick(user, 'handle', 'follower_count')
  })
  const { handle, follower_count } = user ?? {}

  const handleNavigate = useLinkClickHandler<HTMLDivElement>(
    profilePage(user?.handle ?? '')
  )

  const handleClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      onClick?.(e)
      handleNavigate(e)
    },
    [onClick, handleNavigate]
  )

  if (!handle || follower_count === undefined || loading) {
    return (
      <Card size={size} {...other}>
        <Box p='l' pb='s'>
          <Skeleton
            border='default'
            borderRadius='circle'
            css={{ aspectRatio: 1 }}
          />
        </Box>
        <CardContent p='s' pt={0} gap='xs'>
          <Skeleton h={22} w='80%' alignSelf='center' />
          <Skeleton h={16} w='50%' mv='xs' alignSelf='center' />
        </CardContent>
        <CardFooter>
          <Skeleton h={20} w='60%' alignSelf='center' />
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card size={size} onClick={handleClick} {...other}>
      <Avatar
        userId={id}
        aria-hidden
        p='l'
        pb='s'
        imageSize={avatarSizeMap[size]}
      />
      <CardContent p='s' pt={0} gap='xs' alignItems='center'>
        <UserLink
          ellipses
          userId={id}
          textVariant='title'
          size='l'
          center
          onClick={onUserLinkClick}
        />
        <Text variant='body' ellipses css={{ textAlign: 'center' }}>
          @{handle}
        </Text>
      </CardContent>
      <CardFooter>
        <Text variant='body' size='s' strength='strong'>
          {formatCount(follower_count)} {messages.followers(follower_count)}
        </Text>
      </CardFooter>
    </Card>
  )
}
