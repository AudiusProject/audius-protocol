import {
  Flex,
  Text,
  useTheme,
  IconCaretRight,
  Artwork,
  Paper
} from '@audius/harmony'

import Skeleton from 'components/skeleton/Skeleton'
import { UserTokenBadge } from 'components/user-token-badge/UserTokenBadge'

const TokenBalanceCardSkeleton = () => {
  return (
    <Flex direction='column' gap='xs'>
      <Skeleton width='120px' height='32px' />
      <Skeleton width='80px' height='24px' />
    </Flex>
  )
}

export type TokenBalanceCardProps = {
  icon: string
  symbol: string
  dollarValue: string
  loading?: boolean
  onClick?: () => void
  mint: string
}

export const TokenBalanceCard = ({
  icon,
  symbol,
  dollarValue,
  loading = false,
  onClick,
  mint
}: TokenBalanceCardProps) => {
  const { spacing } = useTheme()

  const renderIcon = () => {
    if (typeof icon === 'string') {
      return (
        <Artwork
          src={icon}
          hex
          w={spacing.unit10}
          h={spacing.unit10}
          borderWidth={0}
        />
      )
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
      border='default'
      borderRadius='xs'
      shadow='flat'
      backgroundColor='white'
      onClick={onClick}
    >
      <Flex alignItems='center' gap='l'>
        {renderIcon()}
        <Flex alignItems='center' gap='m'>
          {loading ? (
            <TokenBalanceCardSkeleton />
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
        <UserTokenBadge mint={mint} size='s' />
        {onClick ? <IconCaretRight size='l' color='subdued' /> : null}
      </Flex>
    </Paper>
  )
}
