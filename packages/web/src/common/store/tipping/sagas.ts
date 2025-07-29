import {
  QUERY_KEYS,
  getSupportedUsersQueryKey,
  getSupporterQueryKey,
  getSupportersQueryKey,
  getUserQueryKey,
  queryAccountUser,
  queryWalletAddresses
} from '@audius/common/api'
import { Name, SolanaWalletAddress } from '@audius/common/models'
import {
  chatActions,
  tippingSelectors,
  tippingActions,
  getContext,
  getSDK
} from '@audius/common/store'
import { isNullOrUndefined } from '@audius/common/utils'
import { AUDIO, wAUDIO } from '@audius/fixed-decimal'
import { Id } from '@audius/sdk'
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

const {
  confirmSendTip,
  convert,
  sendTipFailed,
  sendTipSucceeded,
  refreshTipGatedTracks
} = tippingActions
const { getSendTipData } = tippingSelectors

const { fetchPermissions } = chatActions

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
  const { currentUser } = yield* call(queryWalletAddresses)
  if (!currentUser) {
    throw new Error('Failed to retrieve current user wallet address')
  }

  const waudioBalanceWei = yield* call(
    [walletClient, walletClient.getCurrentWAudioBalance],
    {
      ethAddress: currentUser
    }
  )
  const audioWeiAmount = AUDIO(amount).value

  if (isNullOrUndefined(waudioBalanceWei)) {
    throw new Error('Failed to retrieve current wAudio balance')
  }

  // If transferring spl wrapped audio and there are insufficent funds with only the
  // user bank balance, transfer all eth AUDIO to spl wrapped audio
  if (audioWeiAmount > waudioBalanceWei) {
    console.info('Converting Ethereum AUDIO to Solana wAUDIO...')

    // Wait for a second before showing the notice that this might take a while
    const showConvertingMessage = yield* fork(function* () {
      yield delay(1000)
      yield put(convert())
    })
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
    // Cancel showing the notice if the conversion was magically super quick
    yield cancel(showConvertingMessage)
  }
}

function* sendTipAsync() {
  const audiusSdk = yield* getContext('audiusSdk')
  const sdk = yield* call(audiusSdk)
  const isNativeMobile = yield* getContext('isNativeMobile')

  const sender = yield* call(queryAccountUser)
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

  const senderUserId = Id.parse(sender.user_id)
  const receiverUserId = Id.parse(receiver.user_id)
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
      amount: wAUDIO(amount).value,
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

      // Trigger a refetch for all audio balances
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.audioBalance]
      })

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
      queryKey: getUserQueryKey(receiver.user_id)
    })
    queryClient.invalidateQueries({
      queryKey: getUserQueryKey(sender.user_id)
    })
    queryClient.invalidateQueries({
      queryKey: getSupportersQueryKey(receiver.user_id)
    })
    queryClient.invalidateQueries({
      queryKey: getSupporterQueryKey(receiver.user_id, sender.user_id)
    })
    queryClient.invalidateQueries({
      queryKey: getSupportedUsersQueryKey(sender.user_id)
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
