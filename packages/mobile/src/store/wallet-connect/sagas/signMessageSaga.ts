import { Name } from '@audius/common/models'
import type { CommonState } from '@audius/common/store'
import { tokenDashboardPageSelectors, getContext } from '@audius/common/store'
import { getErrorMessage, waitForValue } from '@audius/common/utils'
import bs58 from 'bs58'
import { addWalletToUser } from 'common/store/pages/token-dashboard/addWalletToUser'
import { associateNewWallet } from 'common/store/pages/token-dashboard/associateNewWallet'
import { takeEvery, select, put, call } from 'typed-redux-saga'

import { setVisibility } from 'app/store/drawers/slice'

import { getSharedSecret } from '../selectors'
import { setConnectionStatus, signMessage } from '../slice'
import type { SignMessageAction } from '../types'
import { decryptPayload } from '../utils'
const { getError, getConfirmingWallet } = tokenDashboardPageSelectors

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
      if (!updatedUserMetadata) return

      function* disconnect() {}

      yield* addWalletToUser(updatedUserMetadata, disconnect)
      break
    }
    case 'solana-phone-wallet-adapter': {
      const { data: signature } = action.payload

      // With solana phone, connectWallet saga doesn't finish in time before
      // signMessage starts
      yield* waitForValue((state: CommonState) => {
        const { wallet, chain } = getConfirmingWallet(state)
        const error = getError(state)
        return wallet || chain || error
      })

      // Check for cases where an error has occured, like if the wallet is already connected
      const walletError = yield* select(getError)
      if (walletError) return

      const signatureEncoded = Buffer.from(signature, 'base64')
        .slice(-64)
        .toString('hex')

      const updatedUserMetadata = yield* associateNewWallet(signatureEncoded)
      if (!updatedUserMetadata) return

      function* disconnect() {}
      yield* addWalletToUser(updatedUserMetadata, disconnect)
      break
    }
    case 'wallet-connect': {
      const { data: signature } = action.payload

      const updatedUserMetadata = yield* associateNewWallet(signature)
      if (!updatedUserMetadata) return

      function* disconnect() {}
      yield* addWalletToUser(updatedUserMetadata, disconnect)
      break
    }
  }

  yield* put(setConnectionStatus({ status: 'done' }))
  yield* put(setVisibility({ drawer: 'ConnectWallets', visible: false }))

  const { wallet, chain } = yield* select(getConfirmingWallet)

  const analytics = yield* getContext('analytics')
  analytics.track({
    eventName: Name.CONNECT_WALLET_NEW_WALLET_CONNECTED,
    properties: {
      chain,
      walletAddress: wallet
    }
  })
}

export function* watchSignMessage() {
  yield* takeEvery(signMessage.type, function* (action: SignMessageAction) {
    const analytics = yield* getContext('analytics')
    try {
      yield* call(signMessageAsync, action)
    } catch (e) {
      const error = `Caught error in signMessageSaga:  ${getErrorMessage(e)}`
      analytics.track({
        eventName: Name.CONNECT_WALLET_ERROR,
        properties: {
          error
        }
      })
    }
  })
}
