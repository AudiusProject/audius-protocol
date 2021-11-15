import { select } from 'redux-saga-test-plan/matchers'
import { all, call, put, take, takeEvery } from 'redux-saga/effects'

import { Name } from 'common/models/Analytics'
import { BNWei } from 'common/models/Wallet'
import { fetchAccountSucceeded } from 'common/store/account/reducer'
import { getAccountUser } from 'common/store/account/selectors'
import walletClient from 'services/wallet-client/WalletClient'
import { make } from 'store/analytics/actions'
import { SETUP_BACKEND_SUCCEEDED } from 'store/backend/actions'
import { fetchAssociatedWallets } from 'store/token-dashboard/slice'
import {
  getAccountBalance,
  getLocalBalanceDidChange
} from 'store/wallet/selectors'
import {
  getBalance,
  setBalance,
  send,
  sendSucceeded,
  sendFailed,
  decreaseBalance
} from 'store/wallet/slice'
import { stringWeiToBN, weiToString } from 'utils/wallet'

// TODO: handle errors
const errors = {
  rateLimitError: 'Please wait before trying again'
}

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
    const isRateLimit = e.message === errors.rateLimitError
    let errorText = e.message
    if (isRateLimit) {
      errorText =
        'If you’ve already sent $AUDIO today, please wait a day before trying again'
    }
    yield put(sendFailed({ error: errorText }))
    yield put(
      make(Name.SEND_AUDIO_FAILURE, {
        from: account?.wallet,
        recipient: recipientWallet,
        error: errorText
      })
    )
  }
}

function* getWalletBalanceAndWallets() {
  yield all([put(getBalance()), put(fetchAssociatedWallets())])
}

function* fetchBalanceAsync() {
  const account = yield select(getAccountUser)
  const localBalanceChange: ReturnType<typeof getLocalBalanceDidChange> = yield select(
    getLocalBalanceDidChange
  )
  const currentBalance: BNWei = yield call(() =>
    walletClient.getCurrentBalance(/* bustCache */ localBalanceChange)
  )
  const associatedWalletBalance: BNWei = yield call(() =>
    walletClient.getAssociatedWalletBalance(
      account.user_id,
      /* bustCache */ localBalanceChange
    )
  )
  const totalBalance = currentBalance.add(associatedWalletBalance) as BNWei
  yield put(
    setBalance({
      balance: weiToString(currentBalance),
      totalBalance: weiToString(totalBalance)
    })
  )
}

function* watchSend() {
  yield takeEvery(send.type, sendAsync)
}

function* watchGetBalance() {
  yield takeEvery(getBalance.type, fetchBalanceAsync)
}

function* watchFetchAccountSucceeded() {
  try {
    yield all([take(fetchAccountSucceeded.type), take(SETUP_BACKEND_SUCCEEDED)])
    yield getWalletBalanceAndWallets()
  } catch (err) {
    console.error(err)
  }
}

const sagas = () => {
  return [watchGetBalance, watchSend, watchFetchAccountSucceeded]
}

export default sagas
