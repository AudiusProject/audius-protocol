import { useGetTrackById } from '~/api'
import {
  isContentSpecialAccess,
  isContentCollectibleGated,
  isContentUSDCPurchaseGated,
  ID
} from '~/models'

export const useIsTrackUnlockable = (trackId: ID) => {
  const { data: track } = useGetTrackById({ id: trackId })

  if (!track) return false
  const { stream_conditions } = track
  const isPurchaseable = isContentUSDCPurchaseGated(stream_conditions)
  const isCollectibleGated = isContentCollectibleGated(stream_conditions)
  const isSpecialAccess = isContentSpecialAccess(stream_conditions)

  return isPurchaseable || isCollectibleGated || isSpecialAccess
}
