import BN from 'bn.js'
import { takeLatest } from 'redux-saga/effects'
import { call, put, race, select, take } from 'typed-redux-saga'

import { FavoriteSource, Name } from 'models/Analytics'
import { ErrorLevel } from 'models/ErrorReporting'
import { ID } from 'models/Identifiers'
import { PurchaseMethod, PurchaseVendor } from 'models/PurchaseContent'
import { Track, isContentUSDCPurchaseGated } from 'models/Track'
import { User } from 'models/User'
import { BNUSDC } from 'models/Wallet'
import {
  getRecentBlockhash,
  getRootSolanaAccount,
  getTokenAccountInfo,
  purchaseContent,
  purchaseContentWithPaymentRouter
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
import { BuyUSDCError } from 'store/buy-usdc/types'
import { getBuyUSDCRemoteConfig, getUSDCUserBank } from 'store/buy-usdc/utils'
import { getTrack } from 'store/cache/tracks/selectors'
import { getUser } from 'store/cache/users/selectors'
import { getContext } from 'store/effects'
import { getPreviewing, getTrackId } from 'store/player/selectors'
import { stop } from 'store/player/slice'
import { saveTrack } from 'store/social/tracks/actions'
import { getFeePayer } from 'store/solana/selectors'
import { OnRampProvider } from 'store/ui/buy-audio/types'
import {
  transactionCanceled,
  transactionFailed,
  transactionSucceeded
} from 'store/ui/coinflow-modal/slice'
import {
  CoinflowPurchaseMetadata,
  coinflowOnrampModalActions
} from 'store/ui/modals/coinflow-onramp-modal'
import { BN_USDC_CENT_WEI } from 'utils/wallet'

import { pollGatedTrack } from '../gated-content/sagas'
import { updateGatedTrackStatus } from '../gated-content/slice'

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

const { getUserId, getAccountUser } = accountSelectors

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
  if (!trackInfo || !isContentUSDCPurchaseGated(trackInfo?.stream_conditions)) {
    throw new Error('Content is missing stream conditions')
  }
  const artistInfo = yield* select(getUser, { id: trackInfo.owner_id })
  if (!artistInfo) {
    throw new Error('Failed to retrieve content owner')
  }

  const {
    stream_conditions: {
      usdc_purchase: { price }
    },
    title
  } = trackInfo

  return { price, title, artistInfo, trackInfo }
}

const getUserPurchaseMetadata = ({
  handle,
  name,
  wallet,
  spl_wallet,
  created_at,
  updated_at,
  user_id,
  is_deactivated,
  is_verified,
  location
}: User) => ({
  handle,
  name,
  wallet,
  spl_wallet,
  created_at,
  updated_at,
  user_id,
  is_deactivated,
  is_verified,
  location
})

const getTrackPurchaseMetadata = ({
  created_at,
  description,
  duration,
  genre,
  is_delete,
  isrc,
  iswc,
  license,
  owner_id,
  permalink,
  release_date,
  tags,
  title,
  track_id,
  updated_at
}: Track) => ({
  created_at,
  description,
  duration,
  genre,
  is_delete,
  isrc,
  iswc,
  license,
  owner_id,
  permalink,
  release_date,
  tags,
  title,
  track_id,
  updated_at
})

function* getCoinflowPurchaseMetadata({
  contentId,
  contentType,
  extraAmount,
  splits
}: PurchaseWithCoinflowArgs) {
  const { trackInfo, artistInfo, title, price } = yield* call(getContentInfo, {
    contentId,
    contentType
  })
  const currentUser = yield* select(getAccountUser)

  const data: CoinflowPurchaseMetadata = {
    productName: `${artistInfo.name}:${title}`,
    productType: 'digitalArt',
    quantity: 1,
    rawProductData: {
      priceUSD: price / 100,
      extraAmountUSD: extraAmount ? extraAmount / 100 : 0,
      usdcRecipientSplits: splits,
      artistInfo: getUserPurchaseMetadata(artistInfo),
      purchaserInfo: currentUser ? getUserPurchaseMetadata(currentUser) : null,
      contentInfo: getTrackPurchaseMetadata(trackInfo)
    }
  }
  return data
}

