import { useArtistCoin } from '@audius/common/api'
import { Artwork, Flex, IconCaretRight, Paper, Text } from '@audius/harmony'
import { decodeHashId } from '@audius/sdk'
import { useTheme } from '@emotion/react'

import Skeleton from 'components/skeleton/Skeleton'
import { UserTokenBadge } from 'components/user-token-badge/UserTokenBadge'

const ArtistCoinRowSkeleton = () => {
  return (
    <Flex direction='column' gap='xs'>
      <Skeleton width='120px' height='32px' />
      <Skeleton width='80px' height='24px' />
    </Flex>
  )
}

export type ArtistCoinRowProps = {
  icon: string
  symbol: string
  dollarValue: string
  loading?: boolean
  onClick?: () => void
  mint: string
}

export const ArtistCoinRow = ({
  icon,
  symbol,
  dollarValue,
  loading = false,
  onClick,
  mint
}: ArtistCoinRowProps) => {
  const { color, cornerRadius } = useTheme()
  const { data: coin } = useArtistCoin({ mint })

  const userId = coin?.ownerId
    ? (decodeHashId(coin.ownerId) ?? undefined)
    : undefined

  const renderIcon = () => {
    if (typeof icon === 'string') {
      return <Artwork src={icon} hex w='unit10' h='unit10' borderWidth={0} />
    }
    return icon
  }

  return (
    <Paper
      direction='row'
      alignItems='center'
      justifyContent='space-between'
      p='xl'
      flex={1}
      borderTop='default'
      borderRadius='m'
      shadow='flat'
      backgroundColor='white'
      onClick={onClick}
      css={{
        borderRadius: 0,
        borderBottom: 'none',

        '&:last-child': {
          borderBottomLeftRadius: cornerRadius.l,
          borderBottomRightRadius: cornerRadius.l,
          borderBottom: `1px solid ${color.border.default}`
        }
      }}
    >
      <Flex alignItems='center' gap='l'>
        {renderIcon()}
        <Flex alignItems='center' gap='m'>
          {loading ? (
            <ArtistCoinRowSkeleton />
          ) : (
            <>
              <Text variant='heading' size='m' color='default'>
                {symbol}
              </Text>
              <Text variant='heading' size='m' color='subdued'>
                ({dollarValue})
              </Text>
            </>
          )}
        </Flex>
      </Flex>
      <Flex alignItems='center' gap='m'>
        {userId ? <UserTokenBadge userId={userId} /> : null}
        {onClick ? <IconCaretRight size='l' color='subdued' /> : null}
      </Flex>
    </Paper>
  )
}
