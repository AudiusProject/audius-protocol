import type { ReactNode } from 'react'
import { useCallback, useEffect } from 'react'

import type {
  RenderQrcodeModalProps,
  WalletService
} from '@walletconnect/react-native-dapp'
import { useWalletConnectContext } from '@walletconnect/react-native-dapp'
import bs58 from 'bs58'
import { Linking, View, Image, TouchableOpacity } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'

import IconPhantom from 'app/assets/images/iconPhantom.svg'
import { Text } from 'app/components/core'
import { NativeDrawer } from 'app/components/drawer'
import { getVisibility } from 'app/store/drawers/selectors'
import { setVisibility } from 'app/store/drawers/slice'
import { makeStyles } from 'app/styles'

import { buildUrl, useDappKeyPair } from '../utils'

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
  container: {
    marginTop: spacing(4),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start'
  },
  title: {
    marginVertical: spacing(4),
    color: palette.neutralLight2
  },
  wallet: {
    marginHorizontal: spacing(2),
    marginVertical: spacing(1),
    alignItems: 'center',
    justifyContent: 'center'
  },
  walletIcon: {
    display: 'flex',
    height: 50,
    width: 50,
    marginBottom: spacing(1)
  },
  walletText: {}
}))

type WalletOptionProps = {
  name: string
  icon: ReactNode
  onPress: () => void
}

const WalletOption = ({ name, icon, onPress }: WalletOptionProps) => {
  const styles = useStyles()
  return (
    <TouchableOpacity style={styles.wallet} onPress={onPress}>
      <View style={styles.walletIcon}>{icon}</View>
      <Text fontSize='medium' style={styles.walletText}>
        {name}
      </Text>
    </TouchableOpacity>
  )
}

export const WalletsDrawer = () => {
  const styles = useStyles()
  const { walletServices, connectToWalletService, redirectUrl } =
    useWalletConnectContext()

  const supportedWalletServices = (walletServices || []).filter((service) =>
    SUPPORTED_SERVICES.has(service.name)
  )

  const [dappKeyPair] = useDappKeyPair()

  const handleConnectWallet = useCallback(() => {
    const params = new URLSearchParams({
      dapp_encryption_public_key: bs58.encode(dappKeyPair.publicKey),
      cluster: 'mainnet-beta',
      app_url: 'https://audius.co',
      redirect_link: 'audius://wallet-connect'
    })
    const url = buildUrl('connect', params)
    Linking.openURL(url)
  }, [dappKeyPair])

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
          {supportedWalletServices.map(
            (walletService: WalletService, i: number) => {
              return (
                <WalletOption
                  key={i}
                  name={walletService.name}
                  icon={
                    <Image
                      source={{
                        // @ts-ignore: image_url is valid
                        uri: `${walletService.image_url.sm}`
                      }}
                      onError={(error) => console.error(error)}
                    />
                  }
                  onPress={() =>
                    connectToWalletService?.(walletService, redirectUrl)
                  }
                />
              )
            }
          )}
          <WalletOption
            name='Phantom'
            icon={<IconPhantom height={50} width={50} />}
            onPress={handleConnectWallet}
          />
          {/* TODO: Add Solana Phone as an option */}
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
