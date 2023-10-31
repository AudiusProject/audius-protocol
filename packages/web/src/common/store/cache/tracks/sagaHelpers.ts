import {
  Name,
  Track,
  TrackAccessType,
  accountSelectors,
  isPremiumContentCollectibleGated,
  isPremiumContentFollowGated,
  isPremiumContentTipGated,
  isPremiumContentUSDCPurchaseGated
} from '@audius/common'
import { put, select } from 'typed-redux-saga'

import { make } from 'common/store/analytics/actions'

const { getUserHandle } = accountSelectors

function getTrackAccess({
  is_premium,
  premium_conditions
}: Track): TrackAccessType {
  if (is_premium && premium_conditions) {
    if (isPremiumContentFollowGated(premium_conditions)) {
      return TrackAccessType.FOLLOW_GATED
    } else if (isPremiumContentTipGated(premium_conditions)) {
      return TrackAccessType.TIP_GATED
    } else if (isPremiumContentCollectibleGated(premium_conditions)) {
      return TrackAccessType.COLLECTIBLE_GATED
    } else if (isPremiumContentUSDCPurchaseGated(premium_conditions)) {
      return TrackAccessType.USDC_GATED
    }
  }
  return TrackAccessType.PUBLIC
}

/** Detects and dispatches any analytics events we are interested in for a track edit */
export function* recordEditTrackAnalytics(prevTrack: Track, newTrack: Track) {
  // Note: if remixes is not defined in field_visibility, it defaults to true
  if (
    (prevTrack?.field_visibility?.remixes ?? true) &&
    newTrack?.field_visibility?.remixes === false
  ) {
    const handle = yield* select(getUserHandle)
    // Record event if hide remixes was turned on
    yield* put(
      make(Name.REMIX_HIDE, {
        id: newTrack.track_id,
        handle
      })
    )
  }
  const prevTrackAccess = getTrackAccess(prevTrack)
  const newTrackAccess = getTrackAccess(newTrack)
  if (prevTrackAccess !== newTrackAccess) {
    yield* put(
      make(Name.TRACK_EDIT_ACCESS_CHANGED, {
        id: newTrack.track_id,
        from: prevTrackAccess,
        to: newTrackAccess
      })
    )
  }
}
