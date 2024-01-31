import {
  Name,
  Kind,
  ID,
  Supporter,
  Supporting,
  LastDismissedTip,
  User,
  StringWei,
  BNWei,
  SolanaWalletAddress
} from '@audius/common/models'
import {
  createUserBankIfNeeded,
  LocalStorage,
  GetSupportingArgs,
  GetSupportersArgs,
  GetTipsArgs
} from '@audius/common/services'
import {
  accountSelectors,
  cacheActions,
  processAndCacheUsers,
  chatActions,
  solanaSelectors,
  tippingSelectors,
  tippingActions,
  walletSelectors,
  walletActions,
  getContext,
  RefreshSupportPayloadAction
} from '@audius/common/store'
import {
  decodeHashId,
  isNullOrUndefined,
  weiToAudioString,
  stringWeiToBN,
  weiToString,
  parseAudioInputToWei,
  waitForValue,
  MAX_PROFILE_TOP_SUPPORTERS,
  SUPPORTING_PAGINATION_SIZE
} from '@audius/common/utils'
import { PayloadAction } from '@reduxjs/toolkit'
import BN from 'bn.js'
import {
  call,
  delay,
  put,
  all,
  select,
  takeEvery,
  fork,
  cancel
} from 'typed-redux-saga'

import { make } from 'common/store/analytics/actions'
import { fetchUsers } from 'common/store/cache/users/sagas'
import { waitForWrite, waitForRead } from 'utils/sagaHelpers'

const { decreaseBalance } = walletActions
const { getFeePayer } = solanaSelectors
const { getAccountBalance } = walletSelectors
const {
  confirmSendTip,
  convert,
  fetchRecentTips,
  fetchSupportingForUser,
  fetchSupportersForUser,
  refreshSupport,
  sendTipFailed,
  sendTipSucceeded,
  setTipToDisplay,
  setSupportersForUser,
  setSupportingForUser,
  setShowTip,
  setSupportingOverridesForUser,
  setSupportersOverridesForUser,
  fetchUserSupporter,
  refreshTipGatedTracks
} = tippingActions
const {
  getOptimisticSupporters,
  getOptimisticSupporting,
  getSendTipData,
  getSupporters,
  getSupporting
} = tippingSelectors
const { update } = cacheActions
const getAccountUser = accountSelectors.getAccountUser
const { fetchPermissions } = chatActions

export const FEED_TIP_DISMISSAL_TIME_LIMIT_SEC = 30 * 24 * 60 * 60 // 30 days
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

function* overrideSupportingForUser({
  amountBN,
  sender,
  receiver
}: {
  amountBN: BNWei
  sender: User
  receiver: User
}) {
  /**
   * Get supporting map for sender.
   */
  const supportingMap = yield* select(getOptimisticSupporting)
  const supportingForSender = supportingMap[sender.user_id] ?? {}

  /**
   * If sender was not previously supporting receiver, then
   * optimistically increment the sender's supporting_count
   */
  const wasNotPreviouslySupporting =
    !supportingForSender[receiver.user_id]?.amount
  if (wasNotPreviouslySupporting) {
    yield put(
      update(Kind.USERS, [
        {
          id: sender.user_id,
          metadata: { supporting_count: sender.supporting_count + 1 }
        }
      ])
    )
  }

  /**
   * Get and update the new amount the sender
   * is supporting to the receiver.
   */
  const previousSupportAmount =
    supportingForSender[receiver.user_id]?.amount ?? ('0' as StringWei)
  const newSupportAmountBN = stringWeiToBN(previousSupportAmount).add(
    amountBN
  ) as BNWei

  /**
   * Store the optimistic value.
   */
  yield put(
    setSupportingOverridesForUser({
      id: sender.user_id,
      supportingOverridesForUser: {
        [receiver.user_id]: {
          receiver_id: receiver.user_id,
          amount: weiToString(newSupportAmountBN),
          rank: -1
        }
      }
    })
  )
}

