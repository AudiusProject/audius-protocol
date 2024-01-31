import { tokenDashboardPageSelectors } from '@audius/common/store'
import { useCallback } from 'react'

import { View } from 'react-native'
import { useSelector } from 'react-redux'

import { Button } from 'app/components/core'
import { makeStyles } from 'app/styles'

import { useCanConnectNewWallet } from './useCanConnectNewWallet'
import { usePhantomConnect } from './usePhantomConnect'
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
  usePhantomConnect()

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
        title={title}
        variant='primary'
        size='large'
        fullWidth
        onPress={handleConnectWallet}
        disabled={!canConnectNewWallet}
      />
    </View>
  )
}
