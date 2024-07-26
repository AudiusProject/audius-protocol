import { USDC } from '@audius/fixed-decimal'
import { type AudiusSdk } from '@audius/sdk'
import { createJupiterApiClient } from '@jup-ag/api'
import {
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  getAccount,
  getAssociatedTokenAddressSync
} from '@solana/spl-token'
import {
  PublicKey,
  Transaction,
  VersionedTransaction,
  AddressLookupTableAccount,
  TransactionMessage,
  Connection
} from '@solana/web3.js'
import BN from 'bn.js'
import { sumBy } from 'lodash'
import { takeLatest } from 'redux-saga/effects'
import { call, put, race, select, take } from 'typed-redux-saga'

import { PurchaseableContentMetadata, isPurchaseableAlbum } from '~/hooks'
import { Kind } from '~/models'
import { FavoriteSource, Name } from '~/models/Analytics'
import { ErrorLevel } from '~/models/ErrorReporting'
import { ID } from '~/models/Identifiers'
import {
  PurchaseMethod,
  PurchaseVendor,
  PurchaseAccess
} from '~/models/PurchaseContent'
import { isContentUSDCPurchaseGated } from '~/models/Track'
import { User } from '~/models/User'
import { BNUSDC } from '~/models/Wallet'
import {
  getRootSolanaAccount,
  getSolanaConnection,
  getTokenAccountInfo
} from '~/services/audius-backend/solana'
import { FeatureFlags } from '~/services/remote-config/feature-flags'
import { accountSelectors } from '~/store/account'
import {
  buyCryptoCanceled,
  buyCryptoFailed,
  buyCryptoSucceeded,
  buyCryptoViaSol
} from '~/store/buy-crypto/slice'
import { BuyCryptoError } from '~/store/buy-crypto/types'
import {
  buyUSDCFlowFailed,
  buyUSDCFlowSucceeded,
  onrampOpened,
  onrampCanceled
} from '~/store/buy-usdc/slice'
import { BuyUSDCError } from '~/store/buy-usdc/types'
import { getBuyUSDCRemoteConfig, getUSDCUserBank } from '~/store/buy-usdc/utils'
import { getCollection } from '~/store/cache/collections/selectors'
import { getTrack } from '~/store/cache/tracks/selectors'
import { getUser } from '~/store/cache/users/selectors'
import { getContext } from '~/store/effects'
import { getPreviewing, getTrackId } from '~/store/player/selectors'
import { stop } from '~/store/player/slice'
import { saveTrack } from '~/store/social/tracks/actions'
import { OnRampProvider } from '~/store/ui/buy-audio/types'
import {
  transactionCanceled,
  transactionFailed,
  transactionSucceeded
} from '~/store/ui/coinflow-modal/slice'
import {
  CoinflowPurchaseMetadata,
  coinflowOnrampModalActions
} from '~/store/ui/modals/coinflow-onramp-modal'
import { encodeHashId } from '~/utils/hashIds'
import { BN_USDC_CENT_WEI } from '~/utils/wallet'

import { cacheActions } from '../cache'
import { pollGatedContent } from '../gated-content/sagas'
import { updateGatedContentStatus } from '../gated-content/slice'
import { saveCollection } from '../social/collections/actions'
import { TOKEN_LISTING_MAP } from '../ui'

import {
  buyUSDC,
  purchaseCanceled,
  purchaseConfirmed,
  purchaseSucceeded,
  usdcBalanceSufficient,
  purchaseContentFlowFailed,
  startPurchaseContentFlow,
  payWithAnything
} from './slice'
import {
  PurchaseableContentType,
  PurchaseContentError,
  PurchaseErrorCode
} from './types'
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
  contentType: PurchaseableContentType
}