function* overrideSupportersForUser({
  amountBN,
  sender,
  receiver
}: {
  amountBN: BNWei
  sender: User
  receiver: User
}) {
  /**
   * Get supporting map for sender.
   */
  const supportersMap = yield* select(getOptimisticSupporters)
  const supportersForReceiver = supportersMap[receiver.user_id] ?? {}

  /**
   * If receiver was not previously supported by sender, then
   * optimistically increment the receiver's supporter_count
   */
  const wasNotPreviouslySupported =
    !supportersForReceiver[sender.user_id]?.amount
  if (wasNotPreviouslySupported) {
    yield put(
      update(Kind.USERS, [
        {
          id: receiver.user_id,
          metadata: { supporter_count: receiver.supporter_count + 1 }
        }
      ])
    )
  }

  /**
   * Get and update the new amount the sender
   * is supporting to the receiver.
   */
  const previousSupportAmount =
    supportersForReceiver[sender.user_id]?.amount ?? ('0' as StringWei)
  const newSupportAmountBN = stringWeiToBN(previousSupportAmount).add(
    amountBN
  ) as BNWei

  /**
   * Store the optimistic value.
   */
  yield put(
    setSupportersOverridesForUser({
      id: receiver.user_id,
      supportersOverridesForUser: {
        [sender.user_id]: {
          sender_id: sender.user_id,
          amount: weiToString(newSupportAmountBN),
          rank: -1
        }
      }
    })
  )
}

/**
 * Polls the getUserSupporter endpoint to check if the sender is listed as a supporter of the recipient
 */
function* confirmTipIndexed({
  sender,
  recipient,
  maxAttempts = 60,
  delayMs = 1000
}: {
  sender: User
  recipient: User
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
      const apiClient = yield* getContext('apiClient')
      const response = yield* call([apiClient, apiClient.getUserSupporter], {
        currentUserId: sender.user_id,
        userId: recipient.user_id,
        supporterUserId: sender.user_id
      })
      if (response) {
        console.debug('Tip indexed')
        return true
      }
    } catch (e) {
      console.error('Error confirming tip indexed: ', e)
    }
    yield* delay(delayMs)
  }
  console.error('Tip could not be confirmed as indexed')
  return false
}

