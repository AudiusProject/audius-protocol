import {
  isContentCollectibleGated,
  isContentUSDCPurchaseGated,
  AccessConditions,
  isContentFollowGated,
  isContentTipGated,
  isContentCrowdfundGated
} from '@audius/common/models'
import { Nullable } from '@audius/common/utils'
import {
  Flex,
  Text,
  IconCart,
  IconCollectible,
  IconSpecialAccess,
  useTheme,
  IconUserGroup
} from '@audius/harmony'

const messages = {
  collectibleGated: 'Collectible Gated',
  specialAccess: 'Special Access',
  premium: 'Premium',
  crowdfund: 'Crowdfund Drop'
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
  } else if (isContentCrowdfundGated(streamConditions)) {
    message = messages.crowdfund
    IconComponent = IconUserGroup
    specialColor = '#49b69c'
  }

  const finalColor =
    isOwner || !hasStreamAccess ? specialColor : color.icon.subdued

  return (
    <Flex alignItems='center' gap='xs' css={{ whiteSpace: 'nowrap' }}>
      <IconComponent size='s' fill={finalColor} />
      <Text variant='body' size='xs' css={{ color: finalColor }}>
        {message}
      </Text>
    </Flex>
  )
}
