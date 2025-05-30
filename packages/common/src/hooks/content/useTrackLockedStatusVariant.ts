import { useSelector } from 'react-redux'

import {
  ID,
  isContentCollectibleGated,
  isContentSpecialAccess,
  isContentUSDCPurchaseGated
} from '~/models'
import { CommonState } from '~/store'
import { getTrack } from '~/store/cache/tracks/selectors'
import { Nullable } from '~/utils'

import { LockedStatusVariant } from './types'

export const useTrackLockedStatusVariant = (trackId: ID) => {
  const streamConditions = useSelector((state: CommonState) => {
    return getTrack(state, { id: trackId })?.stream_conditions
  })

  const isPurchaseable = isContentUSDCPurchaseGated(streamConditions)
  const isCollectibleGated = isContentCollectibleGated(streamConditions)
  const isSpecialAccess = isContentSpecialAccess(streamConditions)

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
