import { QUERY_KEYS } from '@audius/common/api'
import { Name, ID, BNWei, SolanaWalletAddress } from '@audius/common/models'
import { LocalStorage } from '@audius/common/services'
import {
  accountSelectors,
  chatActions,
  tippingSelectors,
  tippingActions,
  walletActions,
  getContext,
  getSDK
} from '@audius/common/store'
import { isNullOrUndefined, encodeHashId } from '@audius/common/utils'
import { AUDIO } from '@audius/fixed-decimal'
import BN from 'bn.js'
import {
  call,
  delay,
  put,
  select,
  takeEvery,
  fork,
  cancel
} from 'typed-redux-saga'

import { make } from 'common/store/analytics/actions'
import { reportToSentry } from 'store/errors/reportToSentry'

const { getBalance } = walletActions
const {
  confirmSendTip,
  convert,
  sendTipFailed,
  sendTipSucceeded,
  refreshTipGatedTracks
} = tippingActions
const { getSendTipData } = tippingSelectors

const { getAccountUser, getWalletAddresses } = accountSelectors
const { fetchPermissions } = chatActions

const FEED_TIP_DISMISSAL_TIME_LIMIT_SEC = 30 * 24 * 60 * 60 // 30 days
const DISMISSED_TIP_KEY = 'dismissed-tips'

export const storeDismissedTipInfo = async (
  localStorage: LocalStorage,
  receiverId: ID
) => {
  localStorage.setExpiringJSONValue(
    DISMISSED_TIP_KEY,
    { receiver_id: receiverId },
    FEED_TIP_DISMISSAL_TIME_LIMIT_SEC
  )
}

/**
 * Polls the /supporter endpoint to check if the sender is listed as a supporter of the recipient
 */
function* confirmTipIndexed({
  signature,
  maxAttempts = 60,
  delayMs = 1000
}: {
  signature: string
  maxAttempts?: number
  delayMs?: number
}) {
  for (let attempts = 0; attempts < maxAttempts; attempts++) {
    console.debug(
      `Confirming tip is indexed... [${
        attempts + 1
      }/${maxAttempts}] (delay: ${delayMs}ms)`
    )
    try {
      const sdk = yield* getSDK()
      const { data } = yield* call([sdk.full.tips, sdk.full.tips.getTips], {
        txSignatures: [signature]
      })

      if (data && data.length > 0) {
        console.info('Tip indexed')
        return true
      } else if (data?.length === 0) {
        console.debug('Tip not indexed yet...')
      }
      yield* delay(delayMs)
    } catch (e) {
      console.error('Error confirming tip indexed: ', e)
      return false
    }
  }
  console.error('Tip could not be confirmed as indexed before timing out.')
  return false
}

function* wormholeAudioIfNecessary({ amount }: { amount: number }) {
  const walletClient = yield* getContext('walletClient')
  const { currentUser } = yield* select(getWalletAddresses)
  if (!currentUser) {
    throw new Error('Failed to retrieve current user wallet address')
  }

  const waudioBalanceWei = yield* call(
    [walletClient, walletClient.getCurrentWAudioBalance],
    {
      ethAddress: currentUser
    }
  )
  const audioWeiAmount = new BN(AUDIO(amount).value.toString()) as BNWei

  if (isNullOrUndefined(waudioBalanceWei)) {
    throw new Error('Failed to retrieve current wAudio balance')
  }

  // If transferring spl wrapped audio and there are insufficent funds with only the
  // user bank balance, transfer all eth AUDIO to spl wrapped audio
  if (audioWeiAmount.gt(waudioBalanceWei)) {
    console.info('Converting Ethereum AUDIO to Solana wAUDIO...')

    // Wait for a second before showing the notice that this might take a while
    const showConvertingMessage = yield* fork(function* () {
      yield delay(1000)
      yield put(convert())
    })
    yield call([walletClient, walletClient.transferTokensFromEthToSol], {
      ethAddress: currentUser
    })
    // Cancel showing the notice if the conversion was magically super quick
    yield cancel(showConvertingMessage)
  }
}

