import {
  BN_USDC_CENT_WEI,
  FeatureFlags,
  Name,
  accountSelectors,
  getContext,
  getUSDCUserBank,
  isPremiumContentCollectibleGated,
  isPremiumContentFollowGated,
  isPremiumContentUSDCPurchaseGated,
  isPremiumContentTipGated,
  TrackMetadata
} from '@audius/common'
import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import { range } from 'lodash'
import { all, call, put, select } from 'typed-redux-saga'

import { make } from 'common/store/analytics/actions'
import { TrackForUpload } from 'pages/upload-page/types'
import { waitForWrite } from 'utils/sagaHelpers'
const { getAccountUser } = accountSelectors

const ENVIRONMENT = process.env.REACT_APP_ENVIRONMENT

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
      const { is_premium: isPremium, premium_conditions: premiumConditions } =
        'metadata' in trackOrMetadata
          ? trackOrMetadata.metadata
          : trackOrMetadata
      if (isPremium && premiumConditions) {
        if (isPremiumContentCollectibleGated(premiumConditions)) {
          out.push(
            make(Name.TRACK_UPLOAD_COLLECTIBLE_GATED, { kind: 'tracks' })
          )
        } else if (isPremiumContentFollowGated(premiumConditions)) {
          out.push(make(Name.TRACK_UPLOAD_FOLLOW_GATED, { kind: 'tracks' }))
        } else if (isPremiumContentTipGated(premiumConditions)) {
          out.push(make(Name.TRACK_UPLOAD_TIP_GATED, { kind: 'tracks' }))
        } else if (isPremiumContentUSDCPurchaseGated(premiumConditions)) {
          out.push(
            make(Name.TRACK_UPLOAD_USDC_GATED, {
              kind: 'tracks',
              price: premiumConditions.usdc_purchase.price / 100
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
    const premium_conditions = track.metadata.premium_conditions
    if (isPremiumContentUSDCPurchaseGated(premium_conditions)) {
      const priceCents = premium_conditions.usdc_purchase.price
      const priceWei = new BN(priceCents).mul(BN_USDC_CENT_WEI).toNumber()
      premium_conditions.usdc_purchase = {
        price: priceCents,
        splits: {
          [ownerUserbank?.toString() ?? '']: priceWei
        }
      }
    }
  })

  return tracks
}
