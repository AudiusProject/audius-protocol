import React from 'react'

import { buySellMessages as messages } from '@audius/common/messages'

import { Flex } from '@audius/harmony-native'
import { Screen as MobileScreen, ScreenContent } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'

import type { BuySellScreenParams } from '../../types/navigation'

import { BuySellFlow } from './BuySellFlow'
import { PoweredByJupiter } from './components/PoweredByJupiter'

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
        <PoweredByJupiter />
        <Flex mt='xl'>
          <BuySellFlow onClose={handleClose} initialTab={params?.initialTab} />
        </Flex>
      </ScreenContent>
    </MobileScreen>
  )
}
