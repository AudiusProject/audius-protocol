import { useCallback, MouseEvent } from 'react'

import { useUser } from '@audius/common/api'
import { ID, SquareSizes } from '@audius/common/models'
import { formatCount, route } from '@audius/common/utils'
import { Box, Skeleton, Text, TextLink } from '@audius/harmony'
import { pick } from 'lodash'
import { useLinkClickHandler } from 'react-router-dom-v5-compat'

import { ArtistPopover } from 'components/artist/ArtistPopover'
import { Avatar } from 'components/avatar'
import { Card, CardProps, CardFooter, CardContent } from 'components/card'
import { UserLink } from 'components/link'
const { profilePage } = route

const messages = {
  followers: (count: number) => (count === 1 ? 'Follower' : 'Followers')
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
        imageSize={SquareSizes.SIZE_480_BY_480}
      />
      <CardContent p='s' pt={0} gap='xs' alignItems='center'>
        <UserLink
          ellipses
          userId={id}
          textVariant='title'
          size='l'
          center
          onClick={onUserLinkClick}
          popover={true}
          css={{ width: '100%' }}
        />
        <ArtistPopover handle={handle} css={{ width: '100%' }}>
          <TextLink
            onClick={onUserLinkClick}
            ellipses
            css={{ textAlign: 'center', display: 'block' }}
          >
            @{handle}
          </TextLink>
        </ArtistPopover>
      </CardContent>
      <CardFooter>
        <Text variant='body' size='s' strength='strong'>
          {formatCount(follower_count)} {messages.followers(follower_count)}
        </Text>
      </CardFooter>
    </Card>
  )
}