function* sendTipAsync() {
  const walletClient = yield* getContext('walletClient')
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const { waitForRemoteConfig } = yield* getContext('remoteConfigInstance')
  const isNativeMobile = yield* getContext('isNativeMobile')
  const { track } = yield* getContext('analytics')
  yield call(waitForRemoteConfig)
  yield* waitForWrite()

  const device = isNativeMobile ? 'native' : 'web'

  const sender = yield* select(getAccountUser)
  if (!sender) {
    return
  }

  const sendTipData = yield* select(getSendTipData)
  const {
    user: recipient,
    amount,
    source,
    trackId,
    onSuccessConfirmedActions
  } = sendTipData
  if (!recipient) {
    return
  }

  const weiBNAmount = parseAudioInputToWei(amount) ?? (new BN('0') as BNWei)
  const recipientERCWallet = recipient.erc_wallet ?? recipient.wallet

  // Create Userbanks if needed
  const feePayerOverride = yield* select(getFeePayer)
  if (!feePayerOverride) {
    console.error("tippingSagas: unexpectedly couldn't get feePayerOverride")
    return
  }

  if (!recipientERCWallet) {
    console.error('tippingSagas: Unexpectedly missing recipient ERC wallet')
    return
  }

  // Gross cast here bc of broken saga types with `yield* all`
  const [selfUserBank, recipientUserBank] = yield* all([
    createUserBankIfNeeded(audiusBackendInstance, {
      recordAnalytics: track,
      feePayerOverride
    }),
    createUserBankIfNeeded(audiusBackendInstance, {
      recordAnalytics: track,
      feePayerOverride,
      ethAddress: recipientERCWallet
    })
  ]) as unknown as (SolanaWalletAddress | null)[]

  if (!selfUserBank || !recipientUserBank) {
    console.error(
      `Missing self or recipient userbank: ${JSON.stringify({
        selfUserBank,
        recipientUserBank
      })}`
    )

    yield put(sendTipFailed({ error: 'Could not create userbank' }))
    return
  }

  const weiBNBalance = yield* select(getAccountBalance)
  if (isNullOrUndefined(weiBNBalance)) {
    throw new Error('$AUDIO balance not yet loaded or failed to load')
  }

  if (weiBNAmount.gt(weiBNBalance)) {
    const errorMessage = 'Not enough $AUDIO'
    throw new Error(errorMessage)
  }

  try {
    yield put(
      make(Name.TIP_AUDIO_REQUEST, {
        senderWallet: selfUserBank,
        recipientWallet: recipientUserBank,
        senderHandle: sender.handle,
        recipientHandle: recipient.handle,
        amount: weiToAudioString(weiBNAmount),
        device,
        source
      })
    )

    const waudioWeiAmount = yield* call([
      walletClient,
      'getCurrentWAudioBalance'
    ])

    if (isNullOrUndefined(waudioWeiAmount)) {
      throw new Error('Failed to retrieve current wAudio balance')
    }

    // If transferring spl wrapped audio and there are insufficent funds with only the
    // user bank balance, transfer all eth AUDIO to spl wrapped audio
    if (weiBNAmount.gt(waudioWeiAmount)) {
      // Wait for a second before showing the notice that this might take a while
      const showConvertingMessage = yield* fork(function* () {
        yield delay(1000)
        yield put(convert())
      })
      yield call([walletClient, 'transferTokensFromEthToSol'])
      // Cancel showing the notice if the conversion was magically super quick
      yield cancel(showConvertingMessage)
    }

    yield call(
      [walletClient, 'sendWAudioTokens'],
      recipientUserBank,
      weiBNAmount
    )

    // Only decrease store balance if we haven't already changed
    const newBalance: ReturnType<typeof getAccountBalance> = yield* select(
      getAccountBalance
    )
    if (newBalance?.eq(weiBNBalance)) {
      yield put(decreaseBalance({ amount: weiToString(weiBNAmount) }))
    }

    yield put(sendTipSucceeded())
    yield put(
      make(Name.TIP_AUDIO_SUCCESS, {
        senderWallet: selfUserBank,
        recipientWallet: recipientUserBank,
        senderHandle: sender.handle,
        recipientHandle: recipient.handle,
        amount: weiToAudioString(weiBNAmount),
        device,
        source
      })
    )

    yield* put(refreshTipGatedTracks({ userId: recipient.user_id, trackId }))
    yield* fork(function* () {
      yield* call(confirmTipIndexed, { sender, recipient })
      yield* put(
        fetchPermissions({ userIds: [sender.user_id, recipient.user_id] })
      )
      if (onSuccessConfirmedActions) {
        // Spread here to unfreeze the action
        // Redux sagas can't "put" frozen actions
        for (const action of onSuccessConfirmedActions) {
          yield* put({ ...action })
        }
      }
      if (source === 'inboxUnavailableModal') {
        yield* put(
          make(Name.TIP_UNLOCKED_CHAT, {
            recipientUserId: recipient.user_id
          })
        )
      }
    })

    /**
     * Store optimistically updated supporting value for sender
     * and supporter value for receiver.
     */
    try {
      yield call(overrideSupportingForUser, {
        amountBN: weiBNAmount,
        sender,
        receiver: recipient
      })
      yield call(overrideSupportersForUser, {
        amountBN: weiBNAmount,
        sender,
        receiver: recipient
      })
    } catch (e) {
      console.error(
        `Could not optimistically update support: ${(e as Error).message}`
      )
    }
  } catch (e) {
    const error = (e as Error).message
    console.error(`Send tip failed: ${error}`)
    yield put(sendTipFailed({ error }))
    yield put(
      make(Name.TIP_AUDIO_FAILURE, {
        senderWallet: selfUserBank,
        recipientWallet: recipientUserBank,
        senderHandle: sender.handle,
        recipientHandle: recipient.handle,
        amount: weiToAudioString(weiBNAmount),
        error,
        device,
        source
      })
    )
  }
}

function* refreshSupportAsync({
  payload: { senderUserId, receiverUserId, supportingLimit, supportersLimit }
}: {
  payload: RefreshSupportPayloadAction
  type: string
}) {
  yield* waitForRead()
  const apiClient = yield* getContext('apiClient')

  const supportingParams: GetSupportingArgs = {
    userId: senderUserId
  }
  if (supportingLimit) {
    supportingParams.limit = supportingLimit
  } else {
    const account = yield* select(getAccountUser)
    supportingParams.limit =
      account?.user_id === senderUserId
        ? account?.supporting_count
        : SUPPORTING_PAGINATION_SIZE
  }

  const supportersParams: GetSupportersArgs = {
    userId: receiverUserId
  }
  if (supportersLimit) {
    supportersParams.limit = supportersLimit
  }

  const supportingForSenderList = yield* call(
    [apiClient, apiClient.getSupporting],
    supportingParams
  )
  const supportersForReceiverList = yield* call(
    [apiClient, apiClient.getSupporters],
    supportersParams
  )

  const userIds = [
    ...(supportingForSenderList || []).map((supporting) =>
      decodeHashId(supporting.receiver.id)
    ),
    ...(supportersForReceiverList || []).map((supporter) =>
      decodeHashId(supporter.sender.id)
    )
  ].filter(removeNullable)

  yield call(fetchUsers, userIds)

  const supportingForSenderMap: Record<string, Supporting> = {}
  ;(supportingForSenderList || []).forEach((supporting) => {
    const supportingUserId = decodeHashId(supporting.receiver.id)
    if (supportingUserId) {
      supportingForSenderMap[supportingUserId] = {
        receiver_id: supportingUserId,
        rank: supporting.rank,
        amount: supporting.amount
      }
    }
  })
  const supportersForReceiverMap: Record<string, Supporter> = {}
  ;(supportersForReceiverList || []).forEach((supporter) => {
    const supporterUserId = decodeHashId(supporter.sender.id)
    if (supporterUserId) {
      supportersForReceiverMap[supporterUserId] = {
        sender_id: supporterUserId,
        rank: supporter.rank,
        amount: supporter.amount
      }
    }
  })

  yield put(
    setSupportingForUser({
      id: senderUserId,
      supportingForUser: supportingForSenderMap
    })
  )
  yield put(
    setSupportersForUser({
      id: receiverUserId,
      supportersForUser: supportersForReceiverMap
    })
  )
}

