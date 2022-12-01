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
  const { data, nonce } = action.payload
  const sharedSecret = yield* select(getSharedSecret)
  if (!sharedSecret) return

  const { signature, publicKey }: SignMessagePayload = decryptPayload(
    data,
    nonce,
    sharedSecret
  )

  // TODO: Refactor token-dashboard sagas #
  // yield* put(addNewWallet({ signature, publicKey }))
  console.log('signedMessagPayload', signature, publicKey)
  yield* put(setVisibility({ drawer: 'ConnectWallets', visible: false }))
}

export function* watchSignMessage() {
  yield* takeEvery(signMessage.type, signMessageAsync)
}
