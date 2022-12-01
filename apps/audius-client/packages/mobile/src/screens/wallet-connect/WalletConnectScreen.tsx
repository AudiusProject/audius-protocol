import { useCallback, useEffect } from 'react'

import { useRoute } from '@react-navigation/native'
import { useWalletConnect } from '@walletconnect/react-native-dapp'
import { View } from 'react-native'
import { useDispatch } from 'react-redux'

import IconLink from 'app/assets/images/iconLink.svg'
import IconRemove from 'app/assets/images/iconRemove.svg'
import { Button, Text, Screen } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { connectNewWallet, signMessage } from 'app/store/wallet-connect/slice'
import { makeStyles } from 'app/styles'

import { TopBarIconButton } from '../app-screen'

import { LinkedWallets } from './components'
import type { WalletConnectParamList, WalletConnectRoute } from './types'

const messages = {
  title: 'Connect Wallets',
  subtitle: 'Connect Additional Wallets With Your Account',
  text: 'Show off your NFT Collectibles and flaunt your $AUDIO with a VIP badge on your profile.',
  connect: 'Connect New Wallet',
  linkedWallets: 'Linked Wallets',
  audio: '$AUDIO'
}

const useStyles = makeStyles(({ spacing, typography, palette }) => ({
  root: {
    paddingVertical: spacing(4),
    paddingHorizontal: spacing(4)
  },
  subtitle: {
    textAlign: 'center',
    fontSize: typography.fontSize.xxl,
    color: palette.secondary,
    marginVertical: spacing(6)
  },
  text: {
    marginHorizontal: spacing(4),
    textAlign: 'center',
    lineHeight: 24
  },
  connectButton: {
    marginTop: spacing(6)
  },
  linkedWallets: {
    marginTop: spacing(6)
  }
}))

export const WalletConnectScreen = () => {
  const styles = useStyles()
  const navigation = useNavigation<WalletConnectParamList>()
  const connector = useWalletConnect()
  const dispatch = useDispatch()
  const { params } = useRoute<WalletConnectRoute<'Wallets'>>()

  useEffect(() => {
    if (!params) return
    if (params.path === 'wallet-connect') {
      dispatch(connectNewWallet(params))
    } else if (params.path === 'wallet-sign-message') {
      dispatch(signMessage(params))
    }
  }, [params?.path, params, dispatch])

  const handleConnectWallet = useCallback(() => {
    connector.connect()
  }, [connector])

  return (
    <Screen
      title={messages.title}
      icon={IconLink}
      variant='white'
      topbarLeft={
        <TopBarIconButton icon={IconRemove} onPress={navigation.goBack} />
      }
      url='/wallet-connect'
    >
      <View style={styles.root}>
        <Text weight='bold' style={styles.subtitle}>
          {messages.subtitle}
        </Text>
        <Text weight='medium' fontSize='medium' style={styles.text}>
          {messages.text}
        </Text>
        <Button
          style={styles.connectButton}
          title={messages.connect}
          variant='primary'
          size='large'
          onPress={handleConnectWallet}
        />
        <View style={styles.linkedWallets}>
          <LinkedWallets />
        </View>
      </View>
    </Screen>
  )
}
