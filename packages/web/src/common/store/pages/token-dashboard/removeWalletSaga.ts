import { queryAccountUser } from '@audius/common/api'
import {
  accountSelectors,
  tokenDashboardPageActions,
  walletActions,
  confirmerActions,
  confirmTransaction,
  ConfirmRemoveWalletAction,
  getSDK
} from '@audius/common/store'
import { Id } from '@audius/sdk'
import { call, fork, put, select, takeLatest } from 'typed-redux-saga'

import {
  fetchEthereumCollectibles,
  fetchSolanaCollectibles
} from 'common/store/profile/sagas'
import { waitForWrite } from 'utils/sagaHelpers'

import { CONNECT_WALLET_CONFIRMATION_UID } from './types'

const { getUserId } = accountSelectors
const {
  confirmRemoveWallet,
  updateWalletError,
  removeWallet: removeWalletAction
} = tokenDashboardPageActions

const { getBalance } = walletActions

const { requestConfirmation } = confirmerActions

function* removeWallet(action: ConfirmRemoveWalletAction) {
  yield* waitForWrite()
  const sdk = yield* getSDK()
  const removeWallet = action.payload.wallet
  const removeChain = action.payload.chain
  const accountUserId = yield* select(getUserId)

  if (!accountUserId) {
    return
  }

  function* removeWalletFromUser() {
    const result = yield* call([sdk.users, sdk.users.removeAssociatedWallet], {
      userId: Id.parse(accountUserId),
      wallet: { address: removeWallet, chain: removeChain }
    })

    const { blockHash, blockNumber } = result

    const confirmed = yield* call(confirmTransaction, blockHash, blockNumber)
    if (!confirmed) {
      throw new Error(
        `Could not confirm remove wallet for account user id ${accountUserId}`
      )
    }
    return accountUserId
  }

  function* onSuccess() {
    // Update the user's balance w/ the new wallet
    yield* put(getBalance())
    yield* put(removeWalletAction({ wallet: removeWallet, chain: removeChain }))

    const user = yield* call(queryAccountUser)

    yield* fork(fetchSolanaCollectibles, user)
    yield* fork(fetchEthereumCollectibles, user)
  }

  function* onError() {
    yield* put(updateWalletError({ errorMessage: 'Unable to remove wallet' }))
  }

  yield* put(
    requestConfirmation(
      CONNECT_WALLET_CONFIRMATION_UID,
      removeWalletFromUser,
      onSuccess,
      onError
    )
  )
}

export function* watchRemoveWallet() {
  yield* takeLatest(confirmRemoveWallet.type, removeWallet)
}
