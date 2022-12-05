import {
  accountSelectors,
  Chain,
  tokenDashboardPageActions
} from '@audius/common'
import BN from 'bn.js'
import bs58 from 'bs58'
import { Linking } from 'react-native'
import nacl from 'tweetnacl'
import { takeEvery, select, put, call } from 'typed-redux-saga'

import { getConnectionType, getDappKeyPair } from '../selectors'
import {
  connectNewWallet,
  setPublicKey,
  setSession,
  setSharedSecret,
  signMessage
} from '../slice'
import type { ConnectNewWalletAction } from '../types'
import { buildUrl, decryptPayload, encryptPayload } from '../utils'
const { setIsConnectingWallet } = tokenDashboardPageActions
const { getUserId } = accountSelectors

function* connectNewWalletAsync(action: ConnectNewWalletAction) {
  const connectionType = yield* select(getConnectionType)

  const accountUserId = yield* select(getUserId)
  if (!accountUserId) return

  const message = `AudiusUserID:${accountUserId}`

  switch (connectionType) {
    case null:
      console.error('No connection type set')
      break
    case 'phantom': {
      const { phantom_encryption_public_key, data, nonce } = action.payload
      const dappKeyPair = yield* select(getDappKeyPair)

      if (!dappKeyPair) return

      const sharedSecretDapp = nacl.box.before(
        bs58.decode(phantom_encryption_public_key),
        dappKeyPair.secretKey
      )
      const connectData = decryptPayload(data, nonce, sharedSecretDapp)
      const { session, public_key } = connectData

      yield* put(
        setSharedSecret({ sharedSecret: bs58.encode(sharedSecretDapp) })
      )
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

      const payload = {
        session,
        message: bs58.encode(Buffer.from(message))
      }

      const [nonce2, encryptedPayload] = encryptPayload(
        payload,
        sharedSecretDapp
      )

      const urlParams = new URLSearchParams({
        dapp_encryption_public_key: bs58.encode(dappKeyPair.publicKey),
        nonce: bs58.encode(nonce2),
        redirect_link: 'audius://wallet-sign-message',
        payload: bs58.encode(encryptedPayload)
      })

      const url = buildUrl('signMessage', urlParams)
      Linking.openURL(url)
      break
    }
    case 'solana-phone-wallet-adapter': {
      // Solana phone wallet adapter supports a single
      // connect + signMessage, so nothing is necessary at this stage.
      break
    }
    case 'wallet-connect': {
      const { connector } = action.payload
      if (!connector) return

      const signature = yield* call(connector.signMessage, [message])
      yield put(signMessage({ path: 'wallet-sign-message', data: signature }))
      break
    }
  }
}

export function* watchConnectNewWallet() {
  yield* takeEvery(connectNewWallet.type, connectNewWalletAsync)
}
