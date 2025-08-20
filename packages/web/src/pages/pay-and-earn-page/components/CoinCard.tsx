import { ReactNode } from 'react'

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
  symbol: string
  balance: string
  dollarValue: string
  loading?: boolean
  onClick?: () => void
}

export const CoinCard = ({
  icon,
  symbol,
  balance,
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
      p='xl'
      flex={1}
      onClick={onClick}
      css={{
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { backgroundColor: color.background.surface2 } : {}
      }}
    >
      <Flex alignItems='center' gap='m'>
        {loading ? <HexagonSkeleton /> : renderIcon()}
        <Flex direction='column' gap='xs'>
          {loading ? (
            <CoinCardSkeleton />
          ) : (
            <>
              <Flex gap='xs'>
                <Text variant='heading' size='l' color='default'>
                  {balance}
                </Text>
                <Text variant='heading' size='l' color='subdued'>
                  {symbol}
                </Text>
              </Flex>
              <Text variant='heading' size='s' color='subdued'>
                {dollarValue}
              </Text>
            </>
          )}
        </Flex>
      </Flex>
      {onClick ? <IconCaretRight size='l' color='subdued' /> : null}
    </Flex>
  )
}
