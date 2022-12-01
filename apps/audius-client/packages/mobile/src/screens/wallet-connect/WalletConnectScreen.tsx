import { useCallback } from 'react'

import { useWalletConnect } from '@walletconnect/react-native-dapp'
import { View } from 'react-native'

import IconLink from 'app/assets/images/iconLink.svg'
import IconRemove from 'app/assets/images/iconRemove.svg'
import { Button, Text, Screen } from 'app/components/core'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'

import { TopBarIconButton } from '../app-screen'

import { LinkedWallets } from './components'
import type { WalletConnectParamList } from './types'

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
    paddingHorizontal: spacing(4),
    height: '100%',
    backgroundColor: 'white'
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

  const handleConnectWallet = useCallback(() => {
    connector.connect()
  }, [connector])

  return (
    <Screen
      title={messages.title}
      icon={IconLink}
      variant='secondary'
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
