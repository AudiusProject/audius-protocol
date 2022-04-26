import BN from 'bn.js'
import { select } from 'redux-saga-test-plan/matchers'
import { all, call, put, take, takeEvery } from 'redux-saga/effects'

import { Name } from 'common/models/Analytics'
import { Chain } from 'common/models/Chain'
import { BNWei } from 'common/models/Wallet'
import { FeatureFlags } from 'common/services/remote-config'
import { fetchAccountSucceeded } from 'common/store/account/reducer'
import { getAccountUser } from 'common/store/account/selectors'
import {
  fetchAssociatedWallets,
  transferEthAudioToSolWAudio
} from 'common/store/pages/token-dashboard/slice'
import {
  getAccountBalance,
  getLocalBalanceDidChange
} from 'common/store/wallet/selectors'
import {
  getBalance,
  setBalance,
  send,
  sendSucceeded,
  sendFailed,
  decreaseBalance
} from 'common/store/wallet/slice'
import { stringWeiToBN, weiToString } from 'common/utils/wallet'
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'
import walletClient from 'services/wallet-client/WalletClient'
import { make } from 'store/analytics/actions'
import { SETUP_BACKEND_SUCCEEDED } from 'store/backend/actions'

const { getFeatureEnabled } = remoteConfigInstance

// TODO: handle errors
const errors = {
  rateLimitError: 'Please wait before trying again'
}

/**
 * Transfers tokens to recipientWallet for amount tokens on eth or sol chain
 * @param {object} action Object passed as redux action
 * @param {object} action.payload The payload of the action
 * @param {string} action.payload.recipientWallet The reciepint address either sol or eth
 * @param {StringWei} action.payload.amount The amount in string wei to transfer
 * @param {string} action.playload.chain 'eth' or 'sol'
 */
function* sendAsync({
  payload: { recipientWallet, amount: weiAudioAmount, chain }
}: ReturnType<typeof send>) {
  const account = yield select(getAccountUser)
  const weiBNAmount = stringWeiToBN(weiAudioAmount)
  const weiBNBalance: BNWei = yield select(getAccountBalance) ??
    (new BN('0') as BNWei)

  const waudioWeiAmount: BNWei = yield call(
    walletClient.getCurrentWAudioBalance
  )
  if (
    chain === Chain.Eth &&
    (!weiBNBalance || !weiBNBalance.gte(weiBNAmount))
  ) {
    yield put(sendFailed({ error: 'Not enough $AUDIO' }))
    return
  } else if (chain === Chain.Sol) {
    if (weiBNAmount.gt(weiBNBalance)) {
      yield put(sendFailed({ error: 'Not enough $AUDIO' }))
      return
    }
  }

  try {
    yield put(
      make(Name.SEND_AUDIO_REQUEST, {
        from: account?.wallet,
        recipient: recipientWallet
      })
    )
    // If transferring spl wrapped audio and there are insufficent funds with only the
    // user bank balance, transfer all eth AUDIO to spl wrapped audio
    if (chain === Chain.Sol && weiBNAmount.gt(waudioWeiAmount)) {
      yield put(transferEthAudioToSolWAudio())
      yield call(walletClient.transferTokensFromEthToSol)
    }

    if (chain === Chain.Eth) {
      yield call(() => walletClient.sendTokens(recipientWallet, weiBNAmount))
    } else {
      try {
        yield call(() =>
          walletClient.sendWAudioTokens(recipientWallet, weiBNAmount)
        )
      } catch (e) {
        if ((e as Error)?.message === 'Missing social proof') {
          yield put(sendFailed({ error: 'Missing social proof' }))
          return
        }
        if (
          (e as Error)?.message ===
          'Recipient has no $AUDIO token account. Please install Phantom-Wallet to create one.'
        ) {
          yield put(sendFailed({ error: (e as Error).message }))
          return
        }
      }
    }

    // Only decrease store balance if we haven't already changed
    const newBalance: ReturnType<typeof getAccountBalance> = yield select(
      getAccountBalance
    )
    if (newBalance?.eq(weiBNBalance)) {
      yield put(decreaseBalance({ amount: weiAudioAmount }))
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
  const [currentEthAudioWeiBalance, currentSolAudioWeiBalance]: [
    BNWei,
    BNWei
  ] = yield all([
    call(() =>
      walletClient.getCurrentBalance(/* bustCache */ localBalanceChange)
    ),
    call(() => walletClient.getCurrentWAudioBalance())
  ])

  const associatedWalletBalance: BNWei = yield call(() =>
    walletClient.getAssociatedWalletBalance(
      account.user_id,
      /* bustCache */ localBalanceChange
    )
  )
  const audioWeiBalance = currentEthAudioWeiBalance.add(
    currentSolAudioWeiBalance
  ) as BNWei
  const useSolAudio = getFeatureEnabled(FeatureFlags.ENABLE_SPL_AUDIO)
  if (useSolAudio) {
    const totalBalance = audioWeiBalance.add(associatedWalletBalance) as BNWei
    yield put(
      setBalance({
        balance: weiToString(audioWeiBalance),
        totalBalance: weiToString(totalBalance)
      })
    )
  } else {
    const totalBalance = currentEthAudioWeiBalance.add(
      associatedWalletBalance
    ) as BNWei
    yield put(
      setBalance({
        balance: weiToString(currentEthAudioWeiBalance),
        totalBalance: weiToString(totalBalance)
      })
    )
  }
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
