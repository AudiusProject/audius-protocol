import BN from 'bn.js'
import { takeLatest } from 'redux-saga/effects'
import { call, put, race, select, take } from 'typed-redux-saga'

import { FavoriteSource, Name } from 'models/Analytics'
import { ErrorLevel } from 'models/ErrorReporting'
import { ID } from 'models/Identifiers'
import { isPremiumContentUSDCPurchaseGated } from 'models/Track'
import { BNUSDC } from 'models/Wallet'
import {
  getTokenAccountInfo,
  purchaseContent
} from 'services/audius-backend/solana'
import { accountSelectors } from 'store/account'
import {
  buyUSDCFlowFailed,
  buyUSDCFlowSucceeded,
  onrampOpened,
  onrampCanceled
} from 'store/buy-usdc/slice'
import { BuyUSDCError, USDCOnRampProvider } from 'store/buy-usdc/types'
import { getUSDCUserBank } from 'store/buy-usdc/utils'
import { getTrack } from 'store/cache/tracks/selectors'
import { getUser } from 'store/cache/users/selectors'
import { getContext } from 'store/effects'
import { saveTrack } from 'store/social/tracks/actions'
import { BN_USDC_CENT_WEI, ceilingBNUSDCToNearestCent } from 'utils/wallet'

import { pollPremiumTrack } from '../premium-content/sagas'
import { updatePremiumTrackStatus } from '../premium-content/slice'

import {
  buyUSDC,
  purchaseCanceled,
  purchaseConfirmed,
  purchaseSucceeded,
  usdcBalanceSufficient,
  purchaseContentFlowFailed,
  startPurchaseContentFlow
} from './slice'
import { ContentType, PurchaseContentError, PurchaseErrorCode } from './types'

const { getUserId } = accountSelectors

type GetPurchaseConfigArgs = {
  contentId: ID
  contentType: ContentType
}

function* getUSDCPremiumConditions({
  contentId,
  contentType
}: GetPurchaseConfigArgs) {
  if (contentType !== ContentType.TRACK) {
    throw new Error('Only tracks are supported')
  }

  const trackInfo = yield* select(getTrack, { id: contentId })
  if (
    !trackInfo ||
    !isPremiumContentUSDCPurchaseGated(trackInfo?.premium_conditions)
  ) {
    throw new Error('Content is missing premium conditions')
  }
  return trackInfo.premium_conditions.usdc_purchase
}

function* getPurchaseConfig({ contentId, contentType }: GetPurchaseConfigArgs) {
  if (contentType !== ContentType.TRACK) {
    throw new Error('Only tracks are supported')
  }

  const trackInfo = yield* select(getTrack, { id: contentId })
  if (
    !trackInfo ||
    !isPremiumContentUSDCPurchaseGated(trackInfo?.premium_conditions)
  ) {
    throw new Error('Content is missing premium conditions')
  }

  const user = yield* select(getUser, { id: trackInfo.owner_id })
  if (!user) {
    throw new Error('Failed to retrieve content owner')
  }
  const recipientERCWallet = user.erc_wallet ?? user.wallet
  if (!recipientERCWallet) {
    throw new Error('Unable to resolve destination wallet')
  }

  const {
    blocknumber,
    premium_conditions: {
      usdc_purchase: { splits }
    }
  } = trackInfo

  return {
    blocknumber,
    splits
  }
}

function* pollForPurchaseConfirmation({
  contentId,
  contentType
}: {
  contentId: ID
  contentType: ContentType
}) {
  if (contentType !== ContentType.TRACK) {
    throw new Error('Only tracks are supported')
  }

  const currentUserId = yield* select(getUserId)
  if (!currentUserId) {
    throw new Error(
      'Failed to fetch current user id while polling for purchase confirmation'
    )
  }
  yield* put(
    updatePremiumTrackStatus({ trackId: contentId, status: 'UNLOCKING' })
  )

  yield* pollPremiumTrack({
    trackId: contentId,
    currentUserId,
    isSourceTrack: true
  })
}

