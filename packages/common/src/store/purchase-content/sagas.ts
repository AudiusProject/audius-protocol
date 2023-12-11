import BN from 'bn.js'
import { takeLatest } from 'redux-saga/effects'
import { call, put, race, select, take } from 'typed-redux-saga'

import { FavoriteSource, Name } from 'models/Analytics'
import { ErrorLevel } from 'models/ErrorReporting'
import { ID } from 'models/Identifiers'
import { PurchaseMethod } from 'models/PurchaseContent'
import { isPremiumContentUSDCPurchaseGated } from 'models/Track'
import { BNUSDC } from 'models/Wallet'
import {
  getTokenAccountInfo,
  purchaseContent
} from 'services/audius-backend/solana'
import { FeatureFlags } from 'services/remote-config/feature-flags'
import { accountSelectors } from 'store/account'
import {
  buyCryptoCanceled,
  buyCryptoFailed,
  buyCryptoSucceeded,
  buyCryptoViaSol
} from 'store/buy-crypto/slice'
import { BuyCryptoError } from 'store/buy-crypto/types'
import {
  buyUSDCFlowFailed,
  buyUSDCFlowSucceeded,
  onrampOpened,
  onrampCanceled
} from 'store/buy-usdc/slice'
import { BuyUSDCError, USDCOnRampProvider } from 'store/buy-usdc/types'
import { getBuyUSDCRemoteConfig, getUSDCUserBank } from 'store/buy-usdc/utils'
import { getTrack } from 'store/cache/tracks/selectors'
import { getUser } from 'store/cache/users/selectors'
import { getContext } from 'store/effects'
import { getPreviewing, getTrackId } from 'store/player/selectors'
import { stop } from 'store/player/slice'
import { saveTrack } from 'store/social/tracks/actions'
import { OnRampProvider } from 'store/ui/buy-audio/types'
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
import { getBalanceNeeded } from './utils'

const { getUserId } = accountSelectors

type RaceStatusResult = {
  succeeded?:
    | ReturnType<typeof buyUSDCFlowSucceeded>
    | ReturnType<typeof buyCryptoSucceeded>
  failed?:
    | ReturnType<typeof buyUSDCFlowFailed>
    | ReturnType<typeof buyCryptoFailed>
  canceled?:
    | ReturnType<typeof onrampCanceled>
    | ReturnType<typeof buyCryptoCanceled>
}

type GetPurchaseConfigArgs = {
  contentId: ID
  contentType: ContentType
}

