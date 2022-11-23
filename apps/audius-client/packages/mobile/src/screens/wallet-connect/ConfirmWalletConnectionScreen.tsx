import { useLayoutEffect } from 'react'

import { useRoute } from '@react-navigation/native'
import bs58 from 'bs58'
import { View } from 'react-native'
import nacl from 'tweetnacl'

import { Button, Text } from 'app/components/core'
import { useAsyncStorage } from 'app/hooks/useAsyncStorage'
import { useNavigation } from 'app/hooks/useNavigation'
import { makeStyles } from 'app/styles'
import { spacing } from 'app/styles/spacing'

import type { WalletConnectRoute } from './types'
import { decryptPayload, useDappKeyPair } from './utils'

const messages = {
  title: 'Your phantom public key:',
  confirm: 'Confirm'
}

const useStyles = makeStyles(() => ({
  root: {
    padding: spacing(4),
    alignItems: 'center'
  }
}))

export const ConfirmWalletConnectionScreen = () => {
  const styles = useStyles()
  const { params } = useRoute<WalletConnectRoute<'ConfirmWalletConnection'>>()
  const { phantom_encryption_public_key, data, nonce } = params
  const [dappKeyPair] = useDappKeyPair()
  const [, setSharedSecret] = useAsyncStorage('@phantom/sharedSecret')
  const [, setSession] = useAsyncStorage('@phantom/session')
  const [phantomWalletPublicKey, setPhantomWalletPublicKey] = useAsyncStorage(
    '@phantom/walletPublicKey'
  )
  const navigation = useNavigation()

  useLayoutEffect(() => {
    if (!phantom_encryption_public_key) {
      navigation.goBack()
    }
    if (dappKeyPair) {
      const sharedSecretDapp = nacl.box.before(
        bs58.decode(phantom_encryption_public_key),
        dappKeyPair.secretKey
      )
      const connectData = decryptPayload(data, nonce, sharedSecretDapp)
      const { session, public_key } = connectData
      setSharedSecret(sharedSecretDapp)
      setSession(session)
      setPhantomWalletPublicKey(public_key)
    }
  }, [
    dappKeyPair,
    phantom_encryption_public_key,
    data,
    nonce,
    setPhantomWalletPublicKey,
    setSharedSecret,
    setSession,
    navigation
  ])

  return (
    <View style={styles.root}>
      <Text variant='h1'>{messages.title}</Text>
      <Text>{phantomWalletPublicKey}</Text>
      <Button
        variant='primary'
        size='large'
        title={messages.confirm}
        onPress={navigation.goBack}
      />
    </View>
  )
}
