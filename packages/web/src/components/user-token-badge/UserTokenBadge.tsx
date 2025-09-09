import { useUser } from '@audius/common/api'
import { Flex, Text, useTheme } from '@audius/harmony'

import { Avatar } from 'components/avatar/Avatar'
import { UserLink } from 'components/link'
import UserBadges from 'components/user-badges/UserBadges'

export type UserTokenBadgeProps = {
  userId: number
}

export const UserTokenBadge = ({ userId }: UserTokenBadgeProps) => {
  const { spacing, color, shadows } = useTheme()
  const { data: owner } = useUser(userId)

  if (!owner) {
    return null
  }

  const name = owner.name

  return (
    <UserLink userId={userId} noText>
      <Flex
        alignItems='center'
        justifyContent='center'
        gap='xs'
        pl='xs'
        pr='s'
        pv='xs'
        shadow='mid'
        backgroundColor='white'
        borderRadius='circle'
        border='default'
        css={{
          transition: 'all 0.1s ease',
          '&:hover': {
            boxShadow: shadows.far
          },
          '&:active': {
            boxShadow: shadows.near,
            backgroundColor: color.background.surface2,
            borderColor: color.border.strong
          }
        }}
      >
        <Avatar userId={userId} w={spacing.xl} h={spacing.xl} />
        <Flex alignItems='center' gap='xs'>
          <Text variant='body' size='l'>
            {name}
          </Text>
          <UserBadges userId={userId} size='s' inline />
        </Flex>
      </Flex>
    </UserLink>
  )
}
