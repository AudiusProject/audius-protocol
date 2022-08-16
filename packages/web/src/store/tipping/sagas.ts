import {
  Kind,
  ID,
  Name,
  RecentTipsStorage,
  Supporter,
  Supporting,
  UserTip,
  User,
  BNWei,
  StringWei,
  Nullable
} from '@audius/common'
import BN from 'bn.js'
import {
  call,
  delay,
  put,
  select,
  takeEvery,
  fork,
  cancel
} from 'typed-redux-saga/macro'

import { getContext } from 'common/store'
import { getAccountUser } from 'common/store/account/selectors'
import { update } from 'common/store/cache/actions'
import { fetchUsers } from 'common/store/cache/users/sagas'
import {
  getOptimisticSupporters,
  getOptimisticSupporting,
  getSendTipData,
  getSupporters,
  getSupporting
} from 'common/store/tipping/selectors'
import {
  confirmSendTip,
  convert,
  fetchRecentTips,
  fetchSupportingForUser,
  refreshSupport,
  RefreshSupportPayloadAction,
  sendTipFailed,
  sendTipSucceeded,
  setTipToDisplay,
  setRecentTips,
  setSupportersForUser,
  setSupportingForUser,
  hideTip,
  setSupportingOverridesForUser,
  setSupportersOverridesForUser,
  fetchUserSupporter
} from 'common/store/tipping/slice'
import { getAccountBalance } from 'common/store/wallet/selectors'
import { decreaseBalance } from 'common/store/wallet/slice'
import { decodeHashId, encodeHashId } from 'common/utils/hashIds'
import {
  parseAudioInputToWei,
  stringWeiToBN,
  weiToAudioString,
  weiToString
} from 'common/utils/wallet'
import {
  fetchRecentUserTips,
  fetchSupporters,
  fetchSupporting,
  SupportRequest,
  UserTipRequest
} from 'services/audius-backend/Tipping'
import { UpdateTipsStorageMessage } from 'services/native-mobile-interface/tipping'
import { make } from 'store/analytics/actions'
import mobileSagas from 'store/tipping/mobileSagas'
import {
  FEED_TIP_DISMISSAL_TIME_LIMIT,
  MAX_ARTIST_HOVER_TOP_SUPPORTING,
  MAX_PROFILE_TOP_SUPPORTERS
} from 'utils/constants'
import { waitForAccount, waitForValue } from 'utils/sagaHelpers'

import { updateTipsStorage } from './storageUtils'

const NATIVE_MOBILE = process.env.REACT_APP_NATIVE_MOBILE

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

