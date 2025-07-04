import {
  getAccountAudioBalanceSaga,
  optimisticallyDecreaseUserSolBalance,
  revertOptimisticUserSolBalance,
  queryAccountUser,
  queryWalletAddresses
} from '@audius/common/api'
import { Name, SolanaWalletAddress } from '@audius/common/models'
import {
  tokenDashboardPageActions,
  walletActions,
  getContext,
  InputSendDataAction,
  getSDK
} from '@audius/common/store'
import { getErrorMessage, isNullOrUndefined } from '@audius/common/utils'
import { AUDIO, AudioWei } from '@audius/fixed-decimal'
import { call, put, takeEvery } from 'typed-redux-saga'

import { make } from 'common/store/analytics/actions'
import { waitForWrite } from 'utils/sagaHelpers'

const ATA_SIZE = 165 // Size allocated for an associated token account

const { send, sendSucceeded, sendFailed } = walletActions
const {
  transferEthAudioToSolWAudio,
  setCanRecipientReceiveWAudio,
  inputSendData
} = tokenDashboardPageActions

// TODO: handle errors
const errors = {
  rateLimitError: 'Please wait before trying again'
}

/**
 * Transfers tokens to recipientWallet for amount tokens on eth or sol chain
 * @param action Object passed as redux action
 * @param action.payload The payload of the action
 * @param action.payload.recipientWallet The recipient wallet address either sol or eth
 * @param action.payload.amount The amount in string wei to transfer
 * @param action.playload.chain 'eth' or 'sol'
 */
function* sendAsync({
  payload: { recipientWallet, amount: audioWeiString }
}: ReturnType<typeof send>) {
  // WalletClient relies on audiusBackendInstance. Use waitForWrite to ensure it's initialized
  yield* waitForWrite()
  const walletClient = yield* getContext('walletClient')
  const reportToSentry = yield* getContext('reportToSentry')

  const account = yield* call(queryAccountUser)

  const audioWeiAmount = AUDIO(BigInt(audioWeiString)).value
  const accountBalance = yield* call(getAccountAudioBalanceSaga)
  const weiBNBalance = accountBalance
    ? BigInt(accountBalance.toString())
    : BigInt(0)
  const { currentUser } = yield* call(queryWalletAddresses)
  if (!currentUser) {
    throw new Error('Failed to retrieve current user wallet address')
  }

  const waudioWeiAmount: AudioWei | null = yield* call(
    [walletClient, walletClient.getCurrentWAudioBalance],
    { ethAddress: currentUser }
  )

  if (isNullOrUndefined(waudioWeiAmount)) {
    yield* put(sendFailed({ error: 'Failed to fetch current wAudio balance.' }))
    return
  }

  if (audioWeiAmount > weiBNBalance) {
    yield* put(sendFailed({ error: 'Not enough $AUDIO' }))
    return
  }

  try {
    yield* call(optimisticallyDecreaseUserSolBalance, audioWeiAmount)

    yield* put(
      make(Name.SEND_AUDIO_REQUEST, {
        from: account?.wallet,
        recipient: recipientWallet
      })
    )

    const { currentUser } = yield* call(queryWalletAddresses)
    if (!currentUser) {
      throw new Error('Failed to get current user wallet address')
    }

    // If transferring spl wrapped audio and there are insufficent funds with only the
    // user bank balance, transfer all eth AUDIO to spl wrapped audio
    if (audioWeiAmount > waudioWeiAmount!) {
      yield* put(transferEthAudioToSolWAudio())
      try {
        yield* call([walletClient, walletClient.transferTokensFromEthToSol], {
          ethAddress: currentUser
        })
      } catch (e) {
        reportToSentry({
          error: e instanceof Error ? e : new Error(e as string),
          name: 'transferTokensFromEthToSol',
          additionalInfo: {
            ethAddress: currentUser
          }
        })
      }
    }
    try {
      yield* call([walletClient, walletClient.sendWAudioTokens], {
        address: recipientWallet as SolanaWalletAddress,
        amount: audioWeiAmount,
        ethAddress: currentUser
      })
    } catch (e) {
      yield* call(revertOptimisticUserSolBalance)

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
      yield* put(
        sendFailed({ error: 'Something has gone wrong, please try again.' })
      )
      return
    }

    yield* put(sendSucceeded())
    yield* put(
      make(Name.SEND_AUDIO_SUCCESS, {
        from: account?.wallet,
        recipient: recipientWallet
      })
    )
  } catch (error) {
    yield* call(revertOptimisticUserSolBalance)

    const errorMessage = getErrorMessage(error)
    const isRateLimit = errorMessage === errors.rateLimitError
    let errorText = errorMessage
    if (isRateLimit) {
      errorText =
        "If you've already sent $AUDIO today, please wait a day before trying again"
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

/**
 * Check if we can send WAudio to a recipient by checking if they already have
 * an associated WAudio token account, or if they have enough SOL to create one.
 */
function* checkAssociatedTokenAccountOrSol(action: InputSendDataAction) {
  const walletClient = yield* getContext('walletClient')
  const address = action.payload.wallet
  const sdk = yield* getSDK()
  const connection = sdk.services.solanaClient.connection

  const associatedTokenAccount = yield* call(
    [walletClient, walletClient.getAssociatedTokenAccountInfo],
    { address }
  )
  if (!associatedTokenAccount) {
    const balance: AudioWei = yield* call(() =>
      walletClient.getWalletSolBalance({ address })
    )

    // TODO: this can become a call to getAssociatedTokenRentExemptionMinimum
    // when the BuyAudio service has been migrated
    const minRentForATA = yield* call(
      [connection, connection.getMinimumBalanceForRentExemption],
      ATA_SIZE,
      'processed'
    )
    const minRentBigInt = BigInt(minRentForATA)
    if (balance < minRentBigInt) {
      yield* put(
        setCanRecipientReceiveWAudio({ canRecipientReceiveWAudio: 'false' })
      )
      return
    }
  }
  yield* put(
    setCanRecipientReceiveWAudio({ canRecipientReceiveWAudio: 'true' })
  )
}

function* watchSend() {
  yield* takeEvery(send.type, sendAsync)
}

function* watchInputSendData() {
  yield* takeEvery(inputSendData.type, checkAssociatedTokenAccountOrSol)
}

const sagas = () => {
  return [watchInputSendData, watchSend]
}

export default sagas
