import React from 'react'

import { Flex, IconWallet } from '@audius/harmony-native'
import { Screen, ScreenContent, ScrollView } from 'app/components/core'

import { CashWallet } from './components/CashWallet'
import { YourCoins } from './components/YourCoins'

const messages = {
  title: 'WALLET'
}

export const WalletScreen = () => {
  return (
    <Screen
      url='/wallet'
      variant='secondary'
      title={messages.title}
      icon={IconWallet}
    >
      <ScreenContent>
        <ScrollView>
          <Flex direction='column' gap='xl' ph='s' pv='2xl'>
            <CashWallet />
            <YourCoins />
          </Flex>
        </ScrollView>
      </ScreenContent>
    </Screen>
  )
}
