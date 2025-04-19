import React from 'react'

import { IconWallet } from '@audius/harmony-native'
import { ScrollView, Screen, ScreenContent } from 'app/components/core'
import { makeStyles } from 'app/styles'

import { CashWallet } from './components/CashWallet'
import { YourCoins } from './components/YourCoins'

const messages = {
  title: 'WALLET'
}

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    paddingVertical: spacing(8),
    paddingHorizontal: spacing(3)
  },
  container: {
    gap: spacing(4)
  }
}))

export const WalletScreen = () => {
  const styles = useStyles()
  return (
    <Screen
      url='/wallet'
      variant='secondary'
      title={messages.title}
      style={styles.root}
      icon={IconWallet}
    >
      <ScreenContent>
        <ScrollView contentContainerStyle={styles.container}>
          <CashWallet />
          <YourCoins />
        </ScrollView>
      </ScreenContent>
    </Screen>
  )
}
