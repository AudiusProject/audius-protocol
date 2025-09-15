import React from 'react'

import type { TokenInfo } from '@audius/common/store'
import { Flex, Text } from '@audius/harmony'

import { TokenIcon } from '../TokenIcon'

type StaticTokenDisplayProps = {
  tokenInfo: TokenInfo
}

/**
 * A non-interactive token display component that shows the token icon and symbol
 * without any dropdown functionality. Used when artist-coins feature flag is disabled.
 */
export const StaticTokenDisplay = ({ tokenInfo }: StaticTokenDisplayProps) => {
  const { symbol } = tokenInfo

  return (
    <Flex
      alignItems='center'
      justifyContent='center'
      gap='s'
      alignSelf='stretch'
      border='default'
      pv='s'
      ph='m'
      borderRadius='s'
      h='unit16'
    >
      <TokenIcon
        logoURI={tokenInfo.logoURI}
        icon={tokenInfo.icon}
        size='2xl'
        hex
      />
      <Text variant='body' size='m' strength='strong' color='default'>
        {symbol}
      </Text>
    </Flex>
  )
}
