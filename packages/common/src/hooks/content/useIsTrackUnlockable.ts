import { useSelector } from 'react-redux'

import {
  isContentSpecialAccess,
  isContentCollectibleGated,
  isContentUSDCPurchaseGated,
  ID
} from '~/models'
import { CommonState } from '~/store'
import { getTrack } from '~/store/cache/tracks/selectors'

export const useIsTrackUnlockable = (trackId: ID) => {
  return useSelector((state: CommonState) => {
    const streamConditions = getTrack(state, { id: trackId })?.stream_conditions

    const isPurchaseable = isContentUSDCPurchaseGated(streamConditions)
    const isCollectibleGated = isContentCollectibleGated(streamConditions)
    const isSpecialAccess = isContentSpecialAccess(streamConditions)

    return isPurchaseable || isCollectibleGated || isSpecialAccess
  })
}
