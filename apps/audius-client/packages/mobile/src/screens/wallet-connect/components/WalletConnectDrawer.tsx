import { useEffect } from 'react'

import type {
  RenderQrcodeModalProps,
  WalletService
} from '@walletconnect/react-native-dapp'
import { useWalletConnectContext } from '@walletconnect/react-native-dapp'
import { View } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import { Text } from 'app/components/core'
import { NativeDrawer } from 'app/components/drawer'
import { getVisibility } from 'app/store/drawers/selectors'
import { setVisibility } from 'app/store/drawers/slice'
import { makeStyles } from 'app/styles'

import { EthWalletConnectOption } from './EthWalletConnectOption'
import { PhantomWalletConnectOption } from './PhantomWalletConnectOption'
import { SolanaPhoneOption } from './SolanaPhoneOption'

const SUPPORTED_SERVICES = new Set(['MetaMask', 'Rainbow'])
const MODAL_NAME = 'ConnectWallets'

const messages = {
  title: 'Select Wallet'
}

const useStyles = makeStyles(({ spacing, palette }) => ({
  root: {
    marginTop: spacing(4),
    marginHorizontal: spacing(4),
    marginBottom: spacing(6),
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start'
  },
  title: {
    marginTop: spacing(4),
    marginBottom: spacing(2),
    color: palette.neutralLight2
  },
  container: {
    marginTop: spacing(4),
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap'
  }
}))

export const WalletConnectDrawer = () => {
  const styles = useStyles()
  const { walletServices } = useWalletConnectContext()

  const supportedWalletServices = (walletServices || []).filter((service) =>
    SUPPORTED_SERVICES.has(service.name)
  )

  return (
    <NativeDrawer drawerName={MODAL_NAME}>
      <View style={styles.root}>
        <Text
          style={styles.title}
          fontSize='xl'
          weight='heavy'
          textTransform='uppercase'
        >
          {messages.title}
        </Text>
        <View style={styles.container}>
          {supportedWalletServices.map((walletService: WalletService) => {
            return (
              <EthWalletConnectOption
                key={walletService.name}
                walletService={walletService}
              />
            )
          })}
          <PhantomWalletConnectOption />
          <SolanaPhoneOption />
        </View>
      </View>
    </NativeDrawer>
  )
}

export const WalletConnectProviderRenderModal = ({
  visible,
  onDismiss
}: RenderQrcodeModalProps) => {
  const dispatch = useDispatch()
  const isDrawerVisible = useSelector(getVisibility('ConnectWallets'))
  // When wallet connect visibility changes, show drawer
  useEffect(() => {
    if (visible) {
      dispatch(setVisibility({ drawer: MODAL_NAME, visible: true }))
    }
  }, [visible, dispatch])

  // When the drawer gets dismissed, dismiss the wallet connect popup
  useEffect(() => {
    if (visible && !isDrawerVisible) {
      onDismiss()
    }
  }, [visible, isDrawerVisible, onDismiss])

  // Must be an element to comply with interface
  return <></>
}
