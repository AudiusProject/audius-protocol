import { select } from 'redux-saga-test-plan/matchers'
import { all, put, race, take, takeEvery } from 'redux-saga/effects'
import {
  pressClaim,
  pressSend,
  setModalState,
  setModalVisibility,
  ModalState,
  inputSendData,
  confirmSend,
  getSendData
} from './slice'
import {
  claim as walletClaim,
  send as walletSend,
  claimSucceeded,
  claimFailed,
  getClaimableBalance,
  weiToString,
  sendSucceeded,
  sendFailed
} from 'store/wallet/slice'
import { addConfirmationCall, clear } from 'store/confirmer/actions'

const CLAIM_UID = 'CLAIM_UID'

function* send() {
  // Set modal state to input
  const inputStage: ModalState = {
    stage: 'SEND',
    flowState: {
      stage: 'INPUT'
    }
  }
  yield all([
    put(setModalVisibility({ isVisible: true })),
    put(setModalState({ modalState: inputStage }))
  ])

  // Await input + confirmation
  yield take(inputSendData.type)
  yield take(confirmSend.type)

  // Send the txn, update local balance
  const sendData: ReturnType<typeof getSendData> = yield select(getSendData)
  if (!sendData) return
  const { recipientWallet, amount } = sendData
  yield put(walletSend({ recipientWallet, amount: weiToString(amount) }))

  const { error }: { error: ReturnType<typeof claimFailed> } = yield race({
    success: take(sendSucceeded),
    error: take(sendFailed)
  })

  if (error) {
    const errorState: ModalState = {
      stage: 'SEND',
      flowState: {
        stage: 'ERROR',
        error: error.payload.error ?? ''
      }
    }
    yield put(setModalState({ modalState: errorState }))
    return
  }

  // Set modal state + new token + claim balances
  const sentState: ModalState = {
    stage: 'SEND',
    flowState: {
      stage: 'CONFIRMED_SEND',
      amount: weiToString(amount),
      recipientWallet
    }
  }
  yield put(setModalState({ modalState: sentState }))
}

function* claim() {
  const claimableBalance: ReturnType<typeof getClaimableBalance> = yield select(
    getClaimableBalance
  )
  if (!claimableBalance || claimableBalance.isZero()) return

  const claimingState: ModalState = {
    stage: 'CLAIM',
    flowState: {
      stage: 'CLAIMING'
    }
  }

  // Set loading state
  yield all([
    // Set modal state
    put(setModalVisibility({ isVisible: true })),
    put(setModalState({ modalState: claimingState })),
    put(addConfirmationCall(CLAIM_UID, () => {}))
  ])

  yield put(walletClaim())
  const { error }: { error: ReturnType<typeof claimFailed> } = yield race({
    success: take(claimSucceeded),
    error: take(claimFailed)
  })

  // Finish confirmation
  yield put(clear(CLAIM_UID))

  if (error) {
    const errorState: ModalState = {
      stage: 'CLAIM',
      flowState: {
        stage: 'ERROR',
        error: error.payload.error ?? ''
      }
    }
    yield put(setModalState({ modalState: errorState }))
    return
  }

  // Set modal state + new token + claim balances
  const claimedState: ModalState = {
    stage: 'CLAIM',
    flowState: {
      stage: 'SUCCESS'
    }
  }
  yield put(setModalState({ modalState: claimedState }))
}

function* watchPressSend() {
  yield takeEvery(pressSend.type, send)
}

function* watchPressClaim() {
  yield takeEvery(pressClaim.type, claim)
}
const sagas = () => {
  return [watchPressClaim, watchPressSend]
}

export default sagas
