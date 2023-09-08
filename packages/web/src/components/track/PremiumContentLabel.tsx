import {
  PremiumConditions,
  Nullable,
  isPremiumContentCollectibleGated,
  isPremiumContentUSDCPurchaseGated
} from '@audius/common'
import { IconCart, IconCollectible, IconSpecialAccess } from '@audius/stems'
import cn from 'classnames'

import styles from './PremiumContentLabel.module.css'

const messages = {
  collectibleGated: 'Collectible Gated',
  specialAccess: 'Special Access',
  premium: 'Premium'
}

/** Renders a label indicating a premium content type. If the user does
 * not yet have access or is the owner, the label will be in an accented color.
 */
export const PremiumContentLabel = ({
  premiumConditions,
  doesUserHaveAccess,
  isOwner
}: {
  premiumConditions?: Nullable<PremiumConditions>
  doesUserHaveAccess: boolean
  isOwner: boolean
}) => {
  const showColor = isOwner || !doesUserHaveAccess
  let message = messages.specialAccess
  let IconComponent = IconSpecialAccess
  let colorStyle = styles.gatedContent

  if (isPremiumContentCollectibleGated(premiumConditions)) {
    message = messages.collectibleGated
    IconComponent = IconCollectible
  }
  if (isPremiumContentUSDCPurchaseGated(premiumConditions)) {
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
