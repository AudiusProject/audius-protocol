import React from 'react'

import type { TokenInfo } from '@audius/common/store'

import { Flex, IconTokenUSDC, Text } from '@audius/harmony-native'

import { TooltipInfoIcon } from './TooltipInfoIcon'

const messages = {
  amount: (amount: string) => `$${amount}`
}

type USDCBalanceSectionProps = {
  title: string
  tokenInfo: TokenInfo
  amount: string
}

export const USDCBalanceSection = ({
  title,
  tokenInfo,
  amount
}: USDCBalanceSectionProps) => {
  return (
    <Flex direction='column' gap='m'>
      {/* Header */}
      <Flex direction='row' alignItems='center' gap='s'>
        <IconTokenUSDC size='l' />
        <Text variant='heading' size='s' color='subdued'>
          {title}
        </Text>
        <TooltipInfoIcon />
      </Flex>

      {/* Amount */}
      <Text variant='heading' size='xl'>
        {messages.amount(amount)}
      </Text>
    </Flex>
  )
}
