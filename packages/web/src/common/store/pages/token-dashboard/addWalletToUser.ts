import { queryCurrentUserId } from '@audius/common/api'
import { Chain } from '@audius/common/models'
import {
  tokenDashboardPageActions,
  walletActions,
  confirmerActions,
  confirmTransaction,
  getSDK
} from '@audius/common/store'
import { Id } from '@audius/sdk'
import { call, put } from 'typed-redux-saga'

import { CONNECT_WALLET_CONFIRMATION_UID } from './types'
const { getBalance } = walletActions
const { setWalletAddedConfirmed, updateWalletError } = tokenDashboardPageActions
const { requestConfirmation } = confirmerActions

export function* addWalletToUser(
  {
    walletAddress,
    chain,
    signature
  }: { walletAddress: string; chain: Chain; signature: string },
  disconnect: () => Generator
) {
  const sdk = yield* getSDK()
  const accountUserId = yield* call(queryCurrentUserId)
  if (!accountUserId) return

  function* transactMetadata() {
    const result = yield* call([sdk.users, sdk.users.addAssociatedWallet], {
      userId: Id.parse(accountUserId),
      wallet: { address: walletAddress, chain },
      signature
    })

    if (!result) {
      throw new Error(
        `Could not confirm connect wallet for account user id ${accountUserId}`
      )
    }

    const { blockHash, blockNumber } = result

    const confirmed = yield* call(confirmTransaction, blockHash, blockNumber)

    if (!confirmed) {
      throw new Error(
        `Could not confirm connect wallet for account user id ${accountUserId}`
      )
    }
  }

  function* onSuccess() {
    // Update the user's balance w/ the new wallet
    yield* put(getBalance())

    yield* put(setWalletAddedConfirmed({}))

    // Disconnect the web3 instance because after we've linked, we no longer need it
    yield* call(disconnect)
  }

  function* onError() {
    yield* put(
      updateWalletError({
        errorMessage:
          'An error occured while connecting a wallet with your account.'
      })
    )
    // Disconnect the web3 instance in the event of an error, we no longer need it
    yield* call(disconnect)
  }

  yield* put(
    requestConfirmation(
      CONNECT_WALLET_CONFIRMATION_UID,
      transactMetadata,
      onSuccess,
      onError
    )
  )
}
