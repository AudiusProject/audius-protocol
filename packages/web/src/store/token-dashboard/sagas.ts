import {
  Kind,
  Chain,
  weiToString,
  accountSelectors,
  cacheActions,
  tokenDashboardPageActions,
  ConfirmRemoveWalletAction,
  TokenDashboardPageModalState,
  tokenDashboardPageSelectors,
  walletActions,
  modalsActions,
  getContext,
  newUserMetadata
} from '@audius/common'
import {
  all,
  call,
  put,
  race,
  select,
  take,
  takeLatest
} from 'typed-redux-saga'

import { requestConfirmation } from 'common/store/confirmer/actions'
import { confirmTransaction } from 'common/store/confirmer/sagas'
import commonTokenDashboardSagas from 'common/store/pages/token-dashboard/sagas'
import {
  loadWalletLink,
  loadBitski,
  loadWalletConnect
} from 'services/web3-modal'
import { waitForWrite } from 'utils/sagaHelpers'

import { watchConnectNewWallet } from './connectNewWalletSaga'
import { getAccountMetadataCID } from './getAccountMetadataCID'
const { setVisibility } = modalsActions
const {
  send: walletSend,
  sendSucceeded,
  getBalance,
  sendFailed
} = walletActions
const { getSendData } = tokenDashboardPageSelectors
const {
  removeWallet: removeWalletAction,
  pressSend,
  setModalState,
  setModalVisibility: setSendAUDIOModalVisibility,
  confirmSend,
  confirmRemoveWallet,
  updateWalletError,
  preloadWalletProviders
} = tokenDashboardPageActions

const { getUserId, getAccountUser } = accountSelectors

const CONNECT_WALLET_CONFIRMATION_UID = 'CONNECT_WALLET'

function* pressSendAsync() {
  // Set modal state to input
  const inputStage: TokenDashboardPageModalState = {
    stage: 'SEND',
    flowState: {
      stage: 'INPUT'
    }
  }
  yield* all([
    put(setSendAUDIOModalVisibility({ isVisible: true })),
    put(setModalState({ modalState: inputStage }))
  ])
}

function* confirmSendAsync() {
  // Send the txn, update local balance
  const sendData = yield* select(getSendData)
  if (!sendData) return
  const { recipientWallet, amount, chain } = sendData
  yield* put(
    walletSend({ recipientWallet, amount: weiToString(amount), chain })
  )

  const { error } = yield* race({
    success: take(sendSucceeded),
    error: take(sendFailed)
  })

  if (error) {
    if (error.payload.error === 'Missing social proof') {
      yield* all([
        put(setSendAUDIOModalVisibility({ isVisible: false })),
        put(setVisibility({ modal: 'SocialProof', visible: true }))
      ])
    } else {
      const errorState: TokenDashboardPageModalState = {
        stage: 'SEND',
        flowState: {
          stage: 'ERROR',
          error: error.payload.error ?? ''
        }
      }
      yield* put(setModalState({ modalState: errorState }))
    }
    return
  }

  // Set modal state + new token + claim balances
  const sentState: TokenDashboardPageModalState = {
    stage: 'SEND',
    flowState: {
      stage: 'CONFIRMED_SEND',
      amount: weiToString(amount),
      recipientWallet,
      chain
    }
  }
  yield* put(setModalState({ modalState: sentState }))
}

function* removeWallet(action: ConfirmRemoveWalletAction) {
  yield* waitForWrite()
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  try {
    const removeWallet = action.payload.wallet
    const removeChain = action.payload.chain
    const accountUserId = yield* select(getUserId)
    const userMetadata = yield* select(getAccountUser)
    const updatedMetadata = newUserMetadata({ ...userMetadata })

    if (removeChain === Chain.Eth) {
      const currentAssociatedWallets = yield* call(
        audiusBackendInstance.fetchUserAssociatedEthWallets,
        updatedMetadata
      )
      if (
        currentAssociatedWallets &&
        !(removeWallet in currentAssociatedWallets)
      ) {
        // The wallet already removed from the associated wallets set
        yield* put(
          updateWalletError({ errorMessage: 'Wallet already removed' })
        )
        return
      }

      updatedMetadata.associated_wallets = {
        ...(currentAssociatedWallets || {})
      }

      delete updatedMetadata.associated_wallets[removeWallet]
    } else if (removeChain === Chain.Sol) {
      const currentAssociatedWallets = yield* call(
        audiusBackendInstance.fetchUserAssociatedSolWallets,
        updatedMetadata
      )
      if (
        currentAssociatedWallets &&
        !(removeWallet in currentAssociatedWallets)
      ) {
        // The wallet already removed fromthe associated wallets set
        yield* put(
          updateWalletError({ errorMessage: 'Wallet already removed' })
        )
        return
      }

      updatedMetadata.associated_sol_wallets = {
        ...(currentAssociatedWallets || {})
      }
      delete updatedMetadata.associated_sol_wallets[removeWallet]
    }

    if (!accountUserId) {
      return
    }

    yield* put(
      requestConfirmation(
        CONNECT_WALLET_CONFIRMATION_UID,
        function* () {
          const result = yield* call(
            audiusBackendInstance.updateCreator,
            updatedMetadata,
            accountUserId
          )
          if (!result) {
            return
          }
          const { blockHash, blockNumber } = result

          const confirmed = yield* call(
            confirmTransaction,
            blockHash,
            blockNumber
          )
          if (!confirmed) {
            throw new Error(
              `Could not confirm remove wallet for account user id ${accountUserId}`
            )
          }
          return accountUserId
        },
        // @ts-ignore: remove when confirmer is typed
        function* () {
          // Update the user's balance w/ the new wallet
          yield* put(getBalance())
          yield* put(
            removeWalletAction({ wallet: removeWallet, chain: removeChain })
          )
          const updatedCID = yield* call(getAccountMetadataCID)
          yield* put(
            cacheActions.update(Kind.USERS, [
              {
                id: accountUserId,
                metadata: { metadata_multihash: updatedCID }
              }
            ])
          )
        },
        function* () {
          yield* put(
            updateWalletError({ errorMessage: 'Unable to remove wallet' })
          )
        }
      )
    )
  } catch (error) {
    yield* put(updateWalletError({ errorMessage: 'Unable to remove wallet' }))
  }
}

function* preloadProviders() {
  yield loadWalletConnect()
  yield loadBitski()
  yield loadWalletLink()
}

function* watchPressSend() {
  yield* takeLatest(pressSend.type, pressSendAsync)
}

function* watchConfirmSend() {
  yield* takeLatest(confirmSend.type, confirmSendAsync)
}

function* watchPreloadWalletProviders() {
  yield* takeLatest(preloadWalletProviders.type, preloadProviders)
}

function* watchRemoveWallet() {
  yield* takeLatest(confirmRemoveWallet.type, removeWallet)
}

const sagas = () => {
  return [
    ...commonTokenDashboardSagas(),
    watchPressSend,
    watchConfirmSend,
    watchRemoveWallet,
    watchPreloadWalletProviders,
    watchConnectNewWallet
  ]
}

export default sagas
