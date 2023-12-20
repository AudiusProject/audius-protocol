import {
  StreamConditions,
  Nullable,
  isContentCollectibleGated,
  isContentUSDCPurchaseGated
} from '@audius/common'
import { IconCart, IconCollectible, IconSpecialAccess } from '@audius/stems'
import cn from 'classnames'

import styles from './GatedContentLabel.module.css'

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
  doesUserHaveAccess,
  isOwner
}: {
  streamConditions?: Nullable<StreamConditions>
  doesUserHaveAccess: boolean
  isOwner: boolean
}) => {
  const showColor = isOwner || !doesUserHaveAccess
  let message = messages.specialAccess
  let IconComponent = IconSpecialAccess
  let colorStyle = styles.gatedContent

  if (isContentCollectibleGated(streamConditions)) {
    message = messages.collectibleGated
    IconComponent = IconCollectible
  }
  if (isContentUSDCPurchaseGated(streamConditions)) {
    message = messages.premium
    IconComponent = IconCart
    colorStyle = styles.premiumContent
  }

  return (
    <div className={cn(styles.labelContainer, { [colorStyle]: showColor })}>
      <IconComponent className={styles.icon} />
      {message}
    </div>
  )
}
