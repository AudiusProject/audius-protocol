import { Name, Chain, BNWei, FeatureFlags } from '@audius/common'
import BN from 'bn.js'
import { all, call, put, take, takeEvery, select } from 'typed-redux-saga/macro'

import { fetchAccountSucceeded } from 'common/store/account/reducer'
import { getAccountUser } from 'common/store/account/selectors'
import { SETUP_BACKEND_SUCCEEDED } from 'common/store/backend/actions'
import {
  fetchAssociatedWallets,
  transferEthAudioToSolWAudio
} from 'common/store/pages/token-dashboard/slice'
import {
  getAccountBalance,
  getFreezeUntilTime,
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
import { getErrorMessage } from 'common/utils/error'
import { stringWeiToBN, weiToString } from 'common/utils/wallet'
import { getFeatureEnabled } from 'services/remote-config/featureFlagHelpers'
import walletClient from 'services/wallet-client/WalletClient'
import { make } from 'store/analytics/actions'

// TODO: handle errors
const errors = {
  rateLimitError: 'Please wait before trying again'
}

function* getIsBalanceFrozen() {
  const freezeUntil = yield* select(getFreezeUntilTime)
  return freezeUntil && Date.now() < freezeUntil
}

/**
 * Transfers tokens to recipientWallet for amount tokens on eth or sol chain
 * @param action Object passed as redux action
 * @param action.payload The payload of the action
 * @param action.payload.recipientWallet The reciepint address either sol or eth
 * @param action.payload.amount The amount in string wei to transfer
 * @param action.playload.chain 'eth' or 'sol'
 */
function* sendAsync({
  payload: { recipientWallet, amount: weiAudioAmount, chain }
}: ReturnType<typeof send>) {
  const account = yield* select(getAccountUser)
  const weiBNAmount = stringWeiToBN(weiAudioAmount)
  const accountBalance = yield* select(getAccountBalance)
  const weiBNBalance = accountBalance ?? (new BN('0') as BNWei)

  const waudioWeiAmount: BNWei = yield* call(
    walletClient.getCurrentWAudioBalance
  )
  if (
    chain === Chain.Eth &&
    (!weiBNBalance || !weiBNBalance.gte(weiBNAmount))
  ) {
    yield* put(sendFailed({ error: 'Not enough $AUDIO' }))
    return
  } else if (chain === Chain.Sol) {
    if (weiBNAmount.gt(weiBNBalance)) {
      yield* put(sendFailed({ error: 'Not enough $AUDIO' }))
      return
    }
  }

  try {
    yield* put(
      make(Name.SEND_AUDIO_REQUEST, {
        from: account?.wallet,
        recipient: recipientWallet
      })
    )
    // If transferring spl wrapped audio and there are insufficent funds with only the
    // user bank balance, transfer all eth AUDIO to spl wrapped audio
    if (chain === Chain.Sol && weiBNAmount.gt(waudioWeiAmount)) {
      yield* put(transferEthAudioToSolWAudio())
      yield* call(walletClient.transferTokensFromEthToSol)
    }

    if (chain === Chain.Eth) {
      yield* call(() => walletClient.sendTokens(recipientWallet, weiBNAmount))
    } else {
      try {
        yield* call(() =>
          walletClient.sendWAudioTokens(recipientWallet, weiBNAmount)
        )
      } catch (e) {
        const errorMessage = getErrorMessage(e)
        if (errorMessage === 'Missing social proof') {
          yield* put(sendFailed({ error: 'Missing social proof' }))
          return
        }
        if (
          errorMessage ===
          'Recipient has no $AUDIO token account. Please install Phantom-Wallet to create one.'
        ) {
          yield* put(sendFailed({ error: errorMessage }))
          return
        }
      }
    }

    // Only decrease store balance if we haven't already changed
    const newBalance: ReturnType<typeof getAccountBalance> = yield* select(
      getAccountBalance
    )
    if (newBalance?.eq(weiBNBalance)) {
      yield* put(decreaseBalance({ amount: weiAudioAmount }))
    }

    yield* put(sendSucceeded())
    yield* put(
      make(Name.SEND_AUDIO_SUCCESS, {
        from: account?.wallet,
        recipient: recipientWallet
      })
    )
  } catch (error) {
    const errorMessage = getErrorMessage(error)
    const isRateLimit = errorMessage === errors.rateLimitError
    let errorText = errorMessage
    if (isRateLimit) {
      errorText =
        'If you’ve already sent $AUDIO today, please wait a day before trying again'
    }
    yield* put(sendFailed({ error: errorText }))
    yield* put(
      make(Name.SEND_AUDIO_FAILURE, {
        from: account?.wallet,
        recipient: recipientWallet,
        error: errorText
      })
    )
  }
}

function* getWalletBalanceAndWallets() {
  yield* all([put(getBalance()), put(fetchAssociatedWallets())])
}

function* fetchBalanceAsync() {
  const account = yield* select(getAccountUser)
  if (!account) return

  // Opt out of balance refreshes if the balance
  // is frozen due to a recent optimistic update
  const isBalanceFrozen = yield* call(getIsBalanceFrozen)
  if (isBalanceFrozen) return

  const localBalanceChange: ReturnType<typeof getLocalBalanceDidChange> =
    yield* select(getLocalBalanceDidChange)

  const [currentEthAudioWeiBalance, currentSolAudioWeiBalance] = yield* all([
    call(() =>
      walletClient.getCurrentBalance(/* bustCache */ localBalanceChange)
    ),
    call(() => walletClient.getCurrentWAudioBalance())
  ])

  const associatedWalletBalance: BNWei = yield* call(() =>
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
    yield* put(
      setBalance({
        balance: weiToString(audioWeiBalance),
        totalBalance: weiToString(totalBalance)
      })
    )
  } else {
    const totalBalance = currentEthAudioWeiBalance.add(
      associatedWalletBalance
    ) as BNWei
    yield* put(
      setBalance({
        balance: weiToString(currentEthAudioWeiBalance),
        totalBalance: weiToString(totalBalance)
      })
    )
  }
}

function* watchSend() {
  yield* takeEvery(send.type, sendAsync)
}

function* watchGetBalance() {
  yield* takeEvery(getBalance.type, fetchBalanceAsync)
}

function* watchFetchAccountSucceeded() {
  try {
    yield* all([
      take(fetchAccountSucceeded.type),
      take(SETUP_BACKEND_SUCCEEDED)
    ])
    yield* getWalletBalanceAndWallets()
  } catch (err) {
    console.error(err)
  }
}

const sagas = () => {
  return [watchGetBalance, watchSend, watchFetchAccountSucceeded]
}

export default sagas