type FetchSupportingAction = PayloadAction<{ userId: ID }>

function* fetchSupportersForUserAsync(action: FetchSupportingAction) {
  const {
    payload: { userId }
  } = action
  yield* waitForRead()
  const apiClient = yield* getContext('apiClient')

  const supportersParams: GetSupportersArgs = {
    userId,
    limit: MAX_PROFILE_TOP_SUPPORTERS + 1
  }

  const supportersForReceiverList = yield* call(
    [apiClient, apiClient.getSupporters],
    supportersParams
  )

  const userIds = supportersForReceiverList
    ?.map((supporter) => decodeHashId(supporter.sender.id))
    .filter(removeNullable)
  if (!userIds) return
  yield call(fetchUsers, userIds)

  const supportersForReceiverMap: Record<string, Supporter> = {}

  supportersForReceiverList?.forEach((supporter) => {
    const supporterUserId = decodeHashId(supporter.sender.id)
    if (supporterUserId) {
      supportersForReceiverMap[supporterUserId] = {
        sender_id: supporterUserId,
        rank: supporter.rank,
        amount: supporter.amount
      }
    }
  })

  yield put(
    setSupportersForUser({
      id: userId,
      supportersForUser: supportersForReceiverMap
    })
  )
}

function* fetchSupportingForUserAsync({
  payload: { userId }
}: {
  payload: { userId: ID }
  type: string
}) {
  yield* waitForRead()
  const apiClient = yield* getContext('apiClient')

  /**
   * If the user id is that of the logged in user, then
   * get all its supporting data so that when the logged in
   * user is trying to tip an artist, we'll know whether or
   * not that artist is already being supported by the logged in
   * user and thus correctly calculate how much more audio to tip
   * to become the top supporter.
   */
  const account = yield* select(getAccountUser)
  const limit =
    account?.user_id === userId
      ? account.supporting_count
      : SUPPORTING_PAGINATION_SIZE
  const supportingList = yield* call([apiClient, apiClient.getSupporting], {
    userId,
    limit
  })
  const userIds =
    supportingList
      ?.map((supporting) => decodeHashId(supporting.receiver.id))
      .filter(removeNullable) ?? []

  yield call(fetchUsers, userIds)

  const map: Record<string, Supporting> = {}
  supportingList?.forEach((supporting) => {
    const supportingUserId = decodeHashId(supporting.receiver.id)
    if (supportingUserId) {
      map[supportingUserId] = {
        receiver_id: supportingUserId,
        rank: supporting.rank,
        amount: supporting.amount
      }
    }
  })

  yield put(
    setSupportingForUser({
      id: userId,
      supportingForUser: map
    })
  )
}

