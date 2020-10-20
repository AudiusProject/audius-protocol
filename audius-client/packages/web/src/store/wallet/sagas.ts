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
  StringWei
} from 'store/wallet/slice'
import { fetchAccountSucceeded } from 'store/account/reducer'
import walletClient from 'services/wallet-client/WalletClient'
import { select } from 'redux-saga-test-plan/matchers'
import { SETUP_BACKEND_SUCCEEDED } from 'store/backend/actions'
import { show as showMusicConfetti } from 'containers/music-confetti/store/slice'

// TODO: handle errors

function* sendAsync({
  payload: { recipientWallet, amount }
}: ReturnType<typeof send>) {
  const weiBNAmount = stringWeiToBN(amount)
  const weiBNBalance: ReturnType<typeof getAccountBalance> = yield select(
    getAccountBalance
  )
  if (!weiBNBalance || !weiBNBalance.gte(weiBNAmount)) return
  try {
    yield call(() => walletClient.sendTokens(recipientWallet, weiBNAmount))
    yield all([put(decreaseBalance({ amount })), put(sendSucceeded())])
  } catch (e) {
    yield put(sendFailed({ error: e.message }))
  }
}

function* claimAsync() {
  const weiBNClaimable: ReturnType<typeof getClaimableBalance> = yield select(
    getClaimableBalance
  )
  if (!weiBNClaimable || weiBNClaimable.isZero()) return
  try {
    yield call(() => walletClient.claim())
    yield all([
      put(setClaim({ balance: '0' as StringWei })),
      put(increaseBalance({ amount: weiToString(weiBNClaimable) })),
      put(claimSucceeded()),
      put(showMusicConfetti())
    ])
  } catch (e) {
    yield put(claimFailed({ error: e.message }))
  }
}

function* getWalletBalanceAndClaim() {
  yield all([put(getClaim()), put(getBalance())])
}

function* fetchBalanceAsync() {
  const currentBalance: BNWei = yield call(() =>
    walletClient.getCurrentBalance()
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
