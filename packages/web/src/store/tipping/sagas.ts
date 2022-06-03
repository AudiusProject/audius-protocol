import BN from 'bn.js'
import { call, put, select, takeEvery } from 'typed-redux-saga/macro'

import { Name } from 'common/models/Analytics'
import { ID } from 'common/models/Identifiers'
import { Supporter, Supporting, UserTip } from 'common/models/Tipping'
import { User } from 'common/models/User'
import { BNWei, StringWei } from 'common/models/Wallet'
import { FeatureFlags } from 'common/services/remote-config'
import { getAccountUser } from 'common/store/account/selectors'
import { fetchUsers } from 'common/store/cache/users/sagas'
import {
  getOptimisticSupporters,
  getOptimisticSupporting,
  getSendTipData
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
  setSupportersOverridesForUser
} from 'common/store/tipping/slice'
import { getAccountBalance } from 'common/store/wallet/selectors'
import { decreaseBalance } from 'common/store/wallet/slice'
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
import { remoteConfigInstance } from 'services/remote-config/remote-config-instance'
import walletClient from 'services/wallet-client/WalletClient'
import { make } from 'store/analytics/actions'
import {
  MAX_ARTIST_HOVER_TOP_SUPPORTING,
  MAX_PROFILE_TOP_SUPPORTERS
} from 'utils/constants'
import { decodeHashId, encodeHashId } from 'utils/route/hashIds'

import { getMinSlotForRecentTips, checkTipToDisplay } from './storageUtils'

const { getFeatureEnabled, waitForRemoteConfig } = remoteConfigInstance

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
  yield call(waitForRemoteConfig)
  const isTippingEnabled = getFeatureEnabled(FeatureFlags.TIPPING_ENABLED)
  if (!isTippingEnabled) {
    return
  }

  const sender = yield* select(getAccountUser)
  if (!sender) {
    return
  }

  const sendTipData = yield* select(getSendTipData)
  const { user: recipient, amount } = sendTipData
  if (!recipient) {
    return
  }

  const weiBNAmount = parseAudioInputToWei(amount) ?? (new BN('0') as BNWei)
  const recipientWallet = recipient.spl_wallet
  const weiBNBalance: BNWei = yield select(getAccountBalance) ??
    (new BN('0') as BNWei)
  const waudioWeiAmount = yield* call(walletClient.getCurrentWAudioBalance)

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
        amount: weiToAudioString(weiBNAmount)
      })
    )
    // If transferring spl wrapped audio and there are insufficent funds with only the
    // user bank balance, transfer all eth AUDIO to spl wrapped audio
    if (weiBNAmount.gt(waudioWeiAmount)) {
      yield put(convert())
      yield call(walletClient.transferTokensFromEthToSol)
    }

    yield call(() =>
      walletClient.sendWAudioTokens(recipientWallet, weiBNAmount)
    )

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
        amount: weiToAudioString(weiBNAmount)
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
        error
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
      ...supportingForSenderList.map(supporting =>
        decodeHashId(supporting.receiver.id)
      ),
      ...supportersForReceiverList.map(supporter =>
        decodeHashId(supporter.sender.id)
      )
    ]

    yield call(fetchUsers, userIds, new Set(), true)

    const supportingForSenderMap: Record<string, Supporting> = {}
    supportingForSenderList.forEach(supporting => {
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
    supportersForReceiverList.forEach(supporter => {
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
  const userIds = supportingList.map(supporting =>
    decodeHashId(supporting.receiver.id)
  )

  yield call(fetchUsers, userIds, new Set(), true)

  const map: Record<string, Supporting> = {}
  supportingList.forEach(supporting => {
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

function* fetchRecentTipsAsync() {
  const account = yield* select(getAccountUser)
  if (!account) {
    return
  }

  const encodedUserId = encodeHashId(account.user_id)
  if (!encodedUserId) {
    return
  }

  const params: UserTipRequest = {
    userId: encodedUserId,
    currentUserFollows: 'receiver',
    uniqueBy: 'receiver'
  }
  const minSlot = getMinSlotForRecentTips()
  if (minSlot) {
    params.minSlot = minSlot
  }

  const userTips = yield* call(fetchRecentUserTips, params)

  const recentTips = userTips
    .map(userTip => {
      const senderId = decodeHashId(userTip.sender.id)
      const receiverId = decodeHashId(userTip.receiver.id)
      if (!senderId || !receiverId) {
        return null
      }

      const followeeSupporterIds = userTip.followee_supporters
        .map(followee_supporter => decodeHashId(followee_supporter.id))
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

  const tipToDisplay = checkTipToDisplay({
    userId: account.user_id,
    recentTips
  })
  if (tipToDisplay) {
    const userIds = [
      ...new Set([
        tipToDisplay.sender_id,
        tipToDisplay.receiver_id,
        ...tipToDisplay.followee_supporter_ids
      ])
    ]
    yield call(fetchUsers, userIds, new Set(), true)

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

const sagas = () => {
  return [
    watchFetchSupportingForUser,
    watchRefreshSupport,
    watchConfirmSendTip,
    watchFetchRecentTips
  ]
}

export default sagas
