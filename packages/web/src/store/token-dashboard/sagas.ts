import {
  tokenDashboardPageActions,
  TokenDashboardPageModalState,
  tokenDashboardPageSelectors,
  walletActions,
  modalsActions
} from '@audius/common'
import { weiToString } from '@audius/common/utils'
import { all, put, race, select, take, takeLatest } from 'typed-redux-saga'

import commonTokenDashboardSagas from 'common/store/pages/token-dashboard/sagas'
import {
  loadWalletLink,
  loadBitski,
  loadWalletConnect
} from 'services/web3-modal'

import { watchConnectNewWallet } from './connectNewWalletSaga'
const { setVisibility } = modalsActions
const { send: walletSend, sendSucceeded, sendFailed } = walletActions
const { getSendData } = tokenDashboardPageSelectors
const {
  pressSend,
  setModalState,
  setModalVisibility: setSendAUDIOModalVisibility,
  confirmSend,
  preloadWalletProviders
} = tokenDashboardPageActions

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

const sagas = () => {
  return [
    ...commonTokenDashboardSagas(),
    watchPressSend,
    watchConfirmSend,
    watchPreloadWalletProviders,
    watchConnectNewWallet
  ]
}

export default sagas
