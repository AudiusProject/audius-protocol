import React, { useCallback } from 'react'

import { useCurrentUserId, useUserCoins } from '@audius/common/api'
import { useFeatureFlag } from '@audius/common/hooks'
import { buySellMessages } from '@audius/common/messages'
import { FeatureFlags } from '@audius/common/services'
import type { CoinPairItem } from '@audius/common/store'
import { AUDIO_TICKER } from '@audius/common/store'
import { TouchableOpacity } from 'react-native'

import {
  Box,
  Button,
  Divider,
  Flex,
  IconCaretRight,
  Paper,
  Text
} from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'

import { CoinCard } from './CoinCard'

const messages = {
  ...buySellMessages,
  findMoreCoins: 'Find More Coins',
  exploreArtistCoins: 'Explore available artist coins on Audius.'
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

const FindMoreCoins = () => {
  const navigation = useNavigation()

  const handlePress = useCallback(() => {
    navigation.navigate('AllCoinsScreen')
  }, [navigation])

  return (
    <TouchableOpacity onPress={handlePress}>
      <Flex
        row
        p='l'
        pl='xl'
        alignItems='center'
        justifyContent='space-between'
      >
        <Flex column gap='xs'>
          <Text variant='heading' size='s'>
            {messages.findMoreCoins}
          </Text>
          <Text>{messages.exploreArtistCoins}</Text>
        </Flex>
        <IconCaretRight size='l' color='subdued' />
      </Flex>
    </TouchableOpacity>
  )
}

export const YourCoins = () => {
  const { data: currentUserId } = useCurrentUserId()
  const { isEnabled: isArtistCoinsEnabled } = useFeatureFlag(
    FeatureFlags.ARTIST_COINS
  )
  const navigation = useNavigation()
  const { isEnabled: isWalletUIBuySellEnabled } = useFeatureFlag(
    FeatureFlags.WALLET_UI_BUY_SELL
  )

  const { data: artistCoins } = useUserCoins({
    userId: currentUserId
  })
  const cards = isArtistCoinsEnabled
    ? [...(artistCoins || []), 'find-more']
    : (artistCoins?.slice(0, 1) ?? [])

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
          <Box key={item === 'find-more' ? 'find-more' : item.mint}>
            {item === 'find-more' ? (
              <FindMoreCoins />
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
