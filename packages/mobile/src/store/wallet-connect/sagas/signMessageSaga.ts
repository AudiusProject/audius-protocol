import bs58 from 'bs58'
import { addWalletToUser } from 'common/store/pages/token-dashboard/addWalletToUser'
import { associateNewWallet } from 'common/store/pages/token-dashboard/associateNewWallet'
import { takeEvery, select, put } from 'typed-redux-saga'

import { setVisibility } from 'app/store/drawers/slice'

import { getSharedSecret } from '../selectors'
import { signMessage } from '../slice'
import type { SignMessageAction } from '../types'
import { decryptPayload } from '../utils'

type SignMessagePayload = {
  signature: string
  publicKey: string
}

function* signMessageAsync(action: SignMessageAction) {
  switch (action.payload.connectionType) {
    case null:
      console.error('No connection type set')
      break
    case 'phantom': {
      const { data, nonce } = action.payload
      const sharedSecret = yield* select(getSharedSecret)
      if (!sharedSecret) return
      if (!nonce) return

      const { signature }: SignMessagePayload = decryptPayload(
        data,
        nonce,
        sharedSecret
      )
      const sigByteArray = bs58.decode(signature)
      const sigBuffer = Buffer.from(sigByteArray)
      const sigHexString = sigBuffer.toString('hex')

      const updatedUserMetadata = yield* associateNewWallet(sigHexString)

      function* disconnect() {}

      yield* addWalletToUser(updatedUserMetadata, disconnect)
      break
    }
    case 'solana-phone-wallet-adapter': {
      const { data: signature, publicKey } = action.payload
      // TODO: connect to account
      console.log('signedMessagPayload', signature, publicKey)
      break
    }
    case 'wallet-connect': {
      const { data: signature } = action.payload

      const updatedUserMetadata = yield* associateNewWallet(signature)

      function* disconnect() {}

      yield* addWalletToUser(updatedUserMetadata, disconnect)
      break
    }
  }
  yield* put(setVisibility({ drawer: 'ConnectWallets', visible: false }))
}

export function* watchSignMessage() {
  yield* takeEvery(signMessage.type, signMessageAsync)
}