function* sendTipAsync() {
  const audiusSdk = yield* getContext('audiusSdk')
  const sdk = yield* call(audiusSdk)
  const isNativeMobile = yield* getContext('isNativeMobile')

  const sender = yield* select(getAccountUser)
  const {
    trackId,
    user: receiver,
    amount: stringAudioAmount,
    onSuccessConfirmedActions,
    source
  } = yield* select(getSendTipData)

  if (!sender || !receiver) {
    return
  }

  const device = isNativeMobile ? 'mobile' : 'web'

  const senderUserId = encodeHashId(sender.user_id)
  const receiverUserId = encodeHashId(receiver.user_id)

  const amount = Number(stringAudioAmount)

  let senderWallet: SolanaWalletAddress | undefined
  let recipientWallet: SolanaWalletAddress | undefined

  // Using `deriveUserBank` here because we just need the addresses for
  // analytics. The SDK call to send the tip will create them if needed.
  try {
    senderWallet = (yield* call(
      [
        sdk.services.claimableTokensClient,
        sdk.services.claimableTokensClient.deriveUserBank
      ],
      { ethWallet: sender.erc_wallet, mint: 'wAUDIO' }
    )).toString() as SolanaWalletAddress
    recipientWallet = (yield* call(
      [
        sdk.services.claimableTokensClient,
        sdk.services.claimableTokensClient.deriveUserBank
      ],
      { ethWallet: receiver.erc_wallet, mint: 'wAUDIO' }
    )).toString() as SolanaWalletAddress
  } catch (e) {
    // Don't want these to fail the saga as it's just used for analytics
    console.warn('Failed to derive user bank address for tip analytics', e)
  }

  try {
    yield put(
      make(Name.TIP_AUDIO_REQUEST, {
        senderWallet,
        recipientWallet,
        senderHandle: sender.handle,
        recipientHandle: receiver.handle,
        amount,
        device,
        source
      })
    )

    yield* call(wormholeAudioIfNecessary, { amount })

    const signature = yield* call([sdk.users, sdk.users.sendTip], {
      amount,
      senderUserId,
      receiverUserId
    })

    yield put(sendTipSucceeded())
    yield put(
      make(Name.TIP_AUDIO_SUCCESS, {
        recipientHandle: receiver.handle,
        amount: stringAudioAmount,
        device,
        source
      })
    )

    yield* put(refreshTipGatedTracks({ userId: receiver.user_id, trackId }))

    yield* fork(function* () {
      // Wait for tip to index
      yield* call(confirmTipIndexed, { signature })

      // Fetch balance
      yield* put(getBalance)

      // Refetch chat permissions
      yield* put(
        fetchPermissions({ userIds: [sender.user_id, receiver.user_id] })
      )

      // Do any callbacks
      if (onSuccessConfirmedActions) {
        // Spread here to unfreeze the action
        // Redux sagas can't "put" frozen actions
        for (const action of onSuccessConfirmedActions) {
          yield* put({ ...action })
        }
      }

      // Record if the tip unlocked a chat
      if (source === 'inboxUnavailableModal') {
        yield* put(
          make(Name.TIP_UNLOCKED_CHAT, {
            recipientUserId: receiver.user_id
          })
        )
      }
    })

    // Invalidate all the entities that are affected by this tip
    const queryClient = yield* getContext('queryClient')

    queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.user, receiverUserId]
    })
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.user, senderUserId]
    })
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.supporters, receiverUserId]
    })
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.supporters, receiverUserId, senderUserId]
    })
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEYS.supportedUsers, senderUserId]
    })
  } catch (error) {
    const e = error instanceof Error ? error : new Error(String(error))
    console.error(`Send tip failed`, error)
    yield* put(sendTipFailed({ error: e.message }))
    yield* put(
      make(Name.TIP_AUDIO_FAILURE, {
        senderWallet,
        recipientWallet,
        senderHandle: sender.handle,
        recipientHandle: receiver.handle,
        amount,
        error: 'transactionMessage' in e ? e.transactionMessage : e.message,
        device,
        source
      })
    )
    yield* call(reportToSentry, {
      name: 'SendTip',
      error: e,
      additionalInfo: {
        senderUserId,
        receiverUserId,
        amount
      }
    })
  }
}

function* watchConfirmSendTip() {
  yield* takeEvery(confirmSendTip.type, sendTipAsync)
}

const sagas = () => {
  return [watchConfirmSendTip]
}

export default sagas
