import { useCallback, MouseEvent } from 'react'

import { ID } from '@audius/common/models'
import { cacheUsersSelectors } from '@audius/common/store'
import { formatCount } from '@audius/common/utils'
import { Flex, Text } from '@audius/harmony'
import { useLinkClickHandler } from 'react-router-dom-v5-compat'

import { Avatar } from 'components/avatar'
import { Card, CardProps, CardFooter } from 'components/card'
import { UserLink } from 'components/link'
import { useSelector } from 'utils/reducer'
import { profilePage } from 'utils/route'

const { getUser } = cacheUsersSelectors

const messages = {
  followers: (count: number) => (count === 1 ? 'Follower' : 'Followers')
}

type UserCardProps = Omit<CardProps, 'id'> & {
  id: ID
}

export const UserCard = (props: UserCardProps) => {
  const { id, size, onClick, ...other } = props

  const user = useSelector((state) => getUser(state, { id }))

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

  if (!user) return null

  const { handle, follower_count } = user

  return (
    <Card size={size} onClick={handleClick} {...other}>
      <Avatar userId={id} aria-hidden p='l' pb='s' />
      <Flex direction='column' p='s' pt={0} gap='xs'>
        <UserLink
          userId={id}
          textVariant='title'
          css={{ justifyContent: 'center', pointerEvents: 'none' }}
        />
        <Text variant='body' ellipses>
          @{handle}
        </Text>
      </Flex>
      <CardFooter>
        <Text variant='body' size='s' strength='strong'>
          {formatCount(follower_count)} {messages.followers(follower_count)}
        </Text>
      </CardFooter>
    </Card>
  )
}
