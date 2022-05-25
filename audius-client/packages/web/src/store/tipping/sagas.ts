import BN from 'bn.js'
import { call, put, select, takeEvery } from 'typed-redux-saga/macro'

import { Name } from 'common/models/Analytics'
import { ID } from 'common/models/Identifiers'
import { Supporter, Supporting, UserTip } from 'common/models/Tipping'
import { BNWei } from 'common/models/Wallet'
import { FeatureFlags } from 'common/services/remote-config'
import { getAccountUser } from 'common/store/account/selectors'
import { fetchUsers } from 'common/store/cache/users/sagas'
import { getSendTipData } from 'common/store/tipping/selectors'
import {
  confirmSendTip,
  convert,
  fetchRecentTips,
  fetchSupportersForUser,
  fetchSupportingForUser,
  refreshSupport,
  RefreshSupportPayloadAction,
  sendTipFailed,
  sendTipSucceeded,
  setRecentTip,
  setRecentTips,
  setSupportersForUser,
  setSupportingForUser
} from 'common/store/tipping/slice'
import { getAccountBalance } from 'common/store/wallet/selectors'
import { decreaseBalance } from 'common/store/wallet/slice'
import { weiToAudioString, weiToString } from 'common/utils/wallet'
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
import { MAX_ARTIST_HOVER_TOP_SUPPORTING } from 'utils/constants'
import { decodeHashId, encodeHashId } from 'utils/route/hashIds'

import { getMinSlotForRecentTips, checkTipToDisplay } from './utils'

const { getFeatureEnabled, waitForRemoteConfig } = remoteConfigInstance

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
  const { user: recipient, amount: weiBNAmount } = sendTipData
  if (!recipient) {
    return
  }

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
     * Refresh the supporting list for sender
     * and the supporters list for the receiver
     */
    yield put(
      refreshSupport({
        senderUserId: sender.user_id,
        receiverUserId: recipient.user_id
      })
    )
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

    // todo: should maybe poll here if right after successful tipping?
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

  // todo: need to also get whether logged in user is supporting this user
  // so that we can have correct 'become top supporter' logic
  // as-is, cannot rely on response because of pagination
  const supportingList = yield* call(fetchSupporting, {
    encodedUserId,
    limit: MAX_ARTIST_HOVER_TOP_SUPPORTING + 1
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

function* fetchSupportersForUserAsync({
  payload: { userId }
}: {
  payload: { userId: ID }
  type: string
}) {
  const encodedUserId = encodeHashId(userId)
  if (!encodedUserId) {
    return
  }

  // todo: need to also get whether this user is supported by logged in user
  // so that we can have correct 'become top supporter' logic
  // as-is, cannot rely on response because of pagination
  const supporters = yield* call(fetchSupporters, {
    encodedUserId
  })
  const userIds = supporters.map(supporter => decodeHashId(supporter.sender.id))

  yield call(fetchUsers, userIds, new Set(), true)

  const map: Record<string, Supporter> = {}
  supporters.forEach(supporter => {
    const supporterUserId = decodeHashId(supporter.sender.id)
    if (supporterUserId) {
      map[supporterUserId] = {
        sender_id: supporterUserId,
        rank: supporter.rank,
        amount: supporter.amount
      }
    }
  })

  yield put(
    setSupportersForUser({
      id: userId,
      supportersForUser: map
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
    yield put(
      refreshSupport({
        senderUserId: account.user_id,
        receiverUserId: tipToDisplay.receiver_id
      })
    )
    yield put(setRecentTip({ tipToDisplay }))
  }
  yield put(setRecentTips({ recentTips }))
}

function* watchFetchSupportingForUser() {
  yield* takeEvery(fetchSupportingForUser.type, fetchSupportingForUserAsync)
}

function* watchFetchSupportersForUser() {
  yield* takeEvery(fetchSupportersForUser.type, fetchSupportersForUserAsync)
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
    watchFetchSupportersForUser,
    watchRefreshSupport,
    watchConfirmSendTip,
    watchFetchRecentTips
  ]
}

export default sagas
