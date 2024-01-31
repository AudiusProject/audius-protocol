import {
  accountSelectors,
  tokenDashboardPageActions,
  tokenDashboardPageSelectors,
  PhantomProvider
} from '@audius/common'
import { Chain } from '@audius/common/models'
import { call, put, select } from 'typed-redux-saga'

import { WalletConnection } from './types'
const { getUserId } = accountSelectors
const { getConfirmingWallet } = tokenDashboardPageSelectors
const { updateWalletError } = tokenDashboardPageActions

const solSign = async (provider: PhantomProvider, msg: Uint8Array) => {
  return provider.signMessage(msg, 'utf8')
}

export function* signMessage(connection: WalletConnection) {
  const accountUserId = yield* select(getUserId)
  const message = `AudiusUserID:${accountUserId}`
  const { wallet } = yield* select(getConfirmingWallet)
  if (!wallet) return

  switch (connection.chain) {
    case Chain.Eth: {
      return yield* call(connection.provider.eth.personal.sign, message, wallet)
    }
    case Chain.Sol: {
      const encodedMessage = new TextEncoder().encode(message)
      const signedResponse = yield* call(
        solSign,
        connection.provider,
        encodedMessage
      )
      const publicKey = signedResponse.publicKey.toString()
      const signature = signedResponse.signature.toString('hex')

      if (publicKey !== wallet) {
        yield* put(
          updateWalletError({
            errorMessage:
              'An error occured while connecting a wallet with your account.'
          })
        )

        return null
      }
      return signature
    }
  }
}
