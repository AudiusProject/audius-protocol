import { useArtistCoin } from '@audius/common/api'
import { Avatar, Flex, Paper, Text, useTheme } from '@audius/harmony'
import { decodeHashId } from '@audius/sdk'

import UserBadges from 'components/user-badges/UserBadges'

export type UserTokenBadgeProps = {
  mint: string
  size?: 's' | 'm' | 'l'
}

export const UserTokenBadge = ({ mint, size = 'm' }: UserTokenBadgeProps) => {
  const { spacing } = useTheme()
  const { data: coin, isLoading } = useArtistCoin({ mint })

  if (isLoading || !coin) {
    return null
  }

  const userId = coin?.ownerId
    ? (decodeHashId(coin.ownerId) ?? undefined)
    : undefined

  const logoURI = coin.logoUri
  const name = coin.ticker

  const iconSize =
    size === 's' ? spacing.unit6 : size === 'm' ? spacing.unit8 : spacing.unit10

  return (
    <Paper
      direction='row'
      alignItems='center'
      justifyContent='center'
      p='xs'
      borderRadius='3xl'
      border='default'
      shadow='mid'
      backgroundColor='white'
    >
      <Flex alignItems='center' gap='xs'>
        {logoURI && <Avatar src={logoURI} w={iconSize} h={iconSize} />}
        <Flex alignItems='center' gap='xs'>
          <Text variant='body' size='l'>
            {name}
          </Text>
          {userId && <UserBadges userId={userId} size='s' inline />}
        </Flex>
      </Flex>
    </Paper>
  )
}
