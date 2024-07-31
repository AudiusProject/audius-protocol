import {
  AccessConditions,
  isContentCollectibleGated,
  isContentFollowGated,
  isContentTipGated,
  isContentUSDCPurchaseGated,
  StreamTrackAvailabilityType
} from '~/models'

import { Nullable } from './typeUtils'

// Returns whether some users may lose access based on the new audience.
export const getUsersMayLoseAccess = ({
  availability,
  initialStreamConditions,
  specialAccessType
}: {
  availability: StreamTrackAvailabilityType
  initialStreamConditions?: Nullable<AccessConditions>
  specialAccessType?: 'follow' | 'tip'
}) => {
  const isInitiallyUsdcGated = isContentUSDCPurchaseGated(
    initialStreamConditions
  )
  const isInitiallyTipGated = isContentTipGated(initialStreamConditions)
  const isInitiallyFollowGated = isContentFollowGated(initialStreamConditions)
  const isInitiallyCollectibleGated = isContentCollectibleGated(
    initialStreamConditions
  )

  const stillUsdcGated =
    isInitiallyUsdcGated &&
    availability === StreamTrackAvailabilityType.USDC_PURCHASE
  const stillFollowGated =
    isInitiallyFollowGated &&
    availability === StreamTrackAvailabilityType.SPECIAL_ACCESS &&
    specialAccessType === 'follow'
  const stillTipGated =
    isInitiallyTipGated &&
    availability === StreamTrackAvailabilityType.SPECIAL_ACCESS &&
    specialAccessType === 'tip'
  const stillCollectibleGated =
    isInitiallyCollectibleGated &&
    availability === StreamTrackAvailabilityType.COLLECTIBLE_GATED
  const stillSameGate =
    stillUsdcGated || stillFollowGated || stillTipGated || stillCollectibleGated

  return (
    !stillSameGate &&
    !isInitiallyUsdcGated &&
    // why do we have both FREE and PUBLIC types
    // and when is one used over the other?
    ![
      StreamTrackAvailabilityType.FREE,
      StreamTrackAvailabilityType.PUBLIC
    ].includes(availability)
  )
}
