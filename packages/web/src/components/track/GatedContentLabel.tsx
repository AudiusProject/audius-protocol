import {
  isContentCollectibleGated,
  isContentUSDCPurchaseGated,
  AccessConditions,
  isContentFollowGated,
  isContentTipGated
} from '@audius/common/models'
import { Nullable } from '@audius/common/utils'
import {
  IconCart,
  IconCollectible,
  IconSpecialAccess,
  IconColors
} from '@audius/harmony'

import { LineupTileLabel } from './LineupTileLabel'

const messages = {
  collectibleGated: 'Collectible Gated',
  specialAccess: 'Special Access',
  premium: 'Premium'
}

type GatedContentLabelProps = {
  streamConditions?: Nullable<AccessConditions>
  hasStreamAccess: boolean
  isOwner: boolean
}

/** Renders a label indicating a gated content type. If the user does
 * not yet have access or is the owner, the label will be in an accented color.
 */
export const GatedContentLabel = (props: GatedContentLabelProps) => {
  const { streamConditions, hasStreamAccess, isOwner } = props
  let message = messages.specialAccess
  let IconComponent = IconSpecialAccess
  let specialColor: IconColors = 'subdued'

  if (
    isContentFollowGated(streamConditions) ||
    isContentTipGated(streamConditions)
  ) {
    specialColor = 'special'
  } else if (isContentCollectibleGated(streamConditions)) {
    message = messages.collectibleGated
    IconComponent = IconCollectible
    specialColor = 'special'
  } else if (isContentUSDCPurchaseGated(streamConditions)) {
    message = messages.premium
    IconComponent = IconCart
    specialColor = 'premium'
  }

  specialColor = isOwner || !hasStreamAccess ? specialColor : 'subdued'

  return (
    <LineupTileLabel icon={IconComponent} color={specialColor}>
      {message}
    </LineupTileLabel>
  )
}
