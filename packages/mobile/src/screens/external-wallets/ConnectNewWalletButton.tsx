import { tokenDashboardPageSelectors } from '@audius/common/store'
import { View } from 'react-native'
import { useSelector } from 'react-redux'

import { Button } from '@audius/harmony-native'
import { useDrawer } from 'app/hooks/useDrawer'
import { makeStyles } from 'app/styles'

import { useCanConnectNewWallet } from './useCanConnectNewWallet'

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

  const newWalletStatus = useSelector(getConfirmingWalletStatus)
  const { status: removeWalletStatus } = useSelector(getRemoveWallet)
  const { onOpen } = useDrawer('ConnectNewWallet')

  const canConnectNewWallet = useCanConnectNewWallet()

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
        onPress={onOpen}
        disabled={!canConnectNewWallet}
      >
        {title}
      </Button>
    </View>
  )
}
