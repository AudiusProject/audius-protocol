import { useTrack } from '~/api'
import {
  isContentSpecialAccess,
  isContentCollectibleGated,
  isContentUSDCPurchaseGated,
  ID
} from '~/models'

export const useIsTrackUnlockable = (trackId: ID) => {
  const { data: track } = useTrack(trackId, {
    select: (track) => {
      return {
        streamConditions: track.stream_conditions
      }
    }
  })
  const streamConditions = track?.streamConditions

  const isPurchaseable = isContentUSDCPurchaseGated(streamConditions)
  const isCollectibleGated = isContentCollectibleGated(streamConditions)
  const isSpecialAccess = isContentSpecialAccess(streamConditions)

  return isPurchaseable || isCollectibleGated || isSpecialAccess
}
