import React, { useCallback } from 'react'

import {
  useCurrentUserId,
  useQueryContext,
  useUserCoins
} from '@audius/common/api'
import { useFeatureFlag } from '@audius/common/hooks'
import { buySellMessages } from '@audius/common/messages'
import { FeatureFlags } from '@audius/common/services'
import type { CoinPairItem } from '@audius/common/store'
import { AUDIO_TICKER, useGroupCoinPairs } from '@audius/common/store'

import { Box, Button, Divider, Flex, Paper, Text } from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'

import { CoinCard } from './CoinCard'

const messages = {
  ...buySellMessages
}

const TokensHeader = () => {
  return (
    <Flex
      row
      alignItems='center'
      justifyContent='space-between'
      p='l'
      pb='s'
      borderBottom='default'
    >
      <Text variant='heading' color='heading'>
        {messages.yourCoins}
      </Text>
    </Flex>
  )
}

export const YourCoins = () => {
  const { data: currentUserId } = useCurrentUserId()
  const navigation = useNavigation()
  const { env } = useQueryContext()
  const { isEnabled: isWalletUIBuySellEnabled } = useFeatureFlag(
    FeatureFlags.WALLET_UI_BUY_SELL
  )

  const { data: artistCoins } = useUserCoins({
    userId: currentUserId
  })

  const coinPairs = useGroupCoinPairs(artistCoins, true)
  const cards = coinPairs.flat()

  const handleBuySell = useCallback(() => {
    navigation.navigate('BuySell', {
      initialTab: 'buy',
      coinTicker: AUDIO_TICKER
    })
  }, [navigation])

  return (
    <Paper>
      <TokensHeader />
      <Flex column>
        {cards.map((item: CoinPairItem) => (
          <Box key={typeof item === 'string' ? item : item.mint}>
            {item === 'audio-coin' ? (
              <CoinCard mint={env.WAUDIO_MINT_ADDRESS} />
            ) : (
              <CoinCard mint={item.mint} />
            )}
            <Divider />
          </Box>
        ))}
      </Flex>
      {isWalletUIBuySellEnabled ? (
        <Flex p='l'>
          <Button variant='secondary' size='small' onPress={handleBuySell}>
            {messages.buySell}
          </Button>
        </Flex>
      ) : null}
    </Paper>
  )
}