function* doStartPurchaseContentFlow({
  payload: {
    extraAmount,
    extraAmountPreset,
    contentId,
    contentType = ContentType.TRACK
  }
}: ReturnType<typeof startPurchaseContentFlow>) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const reportToSentry = yield* getContext('reportToSentry')
  const { track, make } = yield* getContext('analytics')

  // Record start
  yield* call(
    track,
    make({
      eventName: Name.PURCHASE_CONTENT_STARTED,
      extraAmount,
      extraAmountPreset,
      contentId,
      contentType
    })
  )

  try {
    const { price } = yield* call(getUSDCPremiumConditions, {
      contentId,
      contentType
    })

    // get user bank
    const userBank = yield* call(getUSDCUserBank)

    const tokenAccountInfo = yield* call(
      getTokenAccountInfo,
      audiusBackendInstance,
      {
        mint: 'usdc',
        tokenAccount: userBank
      }
    )
    if (!tokenAccountInfo) {
      throw new Error('Failed to fetch USDC token account info')
    }

    const { amount: initialBalance } = tokenAccountInfo

    const priceBN = new BN(price).mul(BN_USDC_CENT_WEI)
    const extraAmountBN = new BN(extraAmount ?? 0).mul(BN_USDC_CENT_WEI)
    const balanceNeeded: BNUSDC = priceBN
      .add(extraAmountBN)
      .sub(new BN(initialBalance.toString())) as BNUSDC

    // buy USDC if necessary
    if (balanceNeeded.gtn(0)) {
      const balanceNeededCents = ceilingBNUSDCToNearestCent(balanceNeeded)
        .div(BN_USDC_CENT_WEI)
        .toNumber()
      yield* put(buyUSDC())
      yield* put(
        onrampOpened({
          provider: USDCOnRampProvider.STRIPE,
          purchaseInfo: {
            desiredAmount: balanceNeededCents
          }
        })
      )

      const result = yield* race({
        success: take(buyUSDCFlowSucceeded),
        canceled: take(onrampCanceled),
        failed: take(buyUSDCFlowFailed)
      })

      // Return early for failure or cancellation
      if (result.canceled) {
        yield* put(purchaseCanceled())
        return
      }
      if (result.failed) {
        yield* put(
          purchaseContentFlowFailed({ error: result.failed.payload.error })
        )
        return
      }
    }

    yield* put(usdcBalanceSufficient())

    const { blocknumber, splits } = yield* getPurchaseConfig({
      contentId,
      contentType
    })

    // purchase content
    yield* call(purchaseContent, audiusBackendInstance, {
      id: contentId,
      blocknumber,
      extraAmount: extraAmountBN,
      splits,
      type: 'track'
    })
    yield* put(purchaseSucceeded())

    // confirm purchase
    yield* pollForPurchaseConfirmation({ contentId, contentType })

    // auto-favorite the purchased item
    if (contentType === ContentType.TRACK) {
      yield* put(saveTrack(contentId, FavoriteSource.IMPLICIT))
    }

    // finish
    yield* put(purchaseConfirmed({ contentId, contentType }))

    yield* call(
      track,
      make({ eventName: Name.PURCHASE_CONTENT_SUCCESS, contentId, contentType })
    )
  } catch (e: unknown) {
    // If we get a known error, pipe it through directly. Otherwise make sure we
    // have a properly contstructed error to put into the slice.
    const error =
      e instanceof PurchaseContentError || e instanceof BuyUSDCError
        ? e
        : new PurchaseContentError(PurchaseErrorCode.Unknown, `${e}`)
    yield* call(reportToSentry, {
      level: ErrorLevel.Error,
      error,
      additionalInfo: { contentId, contentType }
    })
    yield* put(purchaseContentFlowFailed({ error }))
    yield* call(
      track,
      make({
        eventName: Name.PURCHASE_CONTENT_FAILURE,
        contentId,
        contentType,
        error: error.message
      })
    )
  }
}

function* watchStartPurchaseContentFlow() {
  yield takeLatest(startPurchaseContentFlow, doStartPurchaseContentFlow)
}

export default function sagas() {
  return [watchStartPurchaseContentFlow]
}
