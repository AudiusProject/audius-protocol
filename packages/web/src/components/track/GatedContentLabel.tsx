import {
  isContentCollectibleGated,
  isContentUSDCPurchaseGated,
  AccessConditions
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
  const showColor = isOwner || !hasStreamAccess
  let message = messages.specialAccess
  let IconComponent = IconSpecialAccess
  let iconColor = color.special.blue

  if (isContentCollectibleGated(streamConditions)) {
    message = messages.collectibleGated
    IconComponent = IconCollectible
  }
  if (isContentUSDCPurchaseGated(streamConditions)) {
    message = messages.premium
    IconComponent = IconCart
    iconColor = color.special.lightGreen
  }

  return (
    <Flex alignItems='center' gap='xs'>
      <IconComponent size='s' fill={showColor ? iconColor : undefined} />
      <Text variant='body' size='xs' css={{ color: iconColor }}>
        {message}
      </Text>
    </Flex>
  )
}
