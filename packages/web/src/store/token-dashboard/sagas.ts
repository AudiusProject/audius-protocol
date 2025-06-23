import { StringWei } from '@audius/common/models'
import {
  tokenDashboardPageSelectors,
  tokenDashboardPageActions,
  walletActions,
  modalsActions,
  TokenDashboardPageModalState
} from '@audius/common/store'
import { all, put, race, select, take, takeLatest } from 'typed-redux-saga'

const { setVisibility } = modalsActions
const { send: walletSend, sendSucceeded, sendFailed } = walletActions
const { getSendData } = tokenDashboardPageSelectors
const {
  pressSend,
  setModalState,
  setModalVisibility: setSendAUDIOModalVisibility,
  confirmSend
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
  const { recipientWallet, amount } = sendData
  yield* put(
    walletSend({ recipientWallet, amount: amount.toString() as StringWei })
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
      amount: amount.toString() as StringWei,
      recipientWallet
    }
  }
  yield* put(setModalState({ modalState: sentState }))
}

function* watchPressSend() {
  yield* takeLatest(pressSend.type, pressSendAsync)
}

function* watchConfirmSend() {
  yield* takeLatest(confirmSend.type, confirmSendAsync)
}

const sagas = () => {
  return [watchPressSend, watchConfirmSend]
}

export default sagas
