import {
  transformAndCleanList,
  userTipWithUsersFromSDK
} from '@audius/common/adapters'
import {
  Name,
  Kind,
  ID,
  LastDismissedTip,
  User,
  StringWei,
  BNWei,
  Id,
  OptionalId,
  supportedUserMetadataListFromSDK,
  supporterMetadataListFromSDK,
  supporterMetadataFromSDK
} from '@audius/common/models'
import { LocalStorage } from '@audius/common/services'
import {
  accountSelectors,
  cacheActions,
  processAndCacheUsers,
  chatActions,
  tippingSelectors,
  tippingActions,
  walletActions,
  getContext,
  RefreshSupportPayloadAction,
  getSDK,
  tippingUtils
} from '@audius/common/store'
import {
  isNullOrUndefined,
  stringWeiToBN,
  weiToString,
  waitForValue,
  MAX_PROFILE_TOP_SUPPORTERS,
  SUPPORTING_PAGINATION_SIZE,
  removeNullable,
  encodeHashId
} from '@audius/common/utils'
import { AUDIO } from '@audius/fixed-decimal'
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
import { reportToSentry } from 'store/errors/reportToSentry'
import { waitForRead } from 'utils/sagaHelpers'

const { getBalance } = walletActions
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
const { getAccountUser, getUserId, getWalletAddresses } = accountSelectors
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
  const sdk = yield* getSDK()
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
    yield call([walletClient, walletClient.transferTokensFromEthToSol], { sdk })
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

  try {
    yield put(
      make(Name.TIP_AUDIO_REQUEST, {
        senderWallet: sender.userBank,
        recipientWallet: receiver.userBank,
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

    // Store optimistically updated supporting value for sender
    // and supporter value for receiver.
    const amountBN = new BN(AUDIO(amount).value.toString()) as BNWei
    try {
      yield call(overrideSupportingForUser, {
        amountBN,
        sender,
        receiver
      })
      yield call(overrideSupportersForUser, {
        amountBN,
        sender,
        receiver
      })
    } catch (e) {
      console.error(
        `Could not optimistically update support: ${(e as Error).message}`
      )
    }
  } catch (error) {
    const e = error instanceof Error ? error : new Error(String(error))
    console.error(`Send tip failed`, error)
    yield* put(sendTipFailed({ error: e.message }))
    yield* put(
      make(Name.TIP_AUDIO_FAILURE, {
        senderWallet: sender.userBank,
        recipientWallet: receiver.userBank,
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

function* refreshSupportAsync({
  payload: {
    senderUserId,
    receiverUserId,
    supportingLimit: supportingLimitArg,
    supportersLimit
  }
}: {
  payload: RefreshSupportPayloadAction
  type: string
}) {
  yield* waitForRead()
  const sdk = yield* getSDK()
  const currentUserId = yield* select(getUserId)

  let supportingLimit = supportingLimitArg

  if (!supportingLimit) {
    const account = yield* select(getAccountUser)
    supportingLimit =
      account?.user_id === senderUserId
        ? account?.supporting_count
        : SUPPORTING_PAGINATION_SIZE
  }

  const { data: supportingData = [] } = yield* call(
    [sdk.full.users, sdk.full.users.getSupportedUsers],
    {
      id: Id.parse(senderUserId),
      userId: OptionalId.parse(currentUserId),
      limit: supportingLimit
    }
  )
  const supportingForSenderList =
    supportedUserMetadataListFromSDK(supportingData)

  const { data: supporterData = [] } = yield* call(
    [sdk.full.users, sdk.full.users.getSupporters],
    {
      id: Id.parse(receiverUserId),
      limit: supportersLimit,
      userId: OptionalId.parse(currentUserId)
    }
  )
  const supportersForReceiverList = supporterMetadataListFromSDK(supporterData)

  const userIds = [
    ...supportingForSenderList.map((supporting) => supporting.receiver.user_id),
    ...supportersForReceiverList.map((supporter) => supporter.sender.user_id)
  ].filter(removeNullable)

  yield call(fetchUsers, userIds)

  const supportingForSenderMap = tippingUtils.makeSupportingMapForUser(
    supportingForSenderList
  )
  const supportersForReceiverMap = tippingUtils.makeSupportersMapForUser(
    supportersForReceiverList
  )

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
  const sdk = yield* getSDK()
  const currentUserId = yield* select(getUserId)

  const { data = [] } = yield* call(
    [sdk.full.users, sdk.full.users.getSupporters],
    {
      id: Id.parse(userId),
      limit: MAX_PROFILE_TOP_SUPPORTERS + 1,
      userId: OptionalId.parse(currentUserId)
    }
  )
  const supportersForReceiverList = supporterMetadataListFromSDK(data)

  const userIds = supportersForReceiverList.map(
    (supporter) => supporter.sender.user_id
  )
  if (!userIds) return
  yield call(fetchUsers, userIds)

  const supportersForReceiverMap = tippingUtils.makeSupportersMapForUser(
    supportersForReceiverList
  )

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
  const sdk = yield* getSDK()
  const currentUserId = yield* select(getUserId)

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

  const { data = [] } = yield* call(
    [sdk.full.users, sdk.full.users.getSupportedUsers],
    {
      id: Id.parse(userId),
      limit,
      userId: OptionalId.parse(currentUserId)
    }
  )
  const supportingList = supportedUserMetadataListFromSDK(data)

  const userIds = supportingList.map(
    (supporting) => supporting.receiver.user_id
  )

  yield call(fetchUsers, userIds)

  const map = tippingUtils.makeSupportingMapForUser(supportingList)

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
  const sdk = yield* getSDK()
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

  const { data = [] } = yield* call([sdk.full.tips, sdk.full.tips.getTips], {
    userId: Id.parse(account.user_id),
    limit: 1,
    currentUserFollows: 'receiver',
    uniqueBy: 'receiver'
  })

  const userTips = transformAndCleanList(data, userTipWithUsersFromSDK)

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
  const sdk = yield* getSDK()
  try {
    const { data } = yield* call(
      [sdk.full.users, sdk.full.users.getSupporter],
      {
        id: Id.parse(userId),
        supporterUserId: Id.parse(supporterUserId),
        userId: OptionalId.parse(currentUserId)
      }
    )

    if (!data) {
      return
    }

    const supporter = supporterMetadataFromSDK(data)

    if (supporter) {
      const supportingMap = yield* select(getSupporting)
      yield put(
        setSupportingForUser({
          id: supporterUserId,
          supportingForUser: {
            ...supportingMap[supporterUserId],
            [userId]: {
              receiver_id: userId,
              amount: supporter.amount,
              rank: supporter.rank
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
              amount: supporter.amount,
              rank: supporter.rank
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
