import BN from 'bn.js'
import { call, put, select, takeEvery } from 'typed-redux-saga/macro'

import { Name } from 'common/models/Analytics'
import { BNWei } from 'common/models/Wallet'
import { FeatureFlags } from 'common/services/remote-config'
import { getAccountUser } from 'common/store/account/selectors'
import { transferEthAudioToSolWAudio } from 'common/store/pages/token-dashboard/slice'
import { getSendTipData } from 'common/store/tipping/selectors'
import {
  confirmSendTip,
  sendTipFailed,
  sendTipSucceeded
} from 'common/store/tipping/slice'
import { getAccountBalance } from 'common/store/wallet/selectors'
import { decreaseBalance } from 'common/store/wallet/slice'
import { weiToAudioString, weiToString } from 'common/utils/wallet'
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'
import walletClient from 'services/wallet-client/WalletClient'
import { make } from 'store/analytics/actions'

const { getFeatureEnabled } = remoteConfigInstance

function* sendTipAsync() {
  const isTippingEnabled = getFeatureEnabled(FeatureFlags.TIPPING_ENABLED)
  if (!isTippingEnabled) {
    return
  }

  const account = yield* select(getAccountUser)
  if (!account) {
    return
  }

  const sendTipData = yield* select(getSendTipData)
  const { user, amount: weiBNAmount } = sendTipData
  if (!user) {
    return
  }

  const recipientWallet = user.spl_wallet
  const weiBNBalance: BNWei = yield select(getAccountBalance) ??
    (new BN('0') as BNWei)
  const waudioWeiAmount = yield* call(walletClient.getCurrentWAudioBalance)

  if (weiBNAmount.gt(weiBNBalance)) {
    const error = 'Not enough $AUDIO'
    console.error(`Send tip failed: ${error}`)
    yield put(sendTipFailed({ error }))
    return
  }

  try {
    yield put(
      make(Name.TIP_AUDIO_REQUEST, {
        senderWallet: account.spl_wallet,
        recipientWallet,
        senderHandle: account.handle,
        recipientHandle: user.handle,
        amount: weiToAudioString(weiBNAmount)
      })
    )
    // If transferring spl wrapped audio and there are insufficent funds with only the
    // user bank balance, transfer all eth AUDIO to spl wrapped audio
    if (weiBNAmount.gt(waudioWeiAmount)) {
      yield put(transferEthAudioToSolWAudio())
      yield call(walletClient.transferTokensFromEthToSol)
    }

    try {
      yield call(() =>
        walletClient.sendWAudioTokens(recipientWallet, weiBNAmount)
      )
    } catch (e) {
      const error = (e as Error).message
      console.error(`Send tip failed: ${error}`)
      yield put(sendTipFailed({ error }))
      return
    }

    // Only decrease store balance if we haven't already changed
    const newBalance: ReturnType<typeof getAccountBalance> = yield select(
      getAccountBalance
    )
    if (newBalance?.eq(weiBNBalance)) {
      yield put(decreaseBalance({ amount: weiToString(weiBNAmount) }))
    }

    yield put(sendTipSucceeded())
    yield put(
      make(Name.TIP_AUDIO_SUCCESS, {
        senderWallet: account.spl_wallet,
        recipientWallet,
        senderHandle: account.handle,
        recipientHandle: user.handle,
        amount: weiToAudioString(weiBNAmount)
      })
    )

    // todo: refresh the supporting list for account user
  } catch (e) {
    const error = (e as Error).message
    yield put(sendTipFailed({ error }))
    yield put(
      make(Name.TIP_AUDIO_FAILURE, {
        senderWallet: account.spl_wallet,
        recipientWallet,
        senderHandle: account.handle,
        recipientHandle: user.handle,
        amount: weiToAudioString(weiBNAmount),
        error
      })
    )
  }
}

function* watchConfirmSendTip() {
  yield takeEvery(confirmSendTip.type, sendTipAsync)
}

const sagas = () => {
  return [watchConfirmSendTip]
}

export default sagas
