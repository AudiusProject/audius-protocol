import React, { useCallback } from 'react'

import {
  useCurrentUserId,
  useQueryContext,
  useUserCoins
} from '@audius/common/api'
import { useFeatureFlag } from '@audius/common/hooks'
import { buySellMessages } from '@audius/common/messages'
import { FeatureFlags } from '@audius/common/services'
import { AUDIO_TICKER } from '@audius/common/store'
import { ownedCoinsFilter } from '@audius/common/utils'

import {
  Box,
  Button,
  Divider,
  Flex,
  Paper,
  Skeleton,
  Text
} from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'

import { CoinCard } from './CoinCard'

const messages = {
  ...buySellMessages
}

const YourCoinsSkeleton = () => {
  return (
    <Flex column>
      <Flex p='l' pl='xl' row alignItems='center' gap='l'>
        <Box w={64} h={64}>
          <Skeleton />
        </Box>
        <Flex column gap='xs'>
          <Box w={240} h={36}>
            <Skeleton />
          </Box>
          <Box w={140} h={24}>
            <Skeleton />
          </Box>
        </Flex>
      </Flex>
    </Flex>
  )
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
  const { isEnabled: isArtistCoinsEnabled } = useFeatureFlag(
    FeatureFlags.ARTIST_COINS
  )

  const { data: artistCoins, isPending: isLoadingCoins } = useUserCoins({
    userId: currentUserId
  })

  const filteredCoins =
    artistCoins?.filter(
      ownedCoinsFilter(!!isArtistCoinsEnabled, env.WAUDIO_MINT_ADDRESS)
    ) ?? []

  // Show audio coin card when no coins are available
  const showAudioCoin = filteredCoins.length === 0
  const cards = showAudioCoin ? ['audio-coin' as const] : filteredCoins

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
        {isLoadingCoins || !currentUserId ? (
          <YourCoinsSkeleton />
        ) : (
          cards.map((item) => (
            <Box key={typeof item === 'string' ? item : item.mint}>
              {item === 'audio-coin' ? (
                <CoinCard mint={env.WAUDIO_MINT_ADDRESS} />
              ) : (
                <CoinCard mint={item.mint} />
              )}
              <Divider />
            </Box>
          ))
        )}
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