function* getContentInfo({ contentId, contentType }: GetPurchaseConfigArgs) {
  const metadata =
    contentType === PurchaseableContentType.ALBUM
      ? yield* select(getCollection, { id: contentId })
      : yield* select(getTrack, { id: contentId })
  const purchaseConditions =
    metadata?.stream_conditions ??
    (metadata && 'download_conditions' in metadata
      ? metadata?.download_conditions
      : null)
  // Stream access is a superset of download access - purchasing a stream-gated
  // track also gets you download access, but purchasing a download-gated track
  // only gets you download access (because the track was already free to stream).
  const purchaseAccess = metadata?.is_stream_gated
    ? PurchaseAccess.STREAM
    : PurchaseAccess.DOWNLOAD
  if (!metadata || !isContentUSDCPurchaseGated(purchaseConditions)) {
    throw new Error('Content is missing purchase conditions')
  }
  const isAlbum = 'playlist_id' in metadata
  const artistId = isAlbum ? metadata.playlist_owner_id : metadata.owner_id
  const artistInfo = yield* select(getUser, { id: artistId })
  if (!artistInfo) {
    throw new Error('Failed to retrieve content owner')
  }

  const title = isAlbum ? metadata.playlist_name : metadata.title
  const price = purchaseConditions.usdc_purchase.price

  return {
    price,
    title,
    artistInfo,
    purchaseAccess,
    purchaseConditions,
    metadata
  }
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

const getPurchaseMetadata = (metadata: PurchaseableContentMetadata) => {
  const {
    created_at,
    description,
    is_delete,
    permalink,
    release_date,
    updated_at
  } = metadata

  const commonFields = {
    created_at,
    description,
    is_delete,
    permalink,
    release_date,
    updated_at
  }

  const isAlbum = isPurchaseableAlbum(metadata)
  if (isAlbum) {
    return {
      ...commonFields,
      duration: sumBy(metadata.tracks, (track) => track.duration),
      owner_id: metadata.playlist_owner_id,
      title: metadata.playlist_name,
      content_id: metadata.playlist_id
    }
  }

  const {
    duration,
    genre,
    isrc,
    iswc,
    license,
    owner_id,
    tags,
    title,
    track_id
  } = metadata

  return {
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
    content_id: track_id,
    updated_at
  }
}

function* getCoinflowPurchaseMetadata({
  contentId,
  contentType
}: GetPurchaseMetadataArgs) {
  const { metadata, artistInfo, title, price } = yield* call(getContentInfo, {
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
      artistInfo: getUserPurchaseMetadata(artistInfo),
      purchaserInfo: currentUser ? getUserPurchaseMetadata(currentUser) : null,
      contentInfo: getPurchaseMetadata(metadata as PurchaseableContentMetadata)
    }
  }
  return data
}

function* pollForPurchaseConfirmation({
  contentId,
  contentType
}: {
  contentId: ID
  contentType: PurchaseableContentType
}) {
  const currentUserId = yield* select(getUserId)
  if (!currentUserId) {
    throw new Error(
      'Failed to fetch current user id while polling for purchase confirmation'
    )
  }
  yield* put(updateGatedContentStatus({ contentId, status: 'UNLOCKING' }))

  yield* pollGatedContent({
    contentId,
    contentType,
    currentUserId,
    isSourceTrack: true
  })

  if (contentType === PurchaseableContentType.ALBUM) {
    const { metadata } = yield* call(getContentInfo, {
      contentId,
      contentType
    })
    if (
      'playlist_contents' in metadata &&
      metadata.playlist_contents.track_ids
    ) {
      const apiClient = yield* getContext('apiClient')
      for (const trackId of metadata.playlist_contents.track_ids) {
        const track = yield* call([apiClient, 'getTrack'], {
          id: trackId.track,
          currentUserId
        })
        if (track) {
          yield* put(
            cacheActions.update(Kind.TRACKS, [
              {
                id: track.track_id,
                metadata: {
                  access: track.access
                }
              }
            ])
          )
        }
      }
    }
  }
}

type GetPurchaseMetadataArgs = {
  contentId: ID
  contentType: PurchaseableContentType
}

/**
 * Intended to replace the old purchaseWithCoinflow Saga to use new SDK.
 * purchaseAlbumWithCoinflow to follow
 * Creates the purchase transaction but doesn't send it and instead pops the coinflow modal.
 * @see {@link https://github.com/AudiusProject/audius-protocol/blob/75169cfb00894f5462a612b423129895f58a53fe/packages/libs/src/sdk/api/tracks/TracksApi.ts#L386 purchase}
 */
function* purchaseTrackWithCoinflow(args: {
  sdk: AudiusSdk
  trackId: ID
  userId: ID
  price: number
  extraAmount?: number
}) {
  const { sdk, userId, trackId, price, extraAmount = 0 } = args

  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const wallet = yield* call(getRootSolanaAccount, audiusBackendInstance)

  const params = {
    price: args.price,
    extraAmount: args.extraAmount,
    trackId: encodeHashId(trackId),
    userId: encodeHashId(userId),
    wallet: wallet.publicKey
  }
  const transaction = yield* call(
    [sdk.tracks, sdk.tracks.getPurchaseTrackTransaction],
    params
  )
  const serializedTransaction = Buffer.from(transaction.serialize()).toString(
    'base64'
  )

  const purchaseMetadata = yield* call(getCoinflowPurchaseMetadata, {
    contentId: trackId,
    contentType: PurchaseableContentType.TRACK
  })
  const total = price + extraAmount
  yield* put(
    coinflowOnrampModalActions.open({
      amount: Number(USDC(total).toString()),
      serializedTransaction,
      purchaseMetadata,
      contentId: trackId
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

/**
 * Intended to replace the old purchaseWithCoinflow Saga to use new SDK.
 * Creates the purchase transaction but doesn't send it and instead pops the coinflow modal.
 * @see {@link https://github.com/AudiusProject/audius-protocol/blob/75169cfb00894f5462a612b423129895f58a53fe/packages/libs/src/sdk/api/albums/AlbumsApi.ts#L386 purchase}
 */
function* purchaseAlbumWithCoinflow(args: {
  sdk: AudiusSdk
  albumId: ID
  userId: ID
  price: number
  extraAmount?: number
}) {
  const { sdk, userId, albumId, price, extraAmount = 0 } = args

  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const wallet = yield* call(getRootSolanaAccount, audiusBackendInstance)

  const params = {
    price: args.price,
    extraAmount: args.extraAmount,
    albumId: encodeHashId(albumId),
    userId: encodeHashId(userId),
    wallet: wallet.publicKey
  }

  const transaction = yield* call(
    [sdk.albums, sdk.albums.getPurchaseAlbumTransaction],
    params
  )
  const serializedTransaction = Buffer.from(transaction.serialize()).toString(
    'base64'
  )

  const purchaseMetadata = yield* call(getCoinflowPurchaseMetadata, {
    contentId: albumId,
    contentType: PurchaseableContentType.ALBUM
  })
  const total = price + extraAmount
  yield* put(
    coinflowOnrampModalActions.open({
      amount: Number(USDC(total).toString()),
      serializedTransaction,
      purchaseMetadata,
      contentId: albumId
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
    contentType = PurchaseableContentType.TRACK
  }
}: ReturnType<typeof startPurchaseContentFlow>) {
  const audiusBackendInstance = yield* getContext('audiusBackendInstance')
  const usdcConfig = yield* call(getBuyUSDCRemoteConfig)
  const reportToSentry = yield* getContext('reportToSentry')
  const { track, make } = yield* getContext('analytics')
  const audiusSdk = yield* getContext('audiusSdk')
  const sdk = yield* call(audiusSdk)

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

    const balanceNeeded = getBalanceNeeded(
      totalAmountDueCentsBN,
      new BN(initialBalance.toString()) as BNUSDC,
      usdcConfig.minUSDCPurchaseAmountCents
    )

    switch (purchaseMethod) {
      case PurchaseMethod.BALANCE:
      case PurchaseMethod.CRYPTO: {
        // Invariant: The user must have enough funds
        if (balanceNeeded.gtn(0)) {
          throw new PurchaseContentError(
            PurchaseErrorCode.InsufficientBalance,
            'Unexpected insufficient balance to complete purchase'
          )
        }
        // No balance needed, perform the purchase right away
        if (contentType === PurchaseableContentType.TRACK) {
          yield* call([sdk.tracks, sdk.tracks.purchaseTrack], {
            userId: encodeHashId(purchaserUserId),
            trackId: encodeHashId(contentId),
            price: price / 100.0,
            extraAmount: extraAmount ? extraAmount / 100.0 : undefined
          })
        } else {
          yield* call([sdk.albums, sdk.albums.purchaseAlbum], {
            userId: encodeHashId(purchaserUserId),
            albumId: encodeHashId(contentId),
            price: price / 100.0,
            extraAmount: extraAmount ? extraAmount / 100.0 : undefined
          })
        }
        break
      }
      case PurchaseMethod.CARD: {
        const purchaseAmount = (price + (extraAmount ?? 0)) / 100.0
        switch (purchaseVendor) {
          case PurchaseVendor.COINFLOW:
            // Purchase with coinflow, funding and completing the purchase in one step.
            if (contentType === PurchaseableContentType.TRACK) {
              yield* call(purchaseTrackWithCoinflow, {
                sdk,
                trackId: contentId,
                userId: purchaserUserId,
                price: price / 100.0,
                extraAmount: extraAmount ? extraAmount / 100.0 : undefined
              })
            } else {
              yield* call(purchaseAlbumWithCoinflow, {
                sdk,
                albumId: contentId,
                userId: purchaserUserId,
                price: price / 100.0,
                extraAmount: extraAmount ? extraAmount / 100.0 : undefined
              })
            }
            break
          case PurchaseVendor.STRIPE:
            // Buy USDC with Stripe. Once funded, continue with purchase.
            yield* call(purchaseUSDCWithStripe, { amount: purchaseAmount })
            if (contentType === PurchaseableContentType.TRACK) {
              yield* call([sdk.tracks, sdk.tracks.purchaseTrack], {
                userId: encodeHashId(purchaserUserId),
                trackId: encodeHashId(contentId),
                price: price / 100.0,
                extraAmount: extraAmount ? extraAmount / 100.0 : undefined
              })
            } else {
              yield* call([sdk.albums, sdk.albums.purchaseAlbum], {
                userId: encodeHashId(purchaserUserId),
                albumId: encodeHashId(contentId),
                price: price / 100.0,
                extraAmount: extraAmount ? extraAmount / 100.0 : undefined
              })
            }
            break
        }
        break
      }
    }

    // Mark the purchase as successful
    yield* put(purchaseSucceeded())

    // Poll to confirm purchase (waiting for a signature)
    yield* pollForPurchaseConfirmation({ contentId, contentType })

    const { metadata } = yield* call(getContentInfo, {
      contentId,
      contentType
    })
    // Auto-favorite the purchased item
    if (contentType === PurchaseableContentType.TRACK) {
      yield* put(saveTrack(contentId, FavoriteSource.IMPLICIT))
    }
    if (contentType === PurchaseableContentType.ALBUM) {
      yield* put(saveCollection(contentId, FavoriteSource.IMPLICIT))
      if (
        'playlist_contents' in metadata &&
        metadata.playlist_contents.track_ids &&
        !metadata.is_private
      ) {
        for (const track of metadata.playlist_contents.track_ids) {
          yield* put(saveTrack(track.track, FavoriteSource.IMPLICIT))
        }
      }
    }

    // Check if playing the purchased track's preview and if so, stop it
    const isPreviewing = yield* select(getPreviewing)
    const nowPlayingTrackId = yield* select(getTrackId)
    const isPlayingTrackInAlbum =
      contentType === PurchaseableContentType.ALBUM &&
      'playlist_contents' in metadata &&
      metadata.playlist_contents.track_ids.some(
        ({ track: trackId }) => trackId === nowPlayingTrackId
      )
    const isPlayingPurchasedTrack =
      contentType === PurchaseableContentType.TRACK &&
      contentId === nowPlayingTrackId

    if (isPreviewing && (isPlayingTrackInAlbum || isPlayingPurchasedTrack)) {
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
    yield* put(updateGatedContentStatus({ contentId, status: 'LOCKED' }))
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

const initJupiter = () => {
  try {
    return createJupiterApiClient()
  } catch (e) {
    console.error('Jupiter failed to initialize', e)
    throw e
  }
}

let _jup: ReturnType<typeof createJupiterApiClient>

const getInstance = () => {
  if (!_jup) {
    _jup = initJupiter()
  }
  return _jup
}

/**
 * Executes the Jupiter swap from input mint to $USDC and sends the $USDC to the userbank
 */
function* swapToUsdcAndSendToUserbank({
  connection,
  inputMint,
  amount,
  destinationTokenAccountPublicKey,
  sourceWalletPublicKey,
  usdcUserBankTokenAccountPublicKey,
  signAndSendTransaction
}: {
  connection: Connection
  inputMint: string
  amount: number
  destinationTokenAccountPublicKey: PublicKey
  sourceWalletPublicKey: PublicKey
  usdcUserBankTokenAccountPublicKey: PublicKey
  signAndSendTransaction: (
    transaction: Transaction | VersionedTransaction
  ) => Promise<Transaction>
}) {
  const jup = getInstance()

  // Get quote for the swap
  const quote = yield* call([jup, jup.quoteGet], {
    inputMint,
    outputMint: TOKEN_LISTING_MAP.USDC.address,
    amount,
    onlyDirectRoutes: true,
    swapMode: 'ExactOut'
  })
  if (!quote) {
    throw new Error(`Failed to get Jupiter quote for ${inputMint} => USDC`)
  }

  // Get swap instructions
  const { swapTransaction } = yield* call([jup, jup.swapPost], {
    swapRequest: {
      quoteResponse: quote,
      userPublicKey: sourceWalletPublicKey.toString(),
      destinationTokenAccount: destinationTokenAccountPublicKey.toString()
    }
  })
  const decoded = Buffer.from(swapTransaction, 'base64')
  const transaction = VersionedTransaction.deserialize(decoded)
  // Get address lookup table accounts
  const getLUTs = async () => {
    return await Promise.all(
      transaction.message.addressTableLookups.map(async (lookup) => {
        return new AddressLookupTableAccount({
          key: lookup.accountKey,
          state: AddressLookupTableAccount.deserialize(
            await connection
              .getAccountInfo(lookup.accountKey)
              .then((res: any) => res.data)
          )
        })
      })
    )
  }
  const addressLookupTableAccounts = yield* call(getLUTs)
  // Decompile transaction message and add transfer instruction
  const message = TransactionMessage.decompile(transaction.message, {
    addressLookupTableAccounts
  })
  message.instructions.push(
    createTransferInstruction(
      destinationTokenAccountPublicKey,
      usdcUserBankTokenAccountPublicKey,
      sourceWalletPublicKey,
      amount
    )
  )
  // Compile the message and update the transaction
  transaction.message = message.compileToV0Message(addressLookupTableAccounts)

  // Execute the swap by signing and sending the transaction
  return yield* call(signAndSendTransaction, transaction)
}

function* handlePayWithAnything({
  payload: {
    inputMint,
    extraAmount,
    contentId,
    contentType = PurchaseableContentType.TRACK
  }
}: ReturnType<typeof payWithAnything>) {
  let provider: any

  try {
    const audiusSdk = yield* getContext('audiusSdk')
    const sdk = yield* call(audiusSdk)
    const audiusBackendInstance = yield* getContext('audiusBackendInstance')
    const connection = yield* call(getSolanaConnection, audiusBackendInstance)

    // ===== GET USER and USDC USERBANK =====
    const purchaserUserId = yield* select(getUserId)
    if (!purchaserUserId) {
      throw new Error('Failed to fetch purchasing user id')
    }

    const usdcUserBank = yield* call(getUSDCUserBank)
    const usdcUserBankTokenAccount = yield* call(
      getTokenAccountInfo,
      audiusBackendInstance,
      {
        mint: 'usdc',
        tokenAccount: usdcUserBank
      }
    )
    if (!usdcUserBankTokenAccount) {
      throw new Error('Failed to fetch USDC user bank token account info')
    }

    // ===== GET SOLANA WALLET PROVIDER =====
    const provider = window.solana
    if (!provider) return
    const sourceWallet = yield* call(provider.connect)

    // ===== SWAP INPUT MINT TO USDC =====
    const destinationTokenAccountPublicKey = getAssociatedTokenAddressSync(
      new PublicKey(TOKEN_LISTING_MAP.USDC.address),
      sourceWallet.publicKey
    )
    try {
      yield* call(getAccount, connection, destinationTokenAccountPublicKey)
    } catch {
      console.info('Creating USDC associated token account...')
      const transaction = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          sourceWallet.publicKey,
          destinationTokenAccountPublicKey,
          sourceWallet.publicKey,
          new PublicKey(TOKEN_LISTING_MAP.USDC.address)
        )
      )
      const { blockhash: latestBlockHash } = yield* call(
        connection.getLatestBlockhash
      )
      transaction.recentBlockhash = latestBlockHash
      yield* call(provider.signAndSendTransaction, transaction)
    }

    const decimals = TOKEN_LISTING_MAP.USDC.decimals
    const { price } = yield* call(getContentInfo, {
      contentId,
      contentType
    })
    const totalAmount = (price + (extraAmount ?? 0)) / 100
    const amount = Math.ceil(totalAmount * 10 ** decimals)

    console.info('Swapping to USDC then sending to USDC userbank...')
    yield* call(swapToUsdcAndSendToUserbank, {
      connection,
      inputMint,
      amount,
      destinationTokenAccountPublicKey,
      sourceWalletPublicKey: sourceWallet.publicKey,
      usdcUserBankTokenAccountPublicKey: usdcUserBankTokenAccount.address,
      signAndSendTransaction: provider.signAndSendTransaction
    })

    // ===== PURCHASE THE CONTENT FROM USDC USER BANK BALANCE =====
    console.info('Purchasing track...')
    if (contentType === PurchaseableContentType.TRACK) {
      yield* call([sdk.tracks, sdk.tracks.purchaseTrack], {
        userId: encodeHashId(purchaserUserId),
        trackId: encodeHashId(contentId),
        price: price / 100.0,
        extraAmount: extraAmount ? extraAmount / 100.0 : undefined
      })
      // } else {
      //   yield* call([sdk.albums, sdk.albums.purchaseAlbum], {
      //     userId: encodeHashId(purchaserUserId),
      //     albumId: encodeHashId(contentId),
      //     price: price / 100.0,
      //     extraAmount: extraAmount ? extraAmount / 100.0 : undefined
      //   })
    }
  } catch (e) {
    console.error(`handlePayWithAnything | Error: ${e}`)
  } finally {
    // DISCONNECT WALLET
    yield* call([provider, provider.disconnect])
  }
}

function* watchStartPurchaseContentFlow() {
  yield takeLatest(startPurchaseContentFlow, doStartPurchaseContentFlow)
}

function* watchPayWithAnything() {
  yield takeLatest(payWithAnything.type, handlePayWithAnything)
}

export default function sagas() {
  return [watchStartPurchaseContentFlow, watchPayWithAnything]
}