function* getContentInfo({ contentId, contentType }: GetPurchaseConfigArgs) {
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
  const artistInfo = yield* select(getUser, { id: trackInfo.owner_id })
  if (!artistInfo) {
    throw new Error('Failed to retrieve content owner')
  }

  const {
    premium_conditions: {
      usdc_purchase: { price }
    },
    title
  } = trackInfo

  return { price, title, artistInfo }
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

/** Attempts to purchase the requested amount of USDC, will throw on cancellation or failure */
function* purchaseUSDC({ amount }: { amount: BNUSDC }) {
  const getFeatureEnabled = yield* getContext('getFeatureEnabled')
  const isBuyUSDCViaSolEnabled = yield* call(
    getFeatureEnabled,
    FeatureFlags.BUY_USDC_VIA_SOL
  )
  const roundedAmount = ceilingBNUSDCToNearestCent(amount)
    .div(BN_USDC_CENT_WEI)
    .toNumber()

  let result: RaceStatusResult | null = null
  if (isBuyUSDCViaSolEnabled) {
    yield* put(
      buyCryptoViaSol({
        // expects "friendly" amount, so dollars
        amount: roundedAmount / 100.0,
        mint: 'usdc',
        provider: OnRampProvider.STRIPE
      })
    )
    result = yield* race({
      succeeded: take(buyCryptoSucceeded),
      failed: take(buyCryptoFailed),
      canceled: take(buyCryptoCanceled)
    })
  } else {
    yield* put(
      onrampOpened({
        provider: USDCOnRampProvider.STRIPE,
        purchaseInfo: {
          desiredAmount: roundedAmount
        }
      })
    )

    result = yield* race({
      succeeded: take(buyUSDCFlowSucceeded),
      canceled: take(onrampCanceled),
      failed: take(buyUSDCFlowFailed)
    })
  }
  // Return early for cancellation
  if (result.canceled) {
    throw new PurchaseContentError(
      PurchaseErrorCode.Canceled,
      'User canceled onramp'
    )
  }
  // throw errors out to the shared handler below
  if (result.failed) {
    throw result.failed.payload.error
  }
}

function* doStartPurchaseContentFlow({
  payload: {
    extraAmount,
    extraAmountPreset,
    purchaseMethod,
    contentId,
    contentType = ContentType.TRACK
  }
}: ReturnType<typeof startPurchaseContentFlow>) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const usdcConfig = yield* call(getBuyUSDCRemoteConfig)
  const reportToSentry = yield* getContext('reportToSentry')
  const { track, make } = yield* getContext('analytics')

  const { price, title, artistInfo } = yield* call(getContentInfo, {
    contentId,
    contentType
  })

  const analyticsInfo = {
    price: price / 100,
    contentId,
    contentType,
    purchaseMethod,
    contentName: title,
    artistHandle: artistInfo.handle,
    isVerifiedArtist: artistInfo.is_verified,
    totalAmount: (price + (extraAmount ?? 0)) / 100,
    payExtraAmount: extraAmount ? extraAmount / 100 : 0,
    payExtraPreset: extraAmountPreset
  }

  // Record start
  yield* call(
    track,
    make({
      eventName: Name.PURCHASE_CONTENT_STARTED,
      ...analyticsInfo
    })
  )

  try {
    // get user & user bank
    const purchaserUserId = yield* select(getUserId)
    if (!purchaserUserId) {
      throw new Error('Failed to fetch purchasing user id')
    }

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
    const totalAmountDueCentsBN = priceBN.add(extraAmountBN) as BNUSDC

    if (purchaseMethod === PurchaseMethod.CARD) {
      // Transition to 'buying USDC' stage
      yield* put(buyUSDC())
      yield* call(purchaseUSDC, { amount: totalAmountDueCentsBN })
    }
    // Manual transfer is a special case of existing balance. We expect the
    // transfer to have occurred before this saga is invoked
    else {
      // No work needed here other than to check that the balance is sufficient
      const balanceNeeded = getBalanceNeeded(
        totalAmountDueCentsBN,
        new BN(initialBalance.toString()) as BNUSDC,
        usdcConfig.minUSDCPurchaseAmountCents
      )
      if (balanceNeeded.gtn(0)) {
        throw new PurchaseContentError(
          PurchaseErrorCode.InsufficientBalance,
          'Unexpected insufficient balance to complete purchase'
        )
      }
    }

    // Transition to 'purchasing' stage
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
      type: 'track',
      purchaserUserId
    })
    yield* put(purchaseSucceeded())

    // confirm purchase
    yield* pollForPurchaseConfirmation({ contentId, contentType })

    // auto-favorite the purchased item
    if (contentType === ContentType.TRACK) {
      yield* put(saveTrack(contentId, FavoriteSource.IMPLICIT))
    }

    // Check if playing the purchased track's preview and if so, stop it
    const isPreviewing = yield* select(getPreviewing)
    const trackId = yield* select(getTrackId)
    if (contentId === trackId && isPreviewing) {
      yield* put(stop({}))
    }

    // finish
    yield* put(purchaseConfirmed({ contentId, contentType }))

    yield* call(
      track,
      make({
        eventName: Name.PURCHASE_CONTENT_SUCCESS,
        ...analyticsInfo
      })
    )
  } catch (e: unknown) {
    // If we get a known error, pipe it through directly. Otherwise make sure we
    // have a properly contstructed error to put into the slice.
    const error =
      e instanceof PurchaseContentError ||
      e instanceof BuyUSDCError ||
      e instanceof BuyCryptoError
        ? e
        : new PurchaseContentError(PurchaseErrorCode.Unknown, `${e}`)

    // Nested sagas will throw for cancellation, but we don't need to log that as
    // an error, just return early
    if (error.code === PurchaseErrorCode.Canceled) {
      yield* put(purchaseCanceled())
      return
    }

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
        error: error.message,
        ...analyticsInfo
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
