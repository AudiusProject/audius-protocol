import {
  accountSelectors,
  Chain,
  tokenDashboardPageActions
} from '@audius/common'
import BN from 'bn.js'
import bs58 from 'bs58'
import { Linking } from 'react-native'
import nacl from 'tweetnacl'
import { takeEvery, select, put } from 'typed-redux-saga'

import { getDappKeyPair } from '../selectors'
import {
  connectNewWallet,
  setPublicKey,
  setSession,
  setSharedSecret
} from '../slice'
import type { ConnectNewWalletAction } from '../types'
import { buildUrl, decryptPayload, encryptPayload } from '../utils'
const { setIsConnectingWallet } = tokenDashboardPageActions
const { getUserId } = accountSelectors

function* connectNewWalletAsync(action: ConnectNewWalletAction) {
  const { phantom_encryption_public_key, data, nonce } = action.payload
  const dappKeyPair = yield* select(getDappKeyPair)
  const accountUserId = yield* select(getUserId)

  if (!dappKeyPair || !accountUserId) return

  const sharedSecretDapp = nacl.box.before(
    bs58.decode(phantom_encryption_public_key),
    dappKeyPair.secretKey
  )
  const connectData = decryptPayload(data, nonce, sharedSecretDapp)
  const { session, public_key } = connectData

  yield* put(setSharedSecret({ sharedSecret: bs58.encode(sharedSecretDapp) }))
  yield* put(setSession({ session }))
  yield* put(setPublicKey({ publicKey: public_key }))
  yield* put(
    setIsConnectingWallet({
      wallet: public_key,
      chain: Chain.Sol,
      balance: new BN(0),
      collectibleCount: 0
    })
  )

  const message = `AudiusUserID:${accountUserId}`

  const payload = {
    session,
    message: bs58.encode(Buffer.from(message))
  }

  const [nonce2, encryptedPayload] = encryptPayload(payload, sharedSecretDapp)

  const urlParams = new URLSearchParams({
    dapp_encryption_public_key: bs58.encode(dappKeyPair.publicKey),
    nonce: bs58.encode(nonce2),
    redirect_link: 'audius://wallet-sign-message',
    payload: bs58.encode(encryptedPayload)
  })

  const url = buildUrl('signMessage', urlParams)
  Linking.openURL(url)
}

export function* watchConnectNewWallet() {
  yield* takeEvery(connectNewWallet.type, connectNewWalletAsync)
}