function* getPurchaseConfig({ contentId, contentType }: GetPurchaseConfigArgs) {
  if (contentType !== ContentType.TRACK) {
    throw new Error('Only tracks are supported')
  }

  const trackInfo = yield* select(getTrack, { id: contentId })
  if (!trackInfo || !isContentUSDCPurchaseGated(trackInfo?.stream_conditions)) {
    throw new Error('Content is missing stream conditions')
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
    stream_conditions: {
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
    updateGatedTrackStatus({ trackId: contentId, status: 'UNLOCKING' })
  )

  yield* pollGatedTrack({
    trackId: contentId,
    currentUserId,
    isSourceTrack: true
  })
}

type PurchaseWithCoinflowArgs = {
  blocknumber: number
  extraAmount?: number
  splits: Record<number, number>
  contentId: ID
  contentType: ContentType
  purchaserUserId: ID
  /** USDC in dollars */
  price: number
}

function* purchaseWithCoinflow(args: PurchaseWithCoinflowArgs) {
  const {
    blocknumber,
    extraAmount,
    splits,
    contentId,
    purchaserUserId,
    price
  } = args
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const feePayerAddress = yield* select(getFeePayer)
  if (!feePayerAddress) {
    throw new Error('Missing feePayer unexpectedly')
  }
  const purchaseMetadata = yield* call(getCoinflowPurchaseMetadata, args)
  const recentBlockhash = yield* call(getRecentBlockhash, audiusBackendInstance)
  const rootAccount = yield* call(getRootSolanaAccount, audiusBackendInstance)

  const coinflowTransaction = yield* call(
    purchaseContentWithPaymentRouter,
    audiusBackendInstance,
    {
      id: contentId,
      type: 'track',
      splits,
      extraAmount,
      blocknumber,
      recentBlockhash,
      purchaserUserId,
      wallet: rootAccount
    }
  )

  const serializedTransaction = coinflowTransaction
    .serialize({ requireAllSignatures: false, verifySignatures: false })
    .toString('base64')
  yield* put(
    coinflowOnrampModalActions.open({
      amount: price,
      serializedTransaction,
      purchaseMetadata,
      contentId
    })
  )

  const result = yield* race({
    succeeded: take(transactionSucceeded),
    failed: take(transactionFailed),
    canceled: take(transactionCanceled)
  })

  // Return early for failure or cancellation
  if (result.canceled) {
    throw new PurchaseContentError(
      PurchaseErrorCode.Canceled,
      'Coinflow transaction canceled'
    )
  }
  if (result.failed) {
    throw result.failed.payload.error
  }
}

type PurchaseUSDCWithStripeArgs = {
  /** Amount of USDC to purchase, as dollars */
  amount: number
}
function* purchaseUSDCWithStripe({ amount }: PurchaseUSDCWithStripeArgs) {
  yield* put(buyUSDC())
  const getFeatureEnabled = yield* getContext('getFeatureEnabled')
  const isBuyUSDCViaSolEnabled = yield* call(
    getFeatureEnabled,
    FeatureFlags.BUY_USDC_VIA_SOL
  )
  const cents = Math.ceil(amount * 100)

  let result: RaceStatusResult | null = null
  if (isBuyUSDCViaSolEnabled) {
    yield* put(
      buyCryptoViaSol({
        // expects "friendly" amount, so dollars
        amount: cents / 100.0,
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
        vendor: PurchaseVendor.STRIPE,
        purchaseInfo: {
          desiredAmount: cents
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
  yield* put(usdcBalanceSufficient())
}

function* doStartPurchaseContentFlow({
  payload: {
    extraAmount,
    extraAmountPreset,
    purchaseMethod,
    purchaseVendor,
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
    purchaseVendor,
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

    const { blocknumber, splits } = yield* getPurchaseConfig({
      contentId,
      contentType
    })
    const balanceNeeded = getBalanceNeeded(
      totalAmountDueCentsBN,
      new BN(initialBalance.toString()) as BNUSDC,
      usdcConfig.minUSDCPurchaseAmountCents
    )

    if (purchaseMethod === PurchaseMethod.BALANCE && balanceNeeded.lten(0)) {
      // No balance needed, perform the purchase right away
      yield* call(purchaseContent, audiusBackendInstance, {
        id: contentId,
        blocknumber,
        extraAmount: extraAmountBN,
        splits,
        type: 'track',
        purchaserUserId
      })
    } else {
      // We need to acquire USDC before the purchase can continue
      // Invariant: The user must be checking out with a card
      if (purchaseMethod !== PurchaseMethod.CARD) {
        throw new PurchaseContentError(
          PurchaseErrorCode.InsufficientBalance,
          'Unexpected insufficient balance to complete purchase'
        )
      }

      const purchaseAmount = (price + (extraAmount ?? 0)) / 100.0
      switch (purchaseVendor) {
        case PurchaseVendor.COINFLOW:
          // Purchase with coinflow, funding and completing the purchase in one step.
          yield* call(purchaseWithCoinflow, {
            blocknumber,
            extraAmount,
            splits,
            contentId,
            contentType,
            purchaserUserId,
            price: purchaseAmount
          })
          break
        case PurchaseVendor.STRIPE:
          // Buy USDC with Stripe. Once funded, continue with purchase.
          yield* call(purchaseUSDCWithStripe, { amount: purchaseAmount })
          yield* call(purchaseContent, audiusBackendInstance, {
            id: contentId,
            blocknumber,
            extraAmount: extraAmountBN,
            splits,
            type: 'track',
            purchaserUserId
          })
          break
      }
    }

    // Mark the purchase as successful
    yield* put(purchaseSucceeded())

    // Poll to confirm purchase (waiting for a signature)
    yield* pollForPurchaseConfirmation({ contentId, contentType })

    // Auto-favorite the purchased item
    if (contentType === ContentType.TRACK) {
      yield* put(saveTrack(contentId, FavoriteSource.IMPLICIT))
    }

    // Check if playing the purchased track's preview and if so, stop it
    const isPreviewing = yield* select(getPreviewing)
    const trackId = yield* select(getTrackId)
    if (contentId === trackId && isPreviewing) {
      yield* put(stop({}))
    }

    // Finish
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
