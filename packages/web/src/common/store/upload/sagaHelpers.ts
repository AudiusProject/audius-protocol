import {
  Name,
  isContentCollectibleGated,
  isContentFollowGated,
  isContentTipGated,
  isContentUSDCPurchaseGated,
  TrackMetadata
} from '@audius/common/models'
import { CollectionValues } from '@audius/common/schemas'
import { FeatureFlags } from '@audius/common/services'
import {
  accountSelectors,
  getUSDCUserBank,
  getContext,
  TrackForUpload
} from '@audius/common/store'
import { BN_USDC_CENT_WEI } from '@audius/common/utils'
import BN from 'bn.js'
import { all, call, put, select } from 'typed-redux-saga'

import { make } from 'common/store/analytics/actions'
const { getAccountUser } = accountSelectors

/** Records gated track uploads. */
export function* recordGatedTracks(tracks: (TrackForUpload | TrackMetadata)[]) {
  const events = tracks.reduce<ReturnType<typeof make>[]>(
    (out, trackOrMetadata) => {
      const {
        is_stream_gated: isStreamGated,
        stream_conditions: streamConditions,
        is_download_gated: isDownloadGated,
        download_conditions: dowloadConditions,
        is_downloadable: isDownloadable,
        is_original_available: isOriginalAvailable
      } = 'metadata' in trackOrMetadata
        ? trackOrMetadata.metadata
        : trackOrMetadata
      if (isStreamGated && streamConditions) {
        if (isContentCollectibleGated(streamConditions)) {
          out.push(
            make(Name.TRACK_UPLOAD_COLLECTIBLE_GATED, {
              kind: 'tracks',
              downloadable: isDownloadable,
              lossless: isOriginalAvailable
            })
          )
        } else if (isContentFollowGated(streamConditions)) {
          out.push(
            make(Name.TRACK_UPLOAD_FOLLOW_GATED, {
              kind: 'tracks',
              downloadable: isDownloadable,
              lossless: isOriginalAvailable
            })
          )
        } else if (isContentTipGated(streamConditions)) {
          out.push(
            make(Name.TRACK_UPLOAD_TIP_GATED, {
              kind: 'tracks',
              downloadable: isDownloadable,
              lossless: isOriginalAvailable
            })
          )
        } else if (isContentUSDCPurchaseGated(streamConditions)) {
          out.push(
            make(Name.TRACK_UPLOAD_USDC_GATED, {
              kind: 'tracks',
              price: streamConditions.usdc_purchase.price / 100,
              downloadable: isDownloadable,
              lossless: isOriginalAvailable
            })
          )
        }
      } else if (isDownloadGated && dowloadConditions) {
        if (isContentFollowGated(dowloadConditions)) {
          out.push(
            make(Name.TRACK_UPLOAD_FOLLOW_GATED_DOWNLOAD, {
              kind: 'tracks',
              downloadable: isDownloadable,
              lossless: isOriginalAvailable
            })
          )
        } else if (isContentUSDCPurchaseGated(dowloadConditions)) {
          out.push(
            make(Name.TRACK_UPLOAD_USDC_GATED_DOWNLOAD, {
              kind: 'tracks',
              price: dowloadConditions.usdc_purchase.price / 100,
              downloadable: isDownloadable,
              lossless: isOriginalAvailable
            })
          )
        }
      }
      return out
    },
    []
  )

  yield* all(events.map((e) => put(e)))
}

/**
 * Adds relevant metadata
 * Converts prices to WEI and adds splits for USDC purchasable content.
 */
export function* processTrackForPremiumUpload<T extends TrackMetadata>({
  track,
  collectionMetadata
}: {
  track: T
  collectionMetadata: CollectionValues | undefined
}) {
  const getFeatureEnabled = yield* getContext('getFeatureEnabled')
  const isUsdcPurchaseEnabled = yield* call(
    getFeatureEnabled,
    FeatureFlags.USDC_PURCHASES
  )
  if (!isUsdcPurchaseEnabled) return track

  // Check for a price set across an entire collection (for albums only atm)
  const collectionTrackPrice =
    collectionMetadata?.stream_conditions?.usdc_purchase.albumTrackPrice
  // Make sure we should be using the price set at the collection level
  const hasCollectionTrackPrice =
    collectionTrackPrice !== undefined && collectionMetadata?.is_stream_gated

  const ownerAccount = yield* select(getAccountUser)
  const wallet = ownerAccount?.erc_wallet ?? ownerAccount?.wallet

  // If the track was added as part of a premium album, need to create/add all the relevant premium track metadata here
  if (hasCollectionTrackPrice) {
    track.is_stream_gated = true
    track.is_download_gated = true
    track.preview_start_seconds = 0
    // TODO: make TS happy here :(
    track.stream_conditions = {
      usdc_purchase: {}
    }
    track.download_conditions = {
      usdc_purchase: {}
    }
  }

  if (isContentUSDCPurchaseGated(track.stream_conditions)) {
    const ownerUserbank = yield* call(getUSDCUserBank, wallet)
    const priceCents = hasCollectionTrackPrice
      ? collectionTrackPrice
      : track.stream_conditions.usdc_purchase.price
    const priceWei = new BN(priceCents).mul(BN_USDC_CENT_WEI).toNumber()
    track.stream_conditions.usdc_purchase = {
      price: priceCents,
      splits: {
        [ownerUserbank?.toString() ?? '']: priceWei
      }
    }
  }
  if (isContentUSDCPurchaseGated(track.download_conditions)) {
    const ownerUserbank = yield* call(getUSDCUserBank, wallet)
    const priceCents = hasCollectionTrackPrice
      ? collectionTrackPrice
      : track.download_conditions.usdc_purchase.price
    const priceWei = new BN(priceCents).mul(BN_USDC_CENT_WEI).toNumber()
    track.download_conditions.usdc_purchase = {
      price: priceCents,
      splits: {
        [ownerUserbank.toString()]: priceWei
      }
    }
  }

  return track
}
