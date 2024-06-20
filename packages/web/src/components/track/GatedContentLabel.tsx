import {
  isContentCollectibleGated,
  isContentUSDCPurchaseGated,
  AccessConditions,
  isContentFollowGated,
  isContentTipGated
} from '@audius/common/models'
import { Nullable } from '@audius/common/utils'
import {
  Flex,
  Text,
  IconCart,
  IconCollectible,
  IconSpecialAccess,
  useTheme
} from '@audius/harmony'

const messages = {
  collectibleGated: 'Collectible Gated',
  specialAccess: 'Special Access',
  premium: 'Premium'
}

/** Renders a label indicating a gated content type. If the user does
 * not yet have access or is the owner, the label will be in an accented color.
 */
export const GatedContentLabel = ({
  streamConditions,
  hasStreamAccess,
  isOwner
}: {
  streamConditions?: Nullable<AccessConditions>
  hasStreamAccess: boolean
  isOwner: boolean
}) => {
  const { color } = useTheme()
  let message = messages.specialAccess
  let IconComponent = IconSpecialAccess
  let specialColor = color.icon.default

  if (
    isContentFollowGated(streamConditions) ||
    isContentTipGated(streamConditions)
  ) {
    specialColor = color.special.blue
  } else if (isContentCollectibleGated(streamConditions)) {
    message = messages.collectibleGated
    IconComponent = IconCollectible
    specialColor = color.special.blue
  } else if (isContentUSDCPurchaseGated(streamConditions)) {
    message = messages.premium
    IconComponent = IconCart
    specialColor = color.special.lightGreen
  }

  const finalColor =
    isOwner || !hasStreamAccess ? specialColor : color.icon.default

  return (
    <Flex alignItems='center' gap='xs'>
      <IconComponent size='s' fill={finalColor} />
      <Text variant='body' size='xs' css={{ color: finalColor }}>
        {message}
      </Text>
    </Flex>
  )
}
