import { useEffect, useState } from 'react'

import { tokenDashboardPageSelectors } from '@audius/common/store'
import type {
  RenderQrcodeModalProps,
  WalletService
} from '@walletconnect/react-native-dapp'
import {
  useWalletConnect,
  useWalletConnectContext
} from '@walletconnect/react-native-dapp'
import { View, Platform } from 'react-native'
import { useSelector } from 'react-redux'

import { Text } from 'app/components/core'
import { NativeDrawer } from 'app/components/drawer'
import LoadingSpinner from 'app/components/loading-spinner'
import { useDrawer } from 'app/hooks/useDrawer'
import { makeStyles } from 'app/styles'

import { useCanConnectNewWallet } from '../useCanConnectNewWallet'

import { EthWalletConnectOption } from './EthWalletConnectOption'
import { PhantomWalletConnectOption } from './PhantomWalletConnectOption'
import { SolanaPhoneOption } from './SolanaPhoneOption'

const { getError } = tokenDashboardPageSelectors

const SUPPORTED_SERVICES = new Set(['MetaMask', 'Rainbow'])
const MODAL_NAME = 'ConnectWallets'

const isSolanaPhone =
  Platform.OS === 'android' && Platform.constants.Model === 'Saga'

const messages = {
  title: 'Select Wallet',
  connecting: 'Connecting...'
}

const useStyles = makeStyles(({ spacing, palette }) => ({
  root: {
    marginTop: spacing(4),
    marginHorizontal: spacing(4),
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative'
  },
  title: {
    marginTop: spacing(4),
    marginBottom: spacing(2),
    color: palette.neutralLight2
  },
  walletConnectionList: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  connectingOverlay: {
    position: 'absolute',
    opacity: 0.3,
    zIndex: 2,
    backgroundColor: palette.white,
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center'
  }
}))

export const WalletConnectDrawer = () => {
  const styles = useStyles()
  const { walletServices } = useWalletConnectContext()
  const canConnectNewWallet = useCanConnectNewWallet()

  const supportedWalletServices = walletServices?.filter((service) =>
    SUPPORTED_SERVICES.has(service.name)
  )
  const { data } = useDrawer('ConnectWallets')

  const uri = data?.uri

  return (
    <NativeDrawer
      drawerName={MODAL_NAME}
      isGestureSupported={canConnectNewWallet}
    >
      <View style={styles.root}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text
            style={styles.title}
            fontSize='xl'
            weight='heavy'
            textTransform='uppercase'
          >
            {canConnectNewWallet ? messages.title : messages.connecting}
          </Text>
          {!canConnectNewWallet ? (
            <LoadingSpinner
              style={{ height: 25, width: 25, marginLeft: 4, marginTop: 2 }}
            />
          ) : null}
        </View>
        <View style={styles.walletConnectionList}>
          {isSolanaPhone ? (
            <SolanaPhoneOption />
          ) : (
            <PhantomWalletConnectOption />
          )}
          {supportedWalletServices?.map((walletService: WalletService) => {
            return (
              <EthWalletConnectOption
                key={walletService.name}
                walletService={walletService}
                uri={uri}
              />
            )
          })}
        </View>
      </View>
      {!canConnectNewWallet ? (
        <View style={styles.connectingOverlay}></View>
      ) : null}
    </NativeDrawer>
  )
}

export const WalletConnectProviderRenderModal = ({
  visible,
  onDismiss,
  uri
}: RenderQrcodeModalProps) => {
  const { isOpen, onOpen, onClose } = useDrawer('ConnectWallets')
  const [drawerStatus, setDrawerStatus] = useState('closed')
  const errorMessage = useSelector(getError)
  const connector = useWalletConnect()

  useEffect(() => {
    if (drawerStatus === 'closed' && visible && !isOpen) {
      setDrawerStatus('opening')
      onOpen({ uri })
    }
    if (drawerStatus === 'opening' && visible && isOpen) {
      setDrawerStatus('open')
    }
    if (drawerStatus === 'open' && visible && !isOpen) {
      setDrawerStatus('closing')
      onDismiss()
    }

    if (drawerStatus === 'open' && !visible && isOpen) {
      setDrawerStatus('closing')
      onClose()
    }
    if (drawerStatus === 'closing' && !visible && !isOpen) {
      setDrawerStatus('closed')
    }
  }, [visible, isOpen, onOpen, onClose, drawerStatus, onDismiss, uri])

  useEffect(() => {
    if (errorMessage) {
      setDrawerStatus('closing')
      onDismiss()
      onClose()
    }
  }, [errorMessage, onClose, onDismiss])

  useEffect(() => {
    if (!isOpen && !visible && connector.session?.connected) {
      connector.killSession()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, connector.session?.connected])

  // Must be an element to comply with interface
  return <></>
}
