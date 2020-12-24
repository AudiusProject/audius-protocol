import { all, call, put, take, takeEvery } from 'redux-saga/effects'
import {
  getBalance,
  getClaim,
  setBalance,
  setClaim,
  claim,
  getClaimableBalance,
  increaseBalance,
  claimSucceeded,
  claimFailed,
  send,
  sendSucceeded,
  sendFailed,
  getAccountBalance,
  decreaseBalance,
  stringWeiToBN,
  weiToString,
  BNWei,
  StringWei,
  getLocalBalanceDidChange
} from 'store/wallet/slice'
import { fetchAccountSucceeded } from 'store/account/reducer'
import walletClient from 'services/wallet-client/WalletClient'
import { select } from 'redux-saga-test-plan/matchers'
import { SETUP_BACKEND_SUCCEEDED } from 'store/backend/actions'
import { show as showMusicConfetti } from 'containers/music-confetti/store/slice'
import { make } from 'store/analytics/actions'
import { Name } from 'services/analytics'
import { getAccountUser } from 'store/account/selectors'

// TODO: handle errors

function* sendAsync({
  payload: { recipientWallet, amount }
}: ReturnType<typeof send>) {
  const account = yield select(getAccountUser)
  const weiBNAmount = stringWeiToBN(amount)
  const weiBNBalance: ReturnType<typeof getAccountBalance> = yield select(
    getAccountBalance
  )
  if (!weiBNBalance || !weiBNBalance.gte(weiBNAmount)) return
  try {
    yield put(
      make(Name.SEND_AUDIO_REQUEST, {
        from: account?.wallet,
        recipient: recipientWallet
      })
    )
    yield call(() => walletClient.sendTokens(recipientWallet, weiBNAmount))

    // Only decrease store balance if we haven't already changed
    const newBalance: ReturnType<typeof getAccountBalance> = yield select(
      getAccountBalance
    )
    if (newBalance?.eq(weiBNBalance)) {
      yield put(decreaseBalance({ amount }))
    }

    yield put(sendSucceeded())
    yield put(
      make(Name.SEND_AUDIO_SUCCESS, {
        from: account?.wallet,
        recipient: recipientWallet
      })
    )
  } catch (e) {
    yield put(sendFailed({ error: e.message }))
    yield put(
      make(Name.SEND_AUDIO_FAILURE, {
        from: account?.wallet,
        recipient: recipientWallet
      })
    )
  }
}

function* claimAsync() {
  const account = yield select(getAccountUser)
  const weiBNClaimable: ReturnType<typeof getClaimableBalance> = yield select(
    getClaimableBalance
  )
  if (!weiBNClaimable || weiBNClaimable.isZero()) return
  try {
    yield put(
      make(Name.CLAIM_AUDIO_REQUEST, {
        wallet: account?.wallet
      })
    )
    yield call(() => walletClient.claim())
    yield all([
      put(setClaim({ balance: '0' as StringWei })),
      put(increaseBalance({ amount: weiToString(weiBNClaimable) })),
      put(claimSucceeded()),
      put(showMusicConfetti())
    ])
    yield put(
      make(Name.CLAIM_AUDIO_SUCCESS, {
        wallet: account?.wallet
      })
    )
  } catch (e) {
    yield put(claimFailed({ error: e.message }))
    yield put(
      make(Name.CLAIM_AUDIO_FAILURE, {
        wallet: account?.wallet
      })
    )
  }
}

function* getWalletBalanceAndClaim() {
  yield all([put(getClaim()), put(getBalance())])
}

function* fetchBalanceAsync() {
  const localBalanceChange: ReturnType<typeof getLocalBalanceDidChange> = yield select(
    getLocalBalanceDidChange
  )
  const currentBalance: BNWei = yield call(() =>
    walletClient.getCurrentBalance(/* bustCache */ localBalanceChange)
  )
  yield put(setBalance({ balance: weiToString(currentBalance) }))
}

function* fetchClaimsAsync() {
  const pendingClaims: BNWei = yield call(() =>
    walletClient.getClaimableBalance()
  )
  yield put(setClaim({ balance: weiToString(pendingClaims) }))
}

function* watchSend() {
  yield takeEvery(send.type, sendAsync)
}

function* watchClaim() {
  yield takeEvery(claim.type, claimAsync)
}

function* watchGetBalance() {
  yield takeEvery(getBalance.type, fetchBalanceAsync)
}

function* watchGetClaims() {
  yield takeEvery(getClaim.type, fetchClaimsAsync)
}

function* watchFetchAccountSucceeded() {
  try {
    yield all([take(fetchAccountSucceeded.type), take(SETUP_BACKEND_SUCCEEDED)])
    yield getWalletBalanceAndClaim()
  } catch (err) {
    console.error(err)
  }
}

const sagas = () => {
  return [
    watchGetBalance,
    watchGetClaims,
    watchClaim,
    watchSend,
    watchFetchAccountSucceeded
  ]
}

export default sagas
