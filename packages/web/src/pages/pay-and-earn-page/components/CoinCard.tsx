import { ReactNode } from 'react'

import { formatCount, formatCurrencyWithSubscript } from '@audius/common/utils'
import { Flex, Text, useTheme, IconCaretRight, Artwork } from '@audius/harmony'
import { roundedHexClipPath } from '@audius/harmony/src/icons/SVGDefs'

import Skeleton from 'components/skeleton/Skeleton'

const CoinCardSkeleton = () => {
  return (
    <Flex direction='column' gap='xs'>
      <Skeleton width='240px' height='36px' />
      <Skeleton width='140px' height='24px' />
    </Flex>
  )
}

const HexagonSkeleton = () => {
  return (
    <Skeleton
      width='64px'
      height='64px'
      css={{
        clipPath: `url(#${roundedHexClipPath})`
      }}
    />
  )
}

export type CoinCardProps = {
  icon: string | ReactNode
  name: string
  symbol: string
  balance: string
  heldValue?: string | null
  dollarValue: string
  loading?: boolean
  onClick?: () => void
}

export const CoinCard = ({
  icon,
  name,
  symbol,
  balance,
  heldValue,
  dollarValue,
  loading = false,
  onClick
}: CoinCardProps) => {
  const { color, spacing } = useTheme()

  const renderIcon = () => {
    if (typeof icon === 'string') {
      return (
        <Artwork
          src={icon}
          hex
          w={spacing.unit16}
          h={spacing.unit16}
          borderWidth={0}
        />
      )
    }
    return icon
  }

  return (
    <Flex
      alignItems='center'
      justifyContent='space-between'
      p='l'
      flex={1}
      onClick={onClick}
      css={{
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { backgroundColor: color.background.surface2 } : {}
      }}
    >
      <Flex alignItems='center' gap='l'>
        {loading ? <HexagonSkeleton /> : renderIcon()}
        <Flex direction='column' gap='2xs' flex={1}>
          {loading ? (
            <CoinCardSkeleton />
          ) : (
            <>
              <Text variant='heading' size='s'>
                {name}
              </Text>
              <Flex gap='xs' alignItems='center'>
                <Text variant='title' size='l'>
                  {balance}
                </Text>
                <Text variant='title' size='l' color='subdued'>
                  {symbol}
                </Text>
              </Flex>
            </>
          )}
        </Flex>
      </Flex>
      <Flex alignItems='center' gap='m'>
        {!loading && (
          <Text variant='title' size='l' color='default'>
            {heldValue ?? dollarValue}
          </Text>
        )}
        {onClick ? <IconCaretRight size='l' color='subdued' /> : null}
      </Flex>
    </Flex>
  )
}