// Display logic is a bit nuanced here -
// there are 3 cases: 1 tip not dismissed, show tip,  2 tip dismissed, but show new tip, 3 tip dismissed, don't show any tip
// the trick is to start with an empty state, NOT a loading state:
// in case 1, we detect no/expired local storage and show loading state
// in case 2, we initally show nothing and then directly snap to the tip tile, with no loading state, to avoid 3 states.
// in case 3, we never show anything
function* fetchRecentTipsAsync() {
  const apiClient = yield* getContext('apiClient')
  const localStorage = yield* getContext('localStorage')

  const account: User = yield* call(waitForValue, getAccountUser)

  // Get dismissal info
  const lastDismissedTip = yield* call(() =>
    localStorage.getExpiringJSONValue<LastDismissedTip>(DISMISSED_TIP_KEY)
  )
  // If no dismissal, show loading state
  if (!lastDismissedTip) {
    yield put(setShowTip({ show: true }))
  }

  const params: GetTipsArgs = {
    userId: account.user_id,
    currentUserFollows: 'receiver',
    uniqueBy: 'receiver',
    limit: 1
  }

  const userTips = yield* call([apiClient, apiClient.getTips], params)

  if (!(userTips && userTips.length)) {
    yield put(setShowTip({ show: false }))
    return
  }

  const recentTip = {
    ...userTips[0],
    sender_id: userTips[0].sender.user_id,
    receiver_id: userTips[0].receiver.user_id
  }

  // If there exists a non-expired tip dismissal
  // and the receiver is same as current receiver, don't show the same tip
  if (lastDismissedTip?.receiver_id === recentTip.receiver_id) {
    yield put(setShowTip({ show: false }))
    return
  }

  // Otherwise, we're going to show a tip so clear out any dismissed tip state
  yield* call(() => localStorage.removeItem(DISMISSED_TIP_KEY))

  yield call(processAndCacheUsers, [recentTip.sender, recentTip.receiver])

  // Hack: no longer showing followee supporters, too slow
  // const userIds = [...new Set([...recentTip.followee_supporter_ids])]
  // yield call(fetchUsers, userIds)

  /**
   * We need to get supporting data for logged in user and
   * supporters data for followee that logged in user may
   * send a tip to.
   * This is so that we know if and how much the logged in
   * user has already tipped the followee, and also whether or
   * not the logged in user is the top supporter for the
   * followee.
   */
  yield put(
    refreshSupport({
      senderUserId: account.user_id,
      receiverUserId: recentTip.receiver_id,
      supportingLimit: account.supporting_count,
      supportersLimit: MAX_PROFILE_TOP_SUPPORTERS + 1
    })
  )

  yield all([
    put(setShowTip({ show: true })),
    put(setTipToDisplay({ tipToDisplay: recentTip }))
  ])
}

function* fetchUserSupporterAsync(
  action: ReturnType<typeof fetchUserSupporter>
) {
  const { currentUserId, userId, supporterUserId } = action.payload
  const apiClient = yield* getContext('apiClient')
  try {
    const response = yield* call([apiClient, apiClient.getUserSupporter], {
      currentUserId,
      userId,
      supporterUserId
    })
    if (response) {
      const supportingMap = yield* select(getSupporting)
      yield put(
        setSupportingForUser({
          id: supporterUserId,
          supportingForUser: {
            ...supportingMap[supporterUserId],
            [userId]: {
              receiver_id: userId,
              amount: response.amount,
              rank: response.rank
            }
          }
        })
      )

      const supportersMap = yield* select(getSupporters)
      yield put(
        setSupportersForUser({
          id: userId,
          supportersForUser: {
            ...supportersMap[userId],
            [supporterUserId]: {
              sender_id: supporterUserId,
              amount: response.amount,
              rank: response.rank
            }
          }
        })
      )
    }
  } catch (e) {
    console.error(
      `Could not fetch user supporter for user id ${userId}, supporter user id ${supporterUserId}, and current user id ${currentUserId}: ${
        (e as Error).message
      }`
    )
  }
}

function* watchFetchSupportingForUser() {
  yield* takeEvery(fetchSupportingForUser.type, fetchSupportingForUserAsync)
}

function* watchFetchSupportersForUser() {
  yield takeEvery(fetchSupportersForUser.type, fetchSupportersForUserAsync)
}

function* watchRefreshSupport() {
  yield* takeEvery(refreshSupport.type, refreshSupportAsync)
}

function* watchConfirmSendTip() {
  yield* takeEvery(confirmSendTip.type, sendTipAsync)
}

function* watchFetchRecentTips() {
  yield* takeEvery(fetchRecentTips.type, fetchRecentTipsAsync)
}

function* watchFetchUserSupporter() {
  yield takeEvery(fetchUserSupporter.type, fetchUserSupporterAsync)
}

const sagas = () => {
  return [
    watchFetchSupportingForUser,
    watchFetchSupportersForUser,
    watchRefreshSupport,
    watchConfirmSendTip,
    watchFetchRecentTips,
    watchFetchUserSupporter
  ]
}

export default sagas
