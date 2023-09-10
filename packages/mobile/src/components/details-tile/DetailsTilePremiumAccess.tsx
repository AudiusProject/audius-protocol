import type { ID, PremiumConditions } from '@audius/common'
import {
  isPremiumContentCollectibleGated,
  isPremiumContentFollowGated,
  isPremiumContentTipGated
} from '@audius/common'
import type { ViewStyle } from 'react-native'

import { DetailsTileHasAccess } from './DetailsTileHasAccess'
import { DetailsTileNoAccess } from './DetailsTileNoAccess'

type DetailsTilePremiumAccessProps = {
  trackId: ID
  premiumConditions: PremiumConditions
  isOwner: boolean
  doesUserHaveAccess: boolean
  style?: ViewStyle
}

export const DetailsTilePremiumAccess = ({
  trackId,
  premiumConditions,
  isOwner,
  doesUserHaveAccess,
  style
}: DetailsTilePremiumAccessProps) => {
  const shouldDisplay =
    isPremiumContentCollectibleGated(premiumConditions) ||
    isPremiumContentFollowGated(premiumConditions) ||
    isPremiumContentTipGated(premiumConditions)

  if (!shouldDisplay) return null

  if (doesUserHaveAccess) {
    return (
      <DetailsTileHasAccess
        premiumConditions={premiumConditions}
        isOwner={isOwner}
        style={style}
      />
    )
  }

  return (
    <DetailsTileNoAccess
      trackId={trackId}
      premiumConditions={premiumConditions}
      style={style}
    />
  )
}
