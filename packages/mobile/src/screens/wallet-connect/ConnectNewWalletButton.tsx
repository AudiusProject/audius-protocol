import { useCallback } from 'react'

import { tokenDashboardPageSelectors } from '@audius/common/store'
import { View } from 'react-native'
import { useSelector } from 'react-redux'

import { Button } from '@audius/harmony-native'
import { makeStyles } from 'app/styles'

import { useCanConnectNewWallet } from './useCanConnectNewWallet'
import { useWalletConnect } from './useWalletConnect'

const { getConfirmingWalletStatus, getRemoveWallet } =
  tokenDashboardPageSelectors

const messages = {
  connect: 'Connect New Wallet',
  connecting: 'Connecting New Wallet...',
  removing: 'Removing Linked Wallet...'
}

const useStyles = makeStyles(({ spacing }) => ({
  root: {
    margin: spacing(6)
  }
}))

export const ConnectNewWalletButton = () => {
  const styles = useStyles()
  const { connector } = useWalletConnect()

  const newWalletStatus = useSelector(getConfirmingWalletStatus)
  const { status: removeWalletStatus } = useSelector(getRemoveWallet)

  const canConnectNewWallet = useCanConnectNewWallet()

  const handleConnectWallet = useCallback(() => {
    connector.connect()
  }, [connector])

  const title = canConnectNewWallet
    ? messages.connect
    : newWalletStatus
    ? messages.connecting
    : removeWalletStatus
    ? messages.removing
    : messages.connect

  return (
    <View style={styles.root}>
      <Button
        variant='primary'
        fullWidth
        onPress={handleConnectWallet}
        disabled={!canConnectNewWallet}
      >
        {title}
      </Button>
    </View>
  )
}