function* sendTipAsync() {
  const walletClient = yield* getContext('walletClient')
  const { waitForRemoteConfig } = yield* getContext('remoteConfigInstance')
  yield call(waitForRemoteConfig)
  yield* waitForAccount()

  const sender = yield* select(getAccountUser)
  if (!sender) {
    return
  }

  const sendTipData = yield* select(getSendTipData)
  const { user: recipient, amount, source } = sendTipData
  if (!recipient) {
    return
  }

  const weiBNAmount = parseAudioInputToWei(amount) ?? (new BN('0') as BNWei)
  const recipientWallet = recipient.spl_wallet
  const weiBNBalance: BNWei = yield select(getAccountBalance) ??
    (new BN('0') as BNWei)
  const waudioWeiAmount = yield* call([walletClient, 'getCurrentWAudioBalance'])

  if (weiBNAmount.gt(weiBNBalance)) {
    const errorMessage = 'Not enough $AUDIO'
    throw new Error(errorMessage)
  }

  try {
    yield put(
      make(Name.TIP_AUDIO_REQUEST, {
        senderWallet: sender.spl_wallet,
        recipientWallet,
        senderHandle: sender.handle,
        recipientHandle: recipient.handle,
        amount: weiToAudioString(weiBNAmount),
        device: NATIVE_MOBILE ? 'native' : 'web',
        source
      })
    )
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

    yield call([walletClient, 'sendWAudioTokens'], recipientWallet, weiBNAmount)

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
        senderWallet: sender.spl_wallet,
        recipientWallet,
        senderHandle: sender.handle,
        recipientHandle: recipient.handle,
        amount: weiToAudioString(weiBNAmount),
        device: NATIVE_MOBILE ? 'native' : 'web',
        source
      })
    )

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
        senderWallet: sender.spl_wallet,
        recipientWallet,
        senderHandle: sender.handle,
        recipientHandle: recipient.handle,
        amount: weiToAudioString(weiBNAmount),
        error,
        device: NATIVE_MOBILE ? 'native' : 'web',
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
  const encodedSenderUserId = encodeHashId(senderUserId)
  const encodedReceiverUserId = encodeHashId(receiverUserId)

  if (encodedSenderUserId && encodedReceiverUserId) {
    const supportingParams: SupportRequest = {
      encodedUserId: encodedSenderUserId
    }
    if (supportingLimit) {
      supportingParams.limit = supportingLimit
    } else {
      yield* waitForAccount()
      const account = yield* select(getAccountUser)
      supportingParams.limit =
        account?.user_id === senderUserId
          ? account.supporting_count
          : MAX_ARTIST_HOVER_TOP_SUPPORTING + 1
    }

    const supportersParams: SupportRequest = {
      encodedUserId: encodedReceiverUserId
    }
    if (supportersLimit) {
      supportersParams.limit = supportersLimit
    }

    const supportingForSenderList = yield* call(
      fetchSupporting,
      supportingParams
    )
    const supportersForReceiverList = yield* call(
      fetchSupporters,
      supportersParams
    )

    const userIds = [
      ...supportingForSenderList.map((supporting) =>
        decodeHashId(supporting.receiver.id)
      ),
      ...supportersForReceiverList.map((supporter) =>
        decodeHashId(supporter.sender.id)
      )
    ]

    yield call(fetchUsers, userIds)

    const supportingForSenderMap: Record<string, Supporting> = {}
    supportingForSenderList.forEach((supporting) => {
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
    supportersForReceiverList.forEach((supporter) => {
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
}

function* fetchSupportingForUserAsync({
  payload: { userId }
}: {
  payload: { userId: ID }
  type: string
}) {
  const encodedUserId = encodeHashId(userId)
  if (!encodedUserId) {
    return
  }

  yield* waitForAccount()
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
      : MAX_ARTIST_HOVER_TOP_SUPPORTING + 1
  const supportingList = yield* call(fetchSupporting, {
    encodedUserId,
    limit
  })
  const userIds = supportingList.map((supporting) =>
    decodeHashId(supporting.receiver.id)
  )

  yield call(fetchUsers, userIds)

  const map: Record<string, Supporting> = {}
  supportingList.forEach((supporting) => {
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

type CheckTipToDisplayResponse = {
  tip: UserTip
  newStorage: RecentTipsStorage
}

export const checkTipToDisplay = ({
  storage,
  userId,
  recentTips
}: {
  storage: Nullable<RecentTipsStorage>
  userId: ID
  recentTips: UserTip[]
}): Nullable<CheckTipToDisplayResponse> => {
  if (recentTips.length === 0) {
    return null
  }

  /**
   * The list only comprises of recent tips.
   * Sort the tips by least recent to parse through oldest tips first.
   */
  const sortedTips = recentTips.sort((tip1, tip2) => tip1.slot - tip2.slot)

  /**
   * Return oldest of the recent tips if nothing in local storage.
   * Also set local storage values.
   */
  if (!storage) {
    const oldestValidTip = sortedTips[0]
    return {
      tip: oldestValidTip,
      newStorage: {
        minSlot: oldestValidTip.slot,
        dismissed: false,
        lastDismissalTimestamp: null
      }
    }
  }

  /**
   * Look for oldest of the recent tips that was performed by
   * the currently logged in user.
   * If not found, then look for oldest of the recent tips in general.
   */
  let validTips = sortedTips.filter((tip) => tip.slot > storage.minSlot)
  let ownTip = validTips.find((tip) => tip.sender_id === userId)
  if (ownTip) {
    return {
      tip: ownTip,
      newStorage: {
        minSlot: ownTip.slot,
        dismissed: false,
        lastDismissalTimestamp: null
      }
    }
  }

  let oldestValidTip = validTips.length > 0 ? validTips[0] : null
  if (oldestValidTip) {
    return {
      tip: oldestValidTip,
      newStorage: {
        minSlot: oldestValidTip.slot,
        dismissed: false,
        lastDismissalTimestamp: null
      }
    }
  }

  /**
   * If user tip dismissal is too old, or if user never did not
   * dismiss the tip, and given that we have not found a recent
   * tip, look for a tip as recent as that which the user last saw
   * and prefer displaying a tip that was performed by user.
   */
  if (
    (storage.dismissed &&
      storage.lastDismissalTimestamp &&
      Date.now() - storage.lastDismissalTimestamp >
        FEED_TIP_DISMISSAL_TIME_LIMIT) ||
    !storage.dismissed
  ) {
    validTips = sortedTips.filter((tip) => tip.slot === storage.minSlot)
    ownTip = validTips.find((tip) => tip.sender_id === userId)
    if (ownTip) {
      return {
        tip: ownTip,
        newStorage: {
          minSlot: ownTip.slot,
          dismissed: false,
          lastDismissalTimestamp: null
        }
      }
    }

    oldestValidTip = validTips.length > 0 ? validTips[0] : null
    if (oldestValidTip) {
      return {
        tip: oldestValidTip,
        newStorage: {
          minSlot: oldestValidTip.slot,
          dismissed: false,
          lastDismissalTimestamp: null
        }
      }
    }

    /**
     * Should never reach here because that would mean that
     * there was previously a tip at some slot, and somehow later
     * there were no tips at an equal or more recent slot
     */
    console.error(
      `Error checking for tip to display (should not have reached here): ${{
        storage,
        userId,
        recentTips
      }}`
    )
    return null
  }

  return null
}

function* fetchRecentTipsAsync(action: ReturnType<typeof fetchRecentTips>) {
  const { storage } = action.payload
  const minSlot = storage?.minSlot ?? null

  const account: User = yield* call(waitForValue, getAccountUser)

  const encodedUserId = encodeHashId(account.user_id)
  if (!encodedUserId) {
    return
  }

  const params: UserTipRequest = {
    userId: encodedUserId,
    currentUserFollows: 'receiver',
    uniqueBy: 'receiver'
  }
  if (minSlot) {
    params.minSlot = minSlot
  }

  const userTips = yield* call(fetchRecentUserTips, params)

  const recentTips = userTips
    .map((userTip) => {
      const senderId = decodeHashId(userTip.sender.id)
      const receiverId = decodeHashId(userTip.receiver.id)
      if (!senderId || !receiverId) {
        return null
      }

      const followeeSupporterIds = userTip.followee_supporters
        .map((followee_supporter) => decodeHashId(followee_supporter.id))
        .filter((id): id is ID => !!id)

      const { amount, slot, created_at, tx_signature } = userTip

      return {
        amount,
        sender_id: senderId,
        receiver_id: receiverId,
        followee_supporter_ids: followeeSupporterIds,
        slot,
        created_at,
        tx_signature
      }
    })
    .filter((userTip): userTip is UserTip => !!userTip)

  const result = yield* call(checkTipToDisplay, {
    storage,
    userId: account.user_id,
    recentTips
  })
  const { tip: tipToDisplay, newStorage } = result ?? {}
  if (newStorage) {
    if (NATIVE_MOBILE) {
      const message = new UpdateTipsStorageMessage(newStorage)
      message.send()
    } else {
      updateTipsStorage(newStorage)
    }
  }
  if (tipToDisplay) {
    const userIds = [
      ...new Set([
        tipToDisplay.sender_id,
        tipToDisplay.receiver_id,
        ...tipToDisplay.followee_supporter_ids
      ])
    ]
    yield call(fetchUsers, userIds)

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
        receiverUserId: tipToDisplay.receiver_id,
        supportingLimit: account.supporting_count,
        supportersLimit: MAX_PROFILE_TOP_SUPPORTERS + 1
      })
    )
    yield put(setTipToDisplay({ tipToDisplay }))
  } else {
    yield put(hideTip())
  }
  yield put(setRecentTips({ recentTips }))
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
  const sagas = [
    watchFetchSupportingForUser,
    watchRefreshSupport,
    watchConfirmSendTip,
    watchFetchRecentTips,
    watchFetchUserSupporter
  ]
  return NATIVE_MOBILE ? sagas.concat(mobileSagas()) : sagas
}

export default sagas
