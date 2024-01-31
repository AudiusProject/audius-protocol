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
import { PublicKey } from '@solana/web3.js'
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
        stream_conditions: streamConditions
      } =
        'metadata' in trackOrMetadata
          ? trackOrMetadata.metadata
          : trackOrMetadata
      if (isStreamGated && streamConditions) {
        if (isContentCollectibleGated(streamConditions)) {
          out.push(
            make(Name.TRACK_UPLOAD_COLLECTIBLE_GATED, { kind: 'tracks' })
          )
        } else if (isContentFollowGated(streamConditions)) {
          out.push(make(Name.TRACK_UPLOAD_FOLLOW_GATED, { kind: 'tracks' }))
        } else if (isContentTipGated(streamConditions)) {
          out.push(make(Name.TRACK_UPLOAD_TIP_GATED, { kind: 'tracks' }))
        } else if (isContentUSDCPurchaseGated(streamConditions)) {
          out.push(
            make(Name.TRACK_UPLOAD_USDC_GATED, {
              kind: 'tracks',
              price: streamConditions.usdc_purchase.price / 100
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

export function* processTracksForUpload(tracks: TrackForUpload[]) {
  const { ENVIRONMENT } = yield* getContext('env')
  const getFeatureEnabled = yield* getContext('getFeatureEnabled')
  const isUsdcPurchaseEnabled = yield* call(
    getFeatureEnabled,
    FeatureFlags.USDC_PURCHASES
  )
  if (!isUsdcPurchaseEnabled) return tracks

  const ownerAccount = yield* select(getAccountUser)
  const wallet = ownerAccount?.erc_wallet ?? ownerAccount?.wallet

  // TODO: Figure out how to support USDC properly in dev.
  let ownerUserbank: PublicKey
  if (ENVIRONMENT !== 'development') {
    ownerUserbank = yield* getUSDCUserBank(wallet)
  }

  tracks.forEach((track) => {
    const streamConditions = track.metadata.stream_conditions
    if (isContentUSDCPurchaseGated(streamConditions)) {
      const priceCents = streamConditions.usdc_purchase.price
      const priceWei = new BN(priceCents).mul(BN_USDC_CENT_WEI).toNumber()
      streamConditions.usdc_purchase = {
        price: priceCents,
        splits: {
          [ownerUserbank?.toString() ?? '']: priceWei
        }
      }
    }
  })

  return tracks
}
