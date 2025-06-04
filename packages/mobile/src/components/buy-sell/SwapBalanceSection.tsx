import React from 'react'

import type { TokenInfo } from '@audius/common/store'

import {
  Flex,
  Text,
  Paper,
  IconTokenAUDIO,
  IconLogoCircleUSDC
} from '@audius/harmony-native'

type SwapBalanceSectionProps = {
  title: string
  tokenInfo: TokenInfo
  amount: string
  priceLabel?: string
}

// Mobile adaptation of web SwapBalanceSection
export const SwapBalanceSection = ({
  title,
  tokenInfo,
  amount,
  priceLabel
}: SwapBalanceSectionProps) => {
  const { symbol } = tokenInfo

  // Get the appropriate token icon for mobile
  const TokenIcon = symbol === 'AUDIO' ? IconTokenAUDIO : IconLogoCircleUSDC

  return (
    <Paper p='l'>
      <Flex direction='column' gap='m'>
        {/* Header */}
        <Text variant='heading' size='s' color='subdued'>
          {title}
        </Text>

        {/* Amount and token info */}
        <Flex direction='row' alignItems='center' gap='s'>
          <TokenIcon size='xl' />
          <Flex direction='column'>
            <Text variant='heading' size='l'>
              {amount}
            </Text>
            <Flex direction='row' gap='xs'>
              <Text variant='heading' size='s' color='subdued'>
                {tokenInfo.isStablecoin
                  ? tokenInfo.symbol
                  : `$${tokenInfo.symbol}`}
              </Text>
              {priceLabel && (
                <Text variant='heading' size='s' color='subdued'>
                  {priceLabel}
                </Text>
              )}
            </Flex>
          </Flex>
        </Flex>
      </Flex>
    </Paper>
  )
}
