import React, { useCallback } from 'react'

import {
  useCurrentUserId,
  useUserCoins,
  useQueryContext
} from '@audius/common/api'
import { useFeatureFlag } from '@audius/common/hooks'
import { buySellMessages } from '@audius/common/messages'
import { FeatureFlags } from '@audius/common/services'
import type { CoinPairItem } from '@audius/common/store'
import { useGroupCoinPairs } from '@audius/common/store'
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
  const { env } = useQueryContext()
  const { isEnabled: isWalletUIBuySellEnabled } = useFeatureFlag(
    FeatureFlags.WALLET_UI_BUY_SELL
  )

  const { data: artistCoins } = useUserCoins({
    userId: currentUserId
  })

  const coinPairs = useGroupCoinPairs(artistCoins, true)
  const cards = coinPairs.flat()

  return (
    <Paper>
      <TokensHeader />
      <Flex column>
        {cards.map((item: CoinPairItem) => (
          <Box key={typeof item === 'string' ? item : item.mint}>
            {item === 'find-more' ? (
              <FindMoreCoins />
            ) : item === 'audio-coin' ? (
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
          <Button variant='secondary' size='small' onPress={() => {}}>
            {messages.buySell}
          </Button>
        </Flex>
      ) : null}
    </Paper>
  )
}
