import React, { useCallback } from 'react'

import { useFeatureFlag, useFormattedAudioBalance } from '@audius/common/hooks'
import { buySellMessages as messages } from '@audius/common/messages'
import { FeatureFlags } from '@audius/common/services'

import {
  Button,
  Flex,
  IconCaretRight,
  IconTokenAUDIO,
  Paper,
  Skeleton,
  Text,
  cornerRadius
} from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'

const TokensHeader = () => {
  const navigation = useNavigation()

  const handleBuySellClick = useCallback(() => {
    navigation.navigate('BuySell', { initialTab: 'buy' })
  }, [navigation])

  return (
    <Flex
      direction='row'
      alignItems='center'
      justifyContent='space-between'
      p='l'
      borderBottom='default'
    >
      <Text variant='heading' size='s' color='heading'>
        {messages.yourCoins}
      </Text>
      <Button variant='secondary' size='small' onPress={handleBuySellClick}>
        {messages.buySell}
      </Button>
    </Flex>
  )
}

export const YourCoins = () => {
  const navigation = useNavigation()
  const { isEnabled: isWalletUIBuySellEnabled } = useFeatureFlag(
    FeatureFlags.WALLET_UI_BUY_SELL
  )

  const {
    audioBalanceFormatted,
    audioDollarValue,
    isAudioBalanceLoading,
    isAudioPriceLoading
  } = useFormattedAudioBalance()

  const handleTokenClick = useCallback(() => {
    navigation.navigate('AudioScreen')
  }, [navigation])

  return (
    <Paper onPress={handleTokenClick}>
      {isWalletUIBuySellEnabled ? <TokensHeader /> : null}
      <Flex
        p='l'
        pv='2xl'
        direction='row'
        justifyContent='space-between'
        alignItems='center'
      >
        <Flex direction='row' alignItems='center' gap='m'>
          <IconTokenAUDIO size='4xl' borderRadius={cornerRadius.circle} />
          <Flex direction='column' gap='xs' h='3xl' justifyContent='center'>
            <Flex direction='row' alignItems='center' h='2xl' gap='xs'>
              {isAudioBalanceLoading ? (
                <Skeleton h='2xl' w='5xl' />
              ) : (
                <>
                  <Text variant='heading' size='l' color='default'>
                    {audioBalanceFormatted}
                  </Text>
                  <Text variant='heading' size='l' color='subdued'>
                    {messages.audioTicker}
                  </Text>
                </>
              )}
            </Flex>
            {isAudioPriceLoading ? (
              <Skeleton h='l' w='3xl' />
            ) : (
              <Text variant='heading' size='s' color='subdued'>
                {audioDollarValue}
              </Text>
            )}
          </Flex>
        </Flex>
        <IconCaretRight size='l' color='subdued' />
      </Flex>
    </Paper>
  )
}
