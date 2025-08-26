import React from 'react'

import type { TokenInfo } from '@audius/common/store'

import {
  Flex,
  IconTokenAUDIO,
  IconTokenUSDC,
  Text
} from '@audius/harmony-native'

const messages = {
  symbol: (symbol: string) => `$${symbol}`
}

type CryptoBalanceSectionProps = {
  title: string
  tokenInfo: TokenInfo
  amount: string
  priceLabel?: string
}

export const CryptoBalanceSection = ({
  title,
  tokenInfo,
  amount,
  priceLabel
}: CryptoBalanceSectionProps) => {
  const { symbol } = tokenInfo

  // Get the appropriate token icon for mobile
  const TokenIcon = symbol === '$AUDIO' ? IconTokenAUDIO : IconTokenUSDC

  return (
    <Flex direction='column' gap='m'>
      {/* Header */}
      <Text variant='heading' size='s' color='subdued'>
        {title}
      </Text>

      {/* Amount and token info */}
      <Flex direction='row' alignItems='center' gap='s'>
        <TokenIcon size='4xl' />
        <Flex direction='column'>
          <Flex direction='row' gap='xs' alignItems='center'>
            <Text variant='heading' size='l'>
              {amount}
            </Text>
            <Text variant='heading' size='m' color='subdued'>
              {messages.symbol(tokenInfo.symbol)}
            </Text>
          </Flex>
          <Flex direction='row' gap='xs'>
            {priceLabel && (
              <Text variant='heading' size='s' color='subdued'>
                {priceLabel}
              </Text>
            )}
          </Flex>
        </Flex>
      </Flex>
    </Flex>
  )
}
