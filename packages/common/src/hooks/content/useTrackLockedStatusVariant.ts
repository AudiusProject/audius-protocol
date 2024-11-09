import { useGetTrackById } from '~/api'
import {
  ID,
  isContentCollectibleGated,
  isContentSpecialAccess,
  isContentUSDCPurchaseGated
} from '~/models'
import { Nullable } from '~/utils'

import { LockedStatusVariant } from './types'

export const useTrackLockedStatusVariant = (trackId: ID) => {
  const { data: track } = useGetTrackById(
    { id: trackId },
    { disabled: !trackId }
  )

  if (!track) return null
  const { stream_conditions } = track

  const isPurchaseable = isContentUSDCPurchaseGated(stream_conditions)
  const isCollectibleGated = isContentCollectibleGated(stream_conditions)
  const isSpecialAccess = isContentSpecialAccess(stream_conditions)

  let variant: Nullable<LockedStatusVariant> = null
  if (isPurchaseable) {
    variant = 'premium'
  } else if (isCollectibleGated) {
    variant = 'gated'
  } else if (isSpecialAccess) {
    variant = 'gated'
  }

  return variant
}
