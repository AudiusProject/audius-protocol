import React from 'react'

import { Flex, IconWallet } from '@audius/harmony-native'
import { Screen, ScreenContent, ScrollView } from 'app/components/core'

import { CashWallet } from './components/CashWallet'
import { YourCoins } from './components/YourCoins'
import { BonkLeaderboardButton } from './components/BonkLeaderboardButton'
import { useFeatureFlag } from '@audius/common/hooks'
import { FeatureFlags } from '@audius/common/services'

const messages = {
  title: 'WALLET'
}

export const WalletScreen = () => {
  const {isEnabled: isArtistCoinsEnabled} = useFeatureFlag(FeatureFlags.ARTIST_COINS)
  return (
    <Screen
      url='/wallet'
      variant='secondary'
      title={messages.title}
      icon={IconWallet}
    >
      <ScreenContent>
        <ScrollView>
          <Flex direction='column' gap='xl' p='s' mt='2xl'>
            <CashWallet />
            <YourCoins />
            {isArtistCoinsEnabled && <BonkLeaderboardButton />}
          </Flex>
        </ScrollView>
      </ScreenContent>
    </Screen>
  )
}
