import React from 'react'

import { buySellMessages as messages } from '@audius/common/messages'

import { Flex, IconJupiterLogo, Text } from '@audius/harmony-native'
import { Screen as MobileScreen, ScreenContent } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'

import type { BuySellScreenParams } from '../../types/navigation'

import { BuySellFlow } from './BuySellFlow'

type BuySellScreenProps = {
  route: {
    params?: BuySellScreenParams
  }
}

export const BuySellScreen = ({ route }: BuySellScreenProps) => {
  const navigation = useNavigation()
  const { params } = route

  const handleClose = () => {
    navigation.goBack()
  }

  return (
    <MobileScreen title={messages.title} variant='white' url='/buy-sell'>
      <ScreenContent>
        <Flex
          direction='row'
          alignItems='center'
          justifyContent='center'
          gap='l'
          p='l'
          border='default'
          backgroundColor='surface1'
        >
          <Text variant='label' size='s' color='subdued'>
            {messages.poweredBy}
          </Text>
          <IconJupiterLogo />
        </Flex>
        <Flex mt='xl'>
          <BuySellFlow onClose={handleClose} initialTab={params?.initialTab} />
        </Flex>
      </ScreenContent>
    </MobileScreen>
  )
}
