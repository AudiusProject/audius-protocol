import {
  Name,
  isContentCollectibleGated,
  isContentFollowGated,
  isContentTipGated,
  isContentUSDCPurchaseGated,
  TrackMetadata
} from '@audius/common/models'
import { FeatureFlags } from '@audius/common/services'
import {
  accountSelectors,
  getUSDCUserBank,
  getContext
} from '@audius/common/store'
import { BN_USDC_CENT_WEI } from '@audius/common/utils'
import BN from 'bn.js'
import { range } from 'lodash'
import { all, call, put, select } from 'typed-redux-saga'

import { make } from 'common/store/analytics/actions'
import { TrackForUpload } from 'pages/upload-page/types'
import { waitForWrite } from 'utils/sagaHelpers'
const { getAccountUser } = accountSelectors

export function* reportResultEvents({
  numSuccess,
  numFailure,
  numRejected,
  uploadType,
  errors
}: {
  numSuccess: number
  numFailure: number
  numRejected: number
  uploadType: 'single_track' | 'multi_track' | 'album' | 'playlist'
  errors: string[]
}) {
  yield* waitForWrite()
  const accountUser = yield* select(getAccountUser)
  if (!accountUser) return
  const primary = accountUser.creator_node_endpoint?.split(',')[0]
  if (!primary) return
  const successEvents = range(numSuccess).map((_) =>
    make(Name.TRACK_UPLOAD_SUCCESS, {
      endpoint: primary,
      kind: uploadType
    })
  )

  const failureEvents = range(numFailure).map((i) =>
    make(Name.TRACK_UPLOAD_FAILURE, {
      endpoint: primary,
      kind: uploadType,
      error: errors[i]
    })
  )

  const rejectedEvents = range(numRejected).map((i) =>
    make(Name.TRACK_UPLOAD_REJECTED, {
      endpoint: primary,
      kind: uploadType,
      error: errors[i]
    })
  )

  yield* all(
    [...successEvents, ...failureEvents, ...rejectedEvents].map((e) => put(e))
  )
}

// Record gated track uploads
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

export function* processTrackForUpload<T extends TrackMetadata>(track: T) {
  const getFeatureEnabled = yield* getContext('getFeatureEnabled')
  const isUsdcPurchaseEnabled = yield* call(
    getFeatureEnabled,
    FeatureFlags.USDC_PURCHASES
  )
  if (!isUsdcPurchaseEnabled) return track

  const ownerAccount = yield* select(getAccountUser)
  const wallet = ownerAccount?.erc_wallet ?? ownerAccount?.wallet
  const ownerUserbank = yield* getUSDCUserBank(wallet)

  if (isContentUSDCPurchaseGated(track.stream_conditions)) {
    const priceCents = track.stream_conditions.usdc_purchase.price
    const priceWei = new BN(priceCents).mul(BN_USDC_CENT_WEI).toNumber()
    track.stream_conditions.usdc_purchase = {
      price: priceCents,
      splits: {
        [ownerUserbank?.toString() ?? '']: priceWei
      }
    }
  }
  if (isContentUSDCPurchaseGated(track.download_conditions)) {
    const priceCents = track.download_conditions.usdc_purchase.price
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
