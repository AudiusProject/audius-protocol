import { ReactNode } from 'react'

import { Flex, Text, useTheme, IconCaretRight, Artwork } from '@audius/harmony'

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
  const { color, motion, spacing } = useTheme()

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
      borderBottom='default'
      onClick={onClick}
      css={{
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { backgroundColor: color.background.surface2 } : {}
      }}
    >
      <Flex alignItems='center' gap='m'>
        {renderIcon()}
        <Flex
          direction='column'
          gap='xs'
          css={{
            opacity: loading ? 0 : 1,
            transition: `opacity ${motion.expressive}`
          }}
        >
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
        </Flex>
      </Flex>
      {onClick ? <IconCaretRight size='l' color='subdued' /> : null}
    </Flex>
  )
}
