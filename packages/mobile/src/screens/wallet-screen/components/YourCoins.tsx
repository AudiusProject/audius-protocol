import React, { useCallback } from 'react'

import { useFormattedAudioBalance } from '@audius/common/hooks'

import {
  Flex,
  IconCaretRight,
  IconTokenAUDIO,
  Paper,
  Skeleton,
  Text,
  cornerRadius
} from '@audius/harmony-native'
import { useNavigation } from 'app/hooks/useNavigation'

export const YourCoins = () => {
  const navigation = useNavigation()

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
      <Flex
        p='l'
        direction='row'
        justifyContent='space-between'
        alignItems='center'
      >
        <Flex direction='row' alignItems='center' gap='m'>
          <IconTokenAUDIO size='4xl' borderRadius={cornerRadius.circle} />
          <Flex direction='column' gap='xs'>
            <Flex direction='row' alignItems='center' gap='xs'>
              {isAudioBalanceLoading ? (
                <Skeleton h='4xl' w='5xl' />
              ) : (
                <>
                  <Text variant='heading' size='l' color='default'>
                    {audioBalanceFormatted}
                  </Text>
                  <Text variant='heading' size='l' color='subdued'>
                    $AUDIO
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
        <IconCaretRight size='s' color='subdued' />
      </Flex>
    </Paper>
  )
}
