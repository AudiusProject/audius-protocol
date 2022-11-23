import { useCallback } from 'react'

import bs58 from 'bs58'
import { Linking, View } from 'react-native'

import LogoSol from 'app/assets/images/logoSol.svg'
import { Button, Divider, GradientText, Text } from 'app/components/core'
import { useAsyncStorage } from 'app/hooks/useAsyncStorage'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'

import { buildUrl, useDappKeyPair } from './utils'

const messages = {
  title: 'Connect Phantom Wallet',
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

  title: {
    textAlign: 'center',
    fontSize: typography.fontSize.xxxl,
    marginVertical: spacing(6)
  },
  text: {
    textAlign: 'center'
  },
  connectButton: {
    marginTop: spacing(4)
  },
  linkedWallets: {
    marginTop: spacing(6)
  },
  linkedWalletsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  divider: {
    marginVertical: spacing(2)
  },
  linkedWallet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  linkedWalletKey: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: 150
  },
  linkedWalletLogo: {
    marginRight: spacing(2)
  },
  chainIcon: {
    borderWidth: 1,
    borderColor: palette.neutralLight7,
    borderRadius: 14,
    padding: 2,
    marginRight: spacing(2)
  },
  audioAmount: {
    marginRight: spacing(2)
  }
}))

export const WalletConnectScreen = () => {
  const styles = useStyles()
  const [dappKeyPair] = useDappKeyPair()
  const [phantomWalletPublicKey] = useAsyncStorage('@phantom/walletPublicKey')

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
    <View style={styles.root}>
      <GradientText style={styles.title}>{messages.title}</GradientText>
      <Text fontSize='large' style={styles.text}>
        {messages.text}
      </Text>
      <Button
        style={styles.connectButton}
        title={messages.connect}
        variant='primary'
        size='large'
        onPress={handleConnectWallet}
      />
      {phantomWalletPublicKey ? (
        <View style={styles.linkedWallets}>
          <View style={styles.linkedWalletsHeader}>
            <Text>{messages.linkedWallets}</Text>
            <Text>{messages.audio}</Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.linkedWallet}>
            <View style={styles.linkedWalletKey}>
              <View style={styles.chainIcon}>
                <LogoSol height={spacing(5)} width={spacing(5)} />
              </View>
              <Text ellipsizeMode='middle' numberOfLines={1}>
                {phantomWalletPublicKey}
              </Text>
            </View>
            <Text style={styles.audioAmount}>0</Text>
          </View>
        </View>
      ) : null}
    </View>
  )
}
