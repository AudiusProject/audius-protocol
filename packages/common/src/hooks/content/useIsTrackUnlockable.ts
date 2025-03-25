import { useTrack } from '~/api'
import {
  isContentSpecialAccess,
  isContentCollectibleGated,
  isContentUSDCPurchaseGated,
  ID
} from '~/models'

export const useIsTrackUnlockable = (trackId: ID) => {
  const { data: streamConditions } = useTrack(trackId, {
    select: (track) => {
      return track.stream_conditions
    }
  })

  const isPurchaseable = isContentUSDCPurchaseGated(streamConditions)
  const isCollectibleGated = isContentCollectibleGated(streamConditions)
  const isSpecialAccess = isContentSpecialAccess(streamConditions)

  return isPurchaseable || isCollectibleGated || isSpecialAccess
}
